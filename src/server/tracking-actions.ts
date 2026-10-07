"use server";

import { getOrderByNumber, listOrdersByCustomerEmail, type OrderRecord } from "@/lib/orders-repository";
import { getCustomerUser, createCustomerMagicLinkToken, logoutCustomer } from "@/lib/auth";
import { sendCustomerMagicLinkEmail } from "@/lib/email/resend";

export interface PublicTrackingResult {
  orderNumber: string;
  customerFirstName: string;
  status: string;
  createdAt: Date;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  carrierDays: number;
  productionDays: number;
  totalDeliveryDays: number;
  shippingCarrier: string;
  trackingCode?: string | null;
  shippingCity: string;
  shippingState: string;
  paymentMethod: string;
  paymentStatus: string;
  finalAmountCents: number;
  pixQrCode?: string | null;
  pixExpiresAt?: Date | null;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    imageUrl: string;
    unitPriceCents: number;
  }>;
}

/**
 * Consulta pública de rastreamento com validação de privacidade por e-mail ou CPF.
 */
export async function trackOrderPublicAction(
  orderNumber: string,
  verificationKey: string
): Promise<{ success: boolean; data?: PublicTrackingResult; error?: string }> {
  const cleanOrderNumber = orderNumber?.trim().toUpperCase();
  const cleanKey = verificationKey?.trim().toLowerCase();

  if (!cleanOrderNumber || !cleanKey) {
    return {
      success: false,
      error: "Informe o número do pedido e o e-mail cadastrado na compra.",
    };
  }

  const order = await getOrderByNumber(cleanOrderNumber);
  if (!order) {
    return {
      success: false,
      error: "Pedido não localizado. Verifique o número informado.",
    };
  }

  // Validação de privacidade: confere se o e-mail ou o CPF coincidem
  const emailMatches = order.customerEmail.toLowerCase() === cleanKey;
  const cpfMatches = order.customerCpf.replace(/\D/g, "") === cleanKey.replace(/\D/g, "");

  if (!emailMatches && !cpfMatches) {
    return {
      success: false,
      error: "Os dados de verificação não conferem com o pedido informado.",
    };
  }

  const firstName = order.customerName.trim().split(" ")[0] || "Cliente";

  const publicData: PublicTrackingResult = {
    orderNumber: order.orderNumber,
    customerFirstName: firstName,
    status: order.status,
    createdAt: order.createdAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    carrierDays: order.carrierDays,
    productionDays: order.productionDays,
    totalDeliveryDays: order.totalDeliveryDays,
    shippingCarrier: order.shippingCarrier,
    trackingCode: order.trackingCode,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    finalAmountCents: order.finalAmountCents,
    pixQrCode: order.status === "AGUARDANDO_PAGAMENTO" ? order.pixQrCode : null,
    pixExpiresAt: order.pixExpiresAt,
    items: (order.items || []).map((item) => ({
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      unitPriceCents: item.unitPriceCents,
    })),
  };

  return { success: true, data: publicData };
}

/**
 * Consulta de pedidos do cliente autenticado na área do cliente (/conta/pedidos).
 */
export async function getCustomerOrdersAction(): Promise<{
  success: boolean;
  orders?: OrderRecord[];
  user?: { name: string; email: string };
  error?: string;
}> {
  const user = await getCustomerUser();
  if (!user) {
    return { success: false, error: "Não autenticado." };
  }

  const orders = await listOrdersByCustomerEmail(user.email);
  return {
    success: true,
    orders,
    user: { name: user.name, email: user.email },
  };
}

/**
 * Envia um link mágico de acesso para o e-mail informado.
 * O cliente só entra na conta ao abrir o link recebido no próprio e-mail,
 * o que impede alguém de ver os pedidos de outra pessoa digitando o e-mail dela
 * (mistakes.md M-005). A resposta é sempre a mesma, exista ou não pedido no e-mail.
 */
export async function customerLoginAction(
  email: string
): Promise<{ success: boolean; error?: string; message?: string; devLink?: string }> {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: "Informe um endereço de e-mail válido." };
  }

  const token = await createCustomerMagicLinkToken(cleanEmail);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const link = `${siteUrl}/conta/entrar?token=${encodeURIComponent(token)}`;

  const sent = await sendCustomerMagicLinkEmail(cleanEmail, link);
  if (!sent.success) {
    return { success: false, error: "Não foi possível enviar o link de acesso. Tente novamente." };
  }

  return {
    success: true,
    message: `Enviamos um link de acesso para ${cleanEmail}. Ele vale por 20 minutos.`,
    devLink: process.env.NODE_ENV !== "production" ? link : undefined,
  };
}

/**
 * Desconecta a sessão do cliente.
 */
export async function customerLogoutAction(): Promise<void> {
  await logoutCustomer();
}
