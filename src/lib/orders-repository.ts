import { isDatabaseConfigured, assertDevFallbackAllowed } from "@/lib/runtime";
import {
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@prisma/client";
import { db } from "./db";

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  variantName: string;
  colorHex?: string | null;
  imageUrl: string;
  unitPriceCents: number;
  quantity: number;
  totalPriceCents: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf: string;
  status: OrderStatus;
  subtotalCents: number;
  couponCode?: string | null;
  couponDiscountCents: number;
  discountedSubtotalCents: number;
  shippingCarrier: string;
  shippingPriceCents: number;
  shippingOriginalPriceCents: number;
  isFreeShipping: boolean;
  carrierDays: number;
  productionDays: number;
  totalDeliveryDays: number;
  totalCents: number;
  pixDiscountAmountCents: number;
  finalAmountCents: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string | null;
  pixQrCode?: string | null;
  pixQrCodeUrl?: string | null;
  pixExpiresAt?: Date | null;
  cardBrand?: string | null;
  cardLastFour?: string | null;
  cardInstallments?: number | null;
  shippingPostalCode: string;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement?: string | null;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  trackingCode?: string | null;
  internalNotes?: string | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItemRecord[];
}

export interface WebhookEventRecord {
  id: string;
  eventId: string;
  provider: string;
  eventType: string;
  processed: boolean;
  payload?: unknown;
  createdAt: Date;
}

// Repositório em memória para desenvolvimento e testes (resiliente sem Neon)
const inMemoryOrders = new Map<string, OrderRecord>();
const inMemoryOrderItems = new Map<string, OrderItemRecord[]>();
const inMemoryWebhookEvents = new Set<string>();

/**
 * Cria ou salva um pedido e seus itens.
 */
export async function saveOrder(
  order: OrderRecord,
  items: OrderItemRecord[]
): Promise<OrderRecord> {
  // Salva no banco se disponível
  try {
    if (isDatabaseConfigured()) {
      const created = await db.order.create({
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId || null,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          customerCpf: order.customerCpf,
          status: order.status,
          subtotalCents: order.subtotalCents,
          couponCode: order.couponCode || null,
          couponDiscountCents: order.couponDiscountCents,
          discountedSubtotalCents: order.discountedSubtotalCents,
          shippingCarrier: order.shippingCarrier,
          shippingPriceCents: order.shippingPriceCents,
          shippingOriginalPriceCents: order.shippingOriginalPriceCents,
          isFreeShipping: order.isFreeShipping,
          carrierDays: order.carrierDays,
          productionDays: order.productionDays,
          totalDeliveryDays: order.totalDeliveryDays,
          totalCents: order.totalCents,
          pixDiscountAmountCents: order.pixDiscountAmountCents,
          finalAmountCents: order.finalAmountCents,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          paymentId: order.paymentId || null,
          pixQrCode: order.pixQrCode || null,
          pixQrCodeUrl: order.pixQrCodeUrl || null,
          pixExpiresAt: order.pixExpiresAt || null,
          cardBrand: order.cardBrand || null,
          cardLastFour: order.cardLastFour || null,
          cardInstallments: order.cardInstallments || null,
          shippingPostalCode: order.shippingPostalCode,
          shippingStreet: order.shippingStreet,
          shippingNumber: order.shippingNumber,
          shippingComplement: order.shippingComplement || null,
          shippingNeighborhood: order.shippingNeighborhood,
          shippingCity: order.shippingCity,
          shippingState: order.shippingState,
          items: {
            create: items.map((i) => ({
              id: i.id,
              productId: i.productId,
              variantId: i.variantId,
              productName: i.productName,
              productSlug: i.productSlug,
              variantSku: i.variantSku,
              variantName: i.variantName,
              colorHex: i.colorHex || null,
              imageUrl: i.imageUrl,
              unitPriceCents: i.unitPriceCents,
              quantity: i.quantity,
              totalPriceCents: i.totalPriceCents,
            })),
          },
        },
        include: { items: true },
      });

      const fullOrder: OrderRecord = {
        ...created,
        items: created.items,
      };
      inMemoryOrders.set(order.id, fullOrder);
      inMemoryOrderItems.set(order.id, items);
      return fullOrder;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback para memória em ambiente sem conexão com Neon (somente em desenvolvimento)
  }

  const fullOrder: OrderRecord = { ...order, items };
  inMemoryOrders.set(order.id, fullOrder);
  inMemoryOrderItems.set(order.id, items);
  return fullOrder;
}

/**
 * Busca pedido por ID.
 */
export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  try {
    if (isDatabaseConfigured()) {
      const found = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (found) {
        return found;
      }
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  const inMem = inMemoryOrders.get(orderId);
  if (inMem) {
    const items = inMemoryOrderItems.get(orderId) || [];
    return { ...inMem, items };
  }
  return null;
}

/**
 * Busca pedido por número amigável (ex: MKB-00101).
 */
export async function getOrderByNumber(
  orderNumber: string
): Promise<OrderRecord | null> {
  try {
    if (isDatabaseConfigured()) {
      const found = await db.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      });
      if (found) {
        return found;
      }
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  for (const order of inMemoryOrders.values()) {
    if (order.orderNumber === orderNumber) {
      const items = inMemoryOrderItems.get(order.id) || [];
      return { ...order, items };
    }
  }
  return null;
}

/**
 * Busca pedido pelo ID do pagamento no Mercado Pago (usado pelo webhook).
 */
export async function getOrderByPaymentId(
  paymentId: string
): Promise<OrderRecord | null> {
  try {
    if (isDatabaseConfigured()) {
      const found = await db.order.findFirst({
        where: { paymentId },
        include: { items: true },
      });
      if (found) {
        return found;
      }
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  for (const order of inMemoryOrders.values()) {
    if (order.paymentId === paymentId) {
      const items = inMemoryOrderItems.get(order.id) || [];
      return { ...order, items };
    }
  }
  return null;
}

/**
 * Grava os dados da cobrança no pedido já salvo (o pedido é salvo ANTES de cobrar,
 * para que nunca exista cobrança sem pedido — decisoes.md D-019).
 */
export async function attachPaymentToOrder(
  orderId: string,
  payment: Partial<
    Pick<
      OrderRecord,
      | "status"
      | "paymentStatus"
      | "paymentId"
      | "pixQrCode"
      | "pixQrCodeUrl"
      | "pixExpiresAt"
      | "cardBrand"
      | "cardLastFour"
      | "cardInstallments"
    >
  >
): Promise<OrderRecord | null> {
  try {
    if (isDatabaseConfigured()) {
      const updated = await db.order.update({
        where: { id: orderId },
        data: payment,
        include: { items: true },
      });
      return updated;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  const existing = inMemoryOrders.get(orderId);
  if (!existing) return null;
  const updated: OrderRecord = { ...existing, ...payment, updatedAt: new Date() };
  inMemoryOrders.set(orderId, updated);
  return { ...updated, items: inMemoryOrderItems.get(orderId) || [] };
}

/**
 * Atualiza status do pedido e do pagamento.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  paymentStatus?: PaymentStatus,
  paymentId?: string,
  extra?: {
    trackingCode?: string | null;
    internalNotes?: string | null;
    shippedAt?: Date | null;
    deliveredAt?: Date | null;
  }
): Promise<OrderRecord | null> {
  try {
    if (isDatabaseConfigured()) {
      const updated = await db.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(paymentStatus ? { paymentStatus } : {}),
          ...(paymentId ? { paymentId } : {}),
          ...(extra?.trackingCode !== undefined ? { trackingCode: extra.trackingCode } : {}),
          ...(extra?.internalNotes !== undefined ? { internalNotes: extra.internalNotes } : {}),
          ...(extra?.shippedAt !== undefined ? { shippedAt: extra.shippedAt } : {}),
          ...(extra?.deliveredAt !== undefined ? { deliveredAt: extra.deliveredAt } : {}),
        },
        include: { items: true },
      });
      inMemoryOrders.set(orderId, updated);
      return updated;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  const existing = inMemoryOrders.get(orderId);
  if (!existing) return null;

  const updated: OrderRecord = {
    ...existing,
    status,
    paymentStatus: paymentStatus || existing.paymentStatus,
    paymentId: paymentId || existing.paymentId,
    trackingCode: extra?.trackingCode !== undefined ? extra.trackingCode : existing.trackingCode,
    internalNotes: extra?.internalNotes !== undefined ? extra.internalNotes : existing.internalNotes,
    shippedAt: extra?.shippedAt !== undefined ? extra.shippedAt : existing.shippedAt,
    deliveredAt: extra?.deliveredAt !== undefined ? extra.deliveredAt : existing.deliveredAt,
    updatedAt: new Date(),
  };

  inMemoryOrders.set(orderId, updated);
  return updated;
}

/**
 * Atualiza código de rastreio e marca como ENVIADO (se aplicável).
 */
export async function updateOrderTracking(
  orderId: string,
  trackingCode: string,
  shippedAt: Date = new Date()
): Promise<OrderRecord | null> {
  const existing = await getOrderById(orderId);
  if (!existing) return null;

  const nextStatus: OrderStatus =
    existing.status === "ENTREGUE" || existing.status === "CANCELADO"
      ? existing.status
      : "ENVIADO";

  return await updateOrderStatus(orderId, nextStatus, undefined, undefined, {
    trackingCode,
    shippedAt,
  });
}

/**
 * Atualiza anotações internas da equipe Markah.
 */
export async function updateOrderInternalNotes(
  orderId: string,
  internalNotes: string
): Promise<OrderRecord | null> {
  const existing = await getOrderById(orderId);
  if (!existing) return null;

  return await updateOrderStatus(orderId, existing.status, undefined, undefined, {
    internalNotes,
  });
}

export interface ListOrdersOptions {
  status?: OrderStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListOrdersResult {
  orders: OrderRecord[];
  total: number;
}

/**
 * Garante dados de demonstração em memória se o store estiver vazio.
 */
function ensureSeedOrders(): void {
  if (inMemoryOrders.size > 0) return;

  const mockOrders: Array<{ order: OrderRecord; items: OrderItemRecord[] }> = [
    {
      order: {
        id: "ord_mkb_seed_1",
        orderNumber: "MKB-10025",
        customerName: "Lucas Mendes",
        customerEmail: "lucas.mendes@exemplo.com",
        customerPhone: "11987654321",
        customerCpf: "12345678909",
        status: "EM_PRODUCAO",
        subtotalCents: 24990,
        couponDiscountCents: 0,
        discountedSubtotalCents: 24990,
        shippingCarrier: "Sedex (Correios)",
        shippingPriceCents: 2890,
        shippingOriginalPriceCents: 2890,
        isFreeShipping: false,
        carrierDays: 3,
        productionDays: 3,
        totalDeliveryDays: 6,
        totalCents: 27880,
        pixDiscountAmountCents: 1250,
        finalAmountCents: 26630,
        paymentMethod: "PIX",
        paymentStatus: "APPROVED",
        paymentId: "pix_demo_001",
        shippingPostalCode: "01310100",
        shippingStreet: "Avenida Paulista",
        shippingNumber: "1000",
        shippingComplement: "Apto 42",
        shippingNeighborhood: "Bela Vista",
        shippingCity: "São Paulo",
        shippingState: "SP",
        internalNotes: "Impressão iniciada na Ender 3 V3 KE com PLA Premium Terracota.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      items: [
        {
          id: "item_seed_1",
          orderId: "ord_mkb_seed_1",
          productId: "prod_coluna_duna",
          variantId: "var_duna_terracota",
          productName: "Luminária Coluna Duna",
          productSlug: "luminaria-coluna-duna",
          variantSku: "DUN-TER-01",
          variantName: "Terracota",
          colorHex: "#C86D51",
          imageUrl: "/products/luminaria-coluna-duna-on.svg",
          unitPriceCents: 24990,
          quantity: 1,
          totalPriceCents: 24990,
        },
      ],
    },
    {
      order: {
        id: "ord_mkb_seed_2",
        orderNumber: "MKB-10024",
        customerName: "Camila Rodrigues",
        customerEmail: "camila.rodrigues@exemplo.com",
        customerPhone: "21998765432",
        customerCpf: "98765432100",
        status: "ENVIADO",
        subtotalCents: 18990,
        couponCode: "PRIMEIRACOMPRA",
        couponDiscountCents: 1899,
        discountedSubtotalCents: 17091,
        shippingCarrier: "Jadlog Package",
        shippingPriceCents: 1990,
        shippingOriginalPriceCents: 1990,
        isFreeShipping: false,
        carrierDays: 5,
        productionDays: 3,
        totalDeliveryDays: 8,
        totalCents: 19081,
        pixDiscountAmountCents: 0,
        finalAmountCents: 19081,
        paymentMethod: "CREDIT_CARD",
        paymentStatus: "APPROVED",
        paymentId: "card_demo_002",
        cardBrand: "Mastercard",
        cardLastFour: "8821",
        cardInstallments: 3,
        shippingPostalCode: "22041001",
        shippingStreet: "Rua Barata Ribeiro",
        shippingNumber: "502",
        shippingNeighborhood: "Copacabana",
        shippingCity: "Rio de Janeiro",
        shippingState: "RJ",
        trackingCode: "BR123456789BR",
        shippedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 dias atrás
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
      items: [
        {
          id: "item_seed_2",
          orderId: "ord_mkb_seed_2",
          productId: "prod_vaso_hera",
          variantId: "var_vaso_hera_oliva",
          productName: "Vaso Facetado Hera",
          productSlug: "vaso-facetado-hera",
          variantSku: "VAS-HER-OLI",
          variantName: "Verde Oliva",
          colorHex: "#556B2F",
          imageUrl: "/products/vaso-facetado-hera-1.svg",
          unitPriceCents: 18990,
          quantity: 1,
          totalPriceCents: 18990,
        },
      ],
    },
    {
      order: {
        id: "ord_mkb_seed_3",
        orderNumber: "MKB-10023",
        customerName: "Felipe Bastos",
        customerEmail: "felipe.bastos@exemplo.com",
        customerPhone: "31976543210",
        customerCpf: "45678912345",
        status: "AGUARDANDO_PAGAMENTO",
        subtotalCents: 32000,
        couponDiscountCents: 0,
        discountedSubtotalCents: 32000,
        shippingCarrier: "Sedex (Correios)",
        shippingPriceCents: 0,
        shippingOriginalPriceCents: 3290,
        isFreeShipping: true,
        carrierDays: 2,
        productionDays: 3,
        totalDeliveryDays: 5,
        totalCents: 32000,
        pixDiscountAmountCents: 1600,
        finalAmountCents: 30400,
        paymentMethod: "PIX",
        paymentStatus: "PENDING",
        pixQrCode: "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-4266141740005204000053039865406304.005802BR5913MARKAH BRASIL6009SAO PAULO62070503***6304ABCD",
        pixExpiresAt: new Date(Date.now() + 1000 * 60 * 25),
        shippingPostalCode: "30140071",
        shippingStreet: "Rua da Bahia",
        shippingNumber: "1500",
        shippingNeighborhood: "Lourdes",
        shippingCity: "Belo Horizonte",
        shippingState: "MG",
        createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 min atrás
        updatedAt: new Date(Date.now() - 1000 * 60 * 15),
      },
      items: [
        {
          id: "item_seed_3",
          orderId: "ord_mkb_seed_3",
          productId: "prod_pendente_origami",
          variantId: "var_pendente_origami_marfim",
          productName: "Pendente Geométrico Origami",
          productSlug: "pendente-geometrico-origami",
          variantSku: "PEN-ORI-MAR",
          variantName: "Branco Marfim",
          colorHex: "#FFFFF0",
          imageUrl: "/products/pendente-origami-on.svg",
          unitPriceCents: 32000,
          quantity: 1,
          totalPriceCents: 32000,
        },
      ],
    },
    {
      order: {
        id: "ord_mkb_seed_4",
        orderNumber: "MKB-10022",
        customerName: "Renata Silveira",
        customerEmail: "renata.silveira@exemplo.com",
        customerPhone: "41991234567",
        customerCpf: "78912345601",
        status: "ENTREGUE",
        subtotalCents: 15990,
        couponDiscountCents: 0,
        discountedSubtotalCents: 15990,
        shippingCarrier: "Jadlog .Package",
        shippingPriceCents: 1890,
        shippingOriginalPriceCents: 1890,
        isFreeShipping: false,
        carrierDays: 4,
        productionDays: 3,
        totalDeliveryDays: 7,
        totalCents: 17880,
        pixDiscountAmountCents: 0,
        finalAmountCents: 17880,
        paymentMethod: "CREDIT_CARD",
        paymentStatus: "APPROVED",
        paymentId: "card_demo_004",
        cardBrand: "Visa",
        cardLastFour: "4242",
        cardInstallments: 1,
        shippingPostalCode: "80020310",
        shippingStreet: "Rua XV de Novembro",
        shippingNumber: "800",
        shippingNeighborhood: "Centro",
        shippingCity: "Curitiba",
        shippingState: "PR",
        trackingCode: "BR987654321BR",
        shippedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 dias atrás
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      },
      items: [
        {
          id: "item_seed_4",
          orderId: "ord_mkb_seed_4",
          productId: "prod_organizador_wave",
          variantId: "var_organizador_wave_preto",
          productName: "Organizador de Mesa Wave",
          productSlug: "organizador-de-mesa-wave",
          variantSku: "ORG-WAV-BLK",
          variantName: "Preto Fosco",
          colorHex: "#111111",
          imageUrl: "/products/organizador-wave-1.svg",
          unitPriceCents: 15990,
          quantity: 1,
          totalPriceCents: 15990,
        },
      ],
    },
  ];

  for (const { order, items } of mockOrders) {
    inMemoryOrders.set(order.id, { ...order, items });
    inMemoryOrderItems.set(order.id, items);
  }
}

/**
 * Lista todos os pedidos com paginação, filtro de status e pesquisa textual.
 */
export async function listAllOrders(
  options: ListOrdersOptions = {}
): Promise<ListOrdersResult> {
  const { status, search, limit = 50, offset = 0 } = options;

  try {
    if (isDatabaseConfigured()) {
      const whereClause: Record<string, unknown> = {};

      if (status) {
        whereClause.status = status;
      }

      if (search && search.trim()) {
        const query = search.trim();
        whereClause.OR = [
          { orderNumber: { contains: query, mode: "insensitive" } },
          { customerName: { contains: query, mode: "insensitive" } },
          { customerEmail: { contains: query, mode: "insensitive" } },
          { customerCpf: { contains: query } },
          { trackingCode: { contains: query, mode: "insensitive" } },
        ];
      }

      const [orders, total] = await Promise.all([
        db.order.findMany({
          where: whereClause,
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        db.order.count({ where: whereClause }),
      ]);

      return { orders, total };
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback para memória (somente em desenvolvimento)
  }

  ensureSeedOrders();

  let filtered = Array.from(inMemoryOrders.values());

  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerCpf.includes(q) ||
      (o.trackingCode && o.trackingCode.toLowerCase().includes(q))
    );
  }

  // Ordena por data decrescente
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit).map((order) => {
    const items = inMemoryOrderItems.get(order.id) || order.items || [];
    return { ...order, items };
  });

  return { orders: paged, total };
}

export interface OrderMetrics {
  totalOrders: number;
  totalRevenueCents: number;
  waitingPaymentCount: number;
  paidCount: number;
  inProductionCount: number;
  readyToShipCount: number;
  shippedCount: number;
  deliveredCount: number;
  canceledCount: number;
}

/**
 * Retorna as métricas consolidadas dos pedidos para o Dashboard Administrativo.
 */
export async function getOrderMetrics(): Promise<OrderMetrics> {
  try {
    if (isDatabaseConfigured()) {
      const orders = await db.order.findMany({
        select: {
          status: true,
          finalAmountCents: true,
          paymentStatus: true,
        },
      });

      let totalRevenueCents = 0;
      let waitingPaymentCount = 0;
      let paidCount = 0;
      let inProductionCount = 0;
      let readyToShipCount = 0;
      let shippedCount = 0;
      let deliveredCount = 0;
      let canceledCount = 0;

      for (const order of orders) {
        if (order.status === "AGUARDANDO_PAGAMENTO") waitingPaymentCount++;
        else if (order.status === "PAGO") paidCount++;
        else if (order.status === "EM_PRODUCAO") inProductionCount++;
        else if (order.status === "PRONTO_PARA_ENVIO") readyToShipCount++;
        else if (order.status === "ENVIADO") shippedCount++;
        else if (order.status === "ENTREGUE") deliveredCount++;
        else if (order.status === "CANCELADO" || order.status === "REEMBOLSADO") canceledCount++;

        // Faturamento considera pedidos com pagamento aprovado ou não cancelados
        if (order.paymentStatus === "APPROVED" && order.status !== "CANCELADO" && order.status !== "REEMBOLSADO") {
          totalRevenueCents += order.finalAmountCents;
        }
      }

      return {
        totalOrders: orders.length,
        totalRevenueCents,
        waitingPaymentCount,
        paidCount,
        inProductionCount,
        readyToShipCount,
        shippedCount,
        deliveredCount,
        canceledCount,
      };
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedOrders();

  let totalRevenueCents = 0;
  let waitingPaymentCount = 0;
  let paidCount = 0;
  let inProductionCount = 0;
  let readyToShipCount = 0;
  let shippedCount = 0;
  let deliveredCount = 0;
  let canceledCount = 0;

  for (const order of inMemoryOrders.values()) {
    if (order.status === "AGUARDANDO_PAGAMENTO") waitingPaymentCount++;
    else if (order.status === "PAGO") paidCount++;
    else if (order.status === "EM_PRODUCAO") inProductionCount++;
    else if (order.status === "PRONTO_PARA_ENVIO") readyToShipCount++;
    else if (order.status === "ENVIADO") shippedCount++;
    else if (order.status === "ENTREGUE") deliveredCount++;
    else if (order.status === "CANCELADO" || order.status === "REEMBOLSADO") canceledCount++;

    if (order.paymentStatus === "APPROVED" && order.status !== "CANCELADO" && order.status !== "REEMBOLSADO") {
      totalRevenueCents += order.finalAmountCents;
    }
  }

  return {
    totalOrders: inMemoryOrders.size,
    totalRevenueCents,
    waitingPaymentCount,
    paidCount,
    inProductionCount,
    readyToShipCount,
    shippedCount,
    deliveredCount,
    canceledCount,
  };
}

/**
 * Busca pedidos realizados por um cliente através do seu e-mail.
 */
export async function listOrdersByCustomerEmail(
  customerEmail: string
): Promise<OrderRecord[]> {
  const email = customerEmail.trim().toLowerCase();

  try {
    if (isDatabaseConfigured()) {
      const orders = await db.order.findMany({
        where: {
          customerEmail: { equals: email, mode: "insensitive" },
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      return orders;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedOrders();

  const matching: OrderRecord[] = [];
  for (const order of inMemoryOrders.values()) {
    if (order.customerEmail.toLowerCase() === email) {
      const items = inMemoryOrderItems.get(order.id) || order.items || [];
      matching.push({ ...order, items });
    }
  }

  matching.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return matching;
}

/**
 * Verifica se evento de webhook já foi processado (P-003: Idempotência).
 */
export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  if (inMemoryWebhookEvents.has(eventId)) {
    return true;
  }

  try {
    if (isDatabaseConfigured()) {
      const found = await db.webhookEvent.findUnique({
        where: { eventId },
      });
      return Boolean(found);
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  return false;
}

/**
 * Registra evento de webhook processado (P-003: Idempotência).
 */
export async function markWebhookEventProcessed(
  eventId: string,
  eventType: string,
  payload?: unknown
): Promise<void> {
  inMemoryWebhookEvents.add(eventId);

  try {
    if (isDatabaseConfigured()) {
      await db.webhookEvent.create({
        data: {
          eventId,
          eventType,
          provider: "MERCADO_PAGO",
          processed: true,
          payload: (payload as object) || {},
        },
      });
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }
}

/**
 * Exclui um pedido do banco de dados e da memória.
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
  try {
    if (isDatabaseConfigured()) {
      await db.order.delete({
        where: { id: orderId },
      });
      return true;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
  }

  inMemoryOrders.delete(orderId);
  inMemoryOrderItems.delete(orderId);
  return true;
}

/**
 * Limpa todos os pedidos do sistema (banco de dados e memória).
 */
export async function clearAllOrders(): Promise<number> {
  let count = 0;
  try {
    if (isDatabaseConfigured()) {
      const res = await db.order.deleteMany({});
      count = res.count;
      await db.webhookEvent.deleteMany({});
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
  }

  inMemoryOrders.clear();
  inMemoryOrderItems.clear();
  return count;
}

