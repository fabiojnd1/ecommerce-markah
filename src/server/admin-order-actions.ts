"use server";

import { revalidatePath } from "next/cache";
import { type OrderStatus, type PaymentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import {
  listAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderTracking,
  updateOrderInternalNotes,
  getOrderMetrics,
  deleteOrder,
  clearAllOrders,
  type ListOrdersOptions,
} from "@/lib/orders-repository";
import { sendOrderShippedEmail } from "@/lib/email/resend";

/**
 * Server Action: Lista pedidos para a área administrativa com filtros.
 * Regra P-007: Exige requireAdmin().
 */
export async function getAdminOrdersAction(options: ListOrdersOptions = {}) {
  await requireAdmin();

  const result = await listAllOrders(options);
  return {
    success: true,
    orders: result.orders,
    total: result.total,
  };
}

/**
 * Server Action: Detalhes de um pedido específico.
 * Regra P-007: Exige requireAdmin().
 */
export async function getAdminOrderDetailsAction(orderId: string) {
  await requireAdmin();

  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "Pedido não encontrado." };
  }

  return { success: true, order };
}

/**
 * Server Action: Atualização do status do pedido no fluxo de produção/despacho.
 * Regra P-007: Exige requireAdmin().
 * Se status for ENVIADO, exige código de rastreamento.
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  extra?: {
    trackingCode?: string;
    internalNotes?: string;
  }
) {
  await requireAdmin();

  const existing = await getOrderById(orderId);
  if (!existing) {
    return { success: false, error: "Pedido não encontrado." };
  }

  const trackingCodeToUse = extra?.trackingCode?.trim().toUpperCase() || existing.trackingCode;

  // Validação: para marcar como ENVIADO, trackingCode é obrigatório
  if (newStatus === "ENVIADO" && !trackingCodeToUse) {
    return {
      success: false,
      error: "O código de rastreamento é obrigatório para marcar o pedido como Enviado.",
    };
  }

  let paymentStatusToUpdate: PaymentStatus | undefined = undefined;
  if (newStatus === "PAGO") {
    paymentStatusToUpdate = "APPROVED";
  } else if (newStatus === "CANCELADO") {
    paymentStatusToUpdate = "REJECTED";
  } else if (newStatus === "REEMBOLSADO") {
    paymentStatusToUpdate = "REFUNDED";
  }

  const shippedAt = newStatus === "ENVIADO" ? (existing.shippedAt || new Date()) : undefined;
  const deliveredAt = newStatus === "ENTREGUE" ? (existing.deliveredAt || new Date()) : undefined;

  const updated = await updateOrderStatus(
    orderId,
    newStatus,
    paymentStatusToUpdate,
    undefined,
    {
      trackingCode: trackingCodeToUse,
      internalNotes: extra?.internalNotes !== undefined ? extra.internalNotes : existing.internalNotes,
      shippedAt,
      deliveredAt,
    }
  );

  // Disparo de notificação por e-mail se foi enviado
  if (newStatus === "ENVIADO" && trackingCodeToUse && updated) {
    try {
      await sendOrderShippedEmail(updated, trackingCodeToUse);
    } catch {
      // Falha no e-mail não bloqueia o fluxo operacional
    }
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin");

  return { success: true, order: updated };
}

/**
 * Server Action: Despacha pedido com código de rastreio.
 * Regra P-007: Exige requireAdmin().
 */
export async function updateOrderTrackingAction(
  orderId: string,
  trackingCode: string
) {
  await requireAdmin();

  const code = trackingCode?.trim().toUpperCase();
  if (!code) {
    return {
      success: false,
      error: "Informe um código de rastreamento válido.",
    };
  }

  const updated = await updateOrderTracking(orderId, code, new Date());
  if (!updated) {
    return { success: false, error: "Pedido não encontrado." };
  }

  try {
    await sendOrderShippedEmail(updated, code);
  } catch {
    // Silencia em caso de erro no serviço de e-mail
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin");

  return { success: true, order: updated };
}

/**
 * Server Action: Atualiza anotações internas da equipe de produção.
 * Regra P-007: Exige requireAdmin().
 */
export async function saveInternalNotesAction(
  orderId: string,
  internalNotes: string
) {
  await requireAdmin();

  const updated = await updateOrderInternalNotes(orderId, internalNotes);
  if (!updated) {
    return { success: false, error: "Pedido não encontrado." };
  }

  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true, order: updated };
}

/**
 * Server Action: Reembolso ou cancelamento de pedido pelo administrador.
 * Regra P-007: Exige requireAdmin().
 */
export async function refundOrderAction(orderId: string, reason?: string) {
  await requireAdmin();

  const existing = await getOrderById(orderId);
  if (!existing) {
    return { success: false, error: "Pedido não encontrado." };
  }

  const dateStr = new Date().toLocaleDateString("pt-BR");
  const noteAddition = `\n[Reembolso registrado em ${dateStr}${reason ? `: ${reason}` : ""}]`;
  const combinedNotes = (existing.internalNotes || "") + noteAddition;

  const updated = await updateOrderStatus(
    orderId,
    "REEMBOLSADO",
    "REFUNDED",
    undefined,
    { internalNotes: combinedNotes.trim() }
  );

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin");

  return { success: true, order: updated };
}

/**
 * Server Action: Obtém as métricas dos pedidos para o Dashboard.
 * Regra P-007: Exige requireAdmin().
 */
export async function getAdminMetricsAction() {
  await requireAdmin();
  return await getOrderMetrics();
}

/**
 * Server Action: Exclui um pedido individual do sistema.
 * Regra P-007: Exige requireAdmin().
 */
export async function deleteOrderAction(orderId: string) {
  await requireAdmin();

  const success = await deleteOrder(orderId);
  if (!success) {
    return { success: false, error: "Falha ao excluir pedido." };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Server Action: Limpa todos os pedidos do sistema.
 * Regra P-007: Exige requireAdmin().
 */
export async function clearAllOrdersAction() {
  await requireAdmin();

  const deletedCount = await clearAllOrders();

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return { success: true, count: deletedCount };
}
