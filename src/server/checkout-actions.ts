"use server";

import {
  saveOrder,
  getOrderById,
  attachPaymentToOrder,
  updateOrderStatus,
  type OrderRecord,
  type OrderItemRecord,
} from "@/lib/orders-repository";
import { calculateCartTotals, type AppliedCoupon } from "@/lib/pricing";
import { calculateShippingQuotes } from "@/lib/shipping/melhor-envio";
import { createPixPayment, createCardPayment } from "@/lib/payments/mercadopago";
import { sendOrderCreatedEmail, sendPaymentConfirmedEmail } from "@/lib/email/resend";
import { SEED_PRODUCTS } from "@/lib/data/catalog-seed";
import { formatVariantDisplayName, getVariantColors } from "@/lib/catalog";
import { validateCouponAction } from "./cart-actions";
import { incrementCouponUsage } from "@/lib/promotions-repository";
import { db } from "@/lib/db";

export interface CheckoutCustomerInput {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

export interface CheckoutAddressInput {
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CheckoutItemInput {
  variantId: string;
  quantity: number;
}

export interface CheckoutPayload {
  customer: CheckoutCustomerInput;
  shippingAddress: CheckoutAddressInput;
  shippingOptionId: string; // "correios-pac", "correios-sedex", etc.
  paymentMethod: "PIX" | "CREDIT_CARD";
  cardData?: {
    token: string;
    installments: number;
    paymentMethodId: string;
    issuerId?: string;
  };
  items: CheckoutItemInput[];
  couponCode?: string | null;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  finalAmountCents?: number;
  paymentMethod?: "PIX" | "CREDIT_CARD";
  pixQrCode?: string | null;
  pixQrCodeUrl?: string | null;
  pixExpiresAt?: string | null;
  status?: string;
  error?: string;
}

/**
 * Validação básica de CPF (11 dígitos).
 */
function isValidCpf(rawCpf: string): boolean {
  const clean = rawCpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  // Bloqueia sequências repetidas comuns
  if (/^(\d)\1{10}$/.test(clean)) return false;
  return true;
}

/**
 * Número de pedido amigável e sem colisão prática (ex.: MKB-7K3Q9Z).
 * O formato antigo (5 dígitos aleatórios) colidia com poucas centenas de pedidos.
 */
function generateOrderNumber(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sem 0/O/1/I para evitar confusão
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `MKB-${code}`;
}

/**
 * Server Action principal de criação e processamento de pedido.
 * Regra P-001: Recálculo estrito de todos os preços no servidor.
 */
export async function createOrderAction(
  payload: CheckoutPayload
): Promise<CreateOrderResult> {
  try {
    // 1. Validações cadastrais
    const customer = payload.customer;
    if (!customer.name || customer.name.trim().length < 3) {
      return { success: false, error: "Nome completo é obrigatório." };
    }
    if (!customer.email || !customer.email.includes("@")) {
      return { success: false, error: "E-mail de contato inválido." };
    }
    if (!customer.phone || customer.phone.replace(/\D/g, "").length < 10) {
      return { success: false, error: "Telefone com DDD é obrigatório." };
    }
    if (!isValidCpf(customer.cpf)) {
      return { success: false, error: "CPF informado é inválido." };
    }

    const addr = payload.shippingAddress;
    const cleanCep = addr.postalCode.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      return { success: false, error: "CEP de entrega inválido." };
    }
    if (!addr.street || !addr.number || !addr.city || !addr.state) {
      return { success: false, error: "Preencha todos os campos obrigatórios do endereço." };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "O carrinho está vazio." };
    }

    // 2. Reconstitui os itens diretamente da fonte do catálogo no servidor (P-001)
    const orderItems: OrderItemRecord[] = [];
    const shippingItemsInput = [];

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orderNumber = generateOrderNumber();

    for (const clientItem of payload.items) {
      let foundProduct = null;
      let foundVariant = null;

      for (const p of SEED_PRODUCTS) {
        const v = p.variants.find((variant) => variant.id === clientItem.variantId);
        if (v) {
          foundProduct = p;
          foundVariant = v;
          break;
        }
      }

      // Se não encontrou no catálogo estático, busca no banco de dados (Prisma)
      if (!foundProduct || !foundVariant) {
        try {
          const dbVariant = await db.productVariant.findUnique({
            where: { id: clientItem.variantId },
            include: { product: { include: { images: true } } },
          });
          if (dbVariant && dbVariant.product) {
            foundProduct = {
              id: dbVariant.product.id,
              name: dbVariant.product.name,
              slug: dbVariant.product.slug,
              description: dbVariant.product.description || "",
              categorySlug: "decoracao",
              collectionSlugs: [],
              material: "PLA" as const,
              isSustainable: true,
              productionDays: dbVariant.product.productionDays || 3,
              dimensions: dbVariant.product.dimensions || "",
              weightGrams: dbVariant.weightGrams,
              images: dbVariant.product.images.map((img) => ({
                id: img.id,
                url: img.url,
                alt: img.alt,
                isPrimary: img.isPrimary,
                isHover: img.isHover,
              })),
              options: [],
              variants: [],
            };
            foundVariant = {
              id: dbVariant.id,
              sku: dbVariant.sku,
              priceCents: dbVariant.priceCents,
              weightGrams: dbVariant.weightGrams,
              packageHeightCm: dbVariant.packageHeightCm,
              packageWidthCm: dbVariant.packageWidthCm,
              packageDepthCm: dbVariant.packageDepthCm,
              active: dbVariant.active,
              selectedOptionValueIds: [],
            };
          }
        } catch {
          // ignore
        }
      }

      if (!foundProduct || !foundVariant) {
        return {
          success: false,
          error: `Produto ou variação não encontrado no catálogo (${clientItem.variantId}).`,
        };
      }

      const qty = Math.max(1, Math.floor(clientItem.quantity));
      const unitPriceCents = foundVariant.priceCents;
      const totalPriceCents = unitPriceCents * qty;

      // Identifica a descrição completa da variação e cores
      const variantName = formatVariantDisplayName(foundProduct, foundVariant);
      const variantColors = getVariantColors(foundProduct, foundVariant);
      const colorHex = variantColors[0]?.hex || null;

      orderItems.push({
        id: `item_${orderId}_${foundVariant.id}`,
        orderId,
        productId: foundProduct.id,
        variantId: foundVariant.id,
        productName: foundProduct.name,
        productSlug: foundProduct.slug,
        variantSku: foundVariant.sku,
        variantName,
        colorHex,
        imageUrl:
          foundProduct.images.find((img) => img.isPrimary)?.url ||
          foundProduct.images[0]?.url ||
          "/products/luminaria-saturno-off.svg",
        unitPriceCents,
        quantity: qty,
        totalPriceCents,
      });

      shippingItemsInput.push({
        weightGrams: foundVariant.weightGrams,
        packageHeightCm: foundVariant.packageHeightCm,
        packageWidthCm: foundVariant.packageWidthCm,
        packageDepthCm: foundVariant.packageDepthCm,
        priceCents: unitPriceCents,
        quantity: qty,
      });
    }

    // 3. Validação do cupom no servidor
    let appliedCoupon: AppliedCoupon | null = null;
    const initialSubtotalCents = orderItems.reduce((acc, i) => acc + i.totalPriceCents, 0);

    if (payload.couponCode) {
      const couponRes = await validateCouponAction(payload.couponCode, initialSubtotalCents);
      if (couponRes.success && couponRes.coupon) {
        appliedCoupon = couponRes.coupon;
      }
    }

    // 4. Recálculo das cotações de frete no servidor
    const quotes = await calculateShippingQuotes({
      destinationPostalCode: cleanCep,
      items: shippingItemsInput,
    });

    const selectedQuote =
      quotes.find((q) => q.id === payload.shippingOptionId) || quotes[0];

    if (!selectedQuote) {
      return { success: false, error: "Opção de frete selecionada inválida." };
    }

    // 5. Consolidação de totais com regras de negócio completas (pricing.ts)
    const totals = calculateCartTotals({
      items: orderItems.map((i) => ({ priceCents: i.unitPriceCents, quantity: i.quantity })),
      // Usa o preço cheio da transportadora: quem decide o frete grátis é o pricing.ts,
      // considerando o subtotal JÁ com cupom (antes, o frete grátis era concedido pelo
      // subtotal sem cupom — mistakes.md M-007).
      shippingPriceCents: selectedQuote.originalPriceCents,
      cheapestShippingPriceCents: Math.min(...quotes.map((q) => q.originalPriceCents)),
      coupon: appliedCoupon,
    });

    const isPix = payload.paymentMethod === "PIX";
    const finalAmountCents = isPix ? totals.pixTotalCents : totals.totalCents;

    // 6. Montagem inicial do registro de pedido
    const newOrder: OrderRecord = {
      id: orderId,
      orderNumber,
      customerName: customer.name.trim(),
      customerEmail: customer.email.trim().toLowerCase(),
      customerPhone: customer.phone.replace(/\D/g, ""),
      customerCpf: customer.cpf.replace(/\D/g, ""),
      status: "AGUARDANDO_PAGAMENTO",
      subtotalCents: totals.subtotalCents,
      couponCode: totals.couponCode,
      couponDiscountCents: totals.couponDiscountCents,
      discountedSubtotalCents: totals.discountedSubtotalCents,
      shippingCarrier: selectedQuote.name === "PAC" ? "Correios PAC" : selectedQuote.name,
      shippingPriceCents: totals.effectiveShippingPriceCents,
      shippingOriginalPriceCents: selectedQuote.originalPriceCents,
      isFreeShipping: totals.isFreeShippingQualified,
      carrierDays: selectedQuote.carrierDays,
      productionDays: selectedQuote.productionDays,
      totalDeliveryDays: selectedQuote.totalDays,
      totalCents: totals.totalCents,
      pixDiscountAmountCents: isPix ? totals.pixDiscountAmountCents : 0,
      finalAmountCents,
      paymentMethod: payload.paymentMethod,
      paymentStatus: "PENDING",
      shippingPostalCode: cleanCep,
      shippingStreet: addr.street.trim(),
      shippingNumber: addr.number.trim(),
      shippingComplement: addr.complement?.trim() || null,
      shippingNeighborhood: addr.neighborhood.trim(),
      shippingCity: addr.city.trim(),
      shippingState: addr.state.trim().toUpperCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
      items: orderItems,
    };

    // 7. Salva o pedido ANTES de cobrar: nunca pode existir cobrança sem pedido (D-019)
    let saved = await saveOrder(newOrder, orderItems);

    // 8. Processamento do pagamento
    if (isPix) {
      const pixRes = await createPixPayment({
        orderNumber,
        amountCents: finalAmountCents,
        customer: {
          name: customer.name,
          email: customer.email,
          cpf: customer.cpf,
        },
        itemsSummary: `${orderItems.length} itens Markah Brasil`,
      });

      if (!pixRes.success) {
        await updateOrderStatus(saved.id, "CANCELADO", "REJECTED");
        console.error("[checkout] Falha ao gerar Pix", orderNumber, pixRes.error);
        return { success: false, error: pixRes.error || "Não foi possível gerar o Pix agora. Tente novamente em instantes." };
      }

      saved =
        (await attachPaymentToOrder(saved.id, {
          paymentId: pixRes.paymentId,
          pixQrCode: pixRes.qrCode,
          pixQrCodeUrl: pixRes.qrCodeBase64 || null,
          pixExpiresAt: pixRes.expiresAt,
        })) || saved;
    } else {
      // Cartão de Crédito (token gerado pelo Card Payment Brick)
      const cardData = payload.cardData;
      if (!cardData?.token) {
        await updateOrderStatus(saved.id, "CANCELADO", "REJECTED");
        return { success: false, error: "Dados do cartão de crédito não fornecidos." };
      }

      const cardRes = await createCardPayment({
        orderNumber,
        amountCents: finalAmountCents,
        token: cardData.token,
        installments: cardData.installments || 1,
        paymentMethodId: cardData.paymentMethodId,
        issuerId: cardData.issuerId,
        customer: {
          name: customer.name,
          email: customer.email,
          cpf: customer.cpf,
        },
      });

      if (!cardRes.success) {
        await attachPaymentToOrder(saved.id, {
          status: "PAGAMENTO_RECUSADO",
          paymentStatus: "REJECTED",
          paymentId: cardRes.paymentId || null,
        });
        return { success: false, error: cardRes.error || "Pagamento no cartão recusado." };
      }

      const approved = cardRes.status === "approved";
      saved =
        (await attachPaymentToOrder(saved.id, {
          paymentId: cardRes.paymentId,
          cardBrand: cardRes.cardBrand || null,
          cardLastFour: cardRes.cardLastFour || null,
          cardInstallments: cardRes.installments,
          ...(approved ? { status: "PAGO" as const, paymentStatus: "APPROVED" as const } : {}),
        })) || saved;
    }

    // 8.1 Incrementa contador de uso do cupom se aplicado
    if (appliedCoupon?.code) {
      await incrementCouponUsage(appliedCoupon.code);
    }

    // 9. Envia e-mails (falha de e-mail não pode derrubar um pedido já pago)
    try {
      await sendOrderCreatedEmail(saved);
      if (saved.status === "PAGO") {
        await sendPaymentConfirmedEmail(saved);
      }
    } catch (emailErr) {
      console.error("[checkout] Falha ao enviar e-mail do pedido", saved.orderNumber, emailErr);
    }

    return {
      success: true,
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      finalAmountCents: saved.finalAmountCents,
      paymentMethod: saved.paymentMethod,
      pixQrCode: saved.pixQrCode,
      pixQrCodeUrl: saved.pixQrCodeUrl,
      pixExpiresAt: saved.pixExpiresAt?.toISOString() || null,
      status: saved.status,
    };
  } catch (err: unknown) {
    console.error("[checkout] Erro inesperado ao criar pedido", err);
    return {
      success: false,
      error: "Não foi possível finalizar o pedido agora. Tente novamente ou fale com a gente pelo WhatsApp.",
    };
  }
}

/**
 * Consulta status atualizado do pedido (usado na tela de confirmação Pix para pooling automático).
 */
export async function getOrderStatusAction(orderId: string) {
  try {
    const order = await getOrderById(orderId);
    if (!order) {
      return { success: false, error: "Pedido não encontrado." };
    }

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        finalAmountCents: order.finalAmountCents,
        shippingCarrier: order.shippingCarrier,
        totalDeliveryDays: order.totalDeliveryDays,
        productionDays: order.productionDays,
        pixExpiresAt: order.pixExpiresAt?.toISOString() || null,
        pixQrCode: order.pixQrCode,
        pixQrCodeUrl: order.pixQrCodeUrl,
      },
    };
  } catch {
    return { success: false, error: "Erro ao consultar status do pedido." };
  }
}
