import { NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { getPaymentDetails, verifyMercadoPagoSignature } from "@/lib/payments/mercadopago";
import {
  isWebhookEventProcessed,
  markWebhookEventProcessed,
  updateOrderStatus,
  getOrderByNumber,
  getOrderByPaymentId,
  type OrderRecord,
} from "@/lib/orders-repository";
import { sendPaymentConfirmedEmail } from "@/lib/email/resend";
import { isProduction } from "@/lib/runtime";

interface MercadoPagoWebhookBody {
  id?: string | number;
  type?: string;
  action?: string;
  topic?: string;
  data?: { id?: string | number };
}

/** Status a partir dos quais um pagamento aprovado pode marcar o pedido como PAGO. */
const PAYABLE_STATUSES: OrderStatus[] = ["AGUARDANDO_PAGAMENTO", "PAGAMENTO_RECUSADO", "CANCELADO"];

function getWebhookSecret(): string | null {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!secret || secret === "seu-webhook-secret") return null;
  return secret;
}

/**
 * Webhook do Mercado Pago (PRD §5.4, P-003, P-004).
 * 1. Valida a assinatura x-signature (obrigatória em produção).
 * 2. Consulta o pagamento na API do MP — nunca confia no corpo recebido.
 * 3. Localiza o pedido pelo external_reference (número do pedido) ou pelo paymentId.
 * 4. Confere se o valor pago é o valor do pedido antes de marcar como PAGO.
 * 5. É idempotente: o mesmo pagamento no mesmo status é processado uma única vez.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  let body: MercadoPagoWebhookBody | null = null;
  try {
    body = (await req.json()) as MercadoPagoWebhookBody;
  } catch {
    // Corpo vazio ou inválido
  }

  const dataIdFromQuery = searchParams.get("data.id");
  const paymentId = String(dataIdFromQuery || body?.data?.id || searchParams.get("id") || "");
  const eventType = body?.type || body?.topic || searchParams.get("type") || searchParams.get("topic") || "";

  // 1. Assinatura
  const secret = getWebhookSecret();
  if (secret) {
    const valid = await verifyMercadoPagoSignature({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId: dataIdFromQuery || (body?.data?.id != null ? String(body.data.id) : null),
      secret,
    });
    if (!valid) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }
  } else if (isProduction()) {
    console.error("[webhook mercadopago] MERCADO_PAGO_WEBHOOK_SECRET não configurada — evento recusado.");
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 503 });
  }

  // Apenas notificações de pagamento interessam
  if (!paymentId || (eventType && !eventType.startsWith("payment"))) {
    return NextResponse.json({ received: true, note: "Evento ignorado" }, { status: 200 });
  }

  try {
    // 2. Consulta autenticada na API do Mercado Pago
    const payment = await getPaymentDetails(paymentId);
    if (!payment) {
      return NextResponse.json({ received: true, note: "Pagamento não encontrado no MP" }, { status: 200 });
    }

    // 5. Idempotência por pagamento + status
    const eventKey = `mp_${payment.id}_${payment.status}`;
    if (await isWebhookEventProcessed(eventKey)) {
      return NextResponse.json({ received: true, note: "Já processado" }, { status: 200 });
    }

    // 3. Localiza o pedido
    let order: OrderRecord | null = null;
    if (payment.externalReference) {
      order = await getOrderByNumber(payment.externalReference);
    }
    if (!order) {
      order = await getOrderByPaymentId(payment.id);
    }
    if (!order) {
      await markWebhookEventProcessed(eventKey, eventType || "payment", {
        paymentId: payment.id,
        status: payment.status,
        note: "Pedido não localizado",
      });
      return NextResponse.json({ received: true, note: "Pedido não localizado" }, { status: 200 });
    }

    if (order.paymentId && order.paymentId !== payment.id) {
      console.warn(
        `[webhook mercadopago] Pagamento ${payment.id} não corresponde ao pagamento ${order.paymentId} do pedido ${order.orderNumber}.`
      );
    }

    // 4. Atualização de status com conferência de valor
    if (payment.status === "approved") {
      const amountKnown = payment.transactionAmount >= 0;
      if (amountKnown && payment.transactionAmount !== order.finalAmountCents) {
        const note = `[Webhook] Pagamento ${payment.id} aprovado com valor ${payment.transactionAmount} centavos, diferente do pedido (${order.finalAmountCents}). Conferir manualmente.`;
        console.error(`[webhook mercadopago] ${note}`);
        await updateOrderStatus(order.id, order.status, order.paymentStatus, undefined, {
          internalNotes: [order.internalNotes, note].filter(Boolean).join("\n"),
        });
      } else if (PAYABLE_STATUSES.includes(order.status)) {
        const updated = await updateOrderStatus(order.id, "PAGO", "APPROVED", payment.id);
        if (updated) {
          try {
            await sendPaymentConfirmedEmail(updated);
          } catch {
            // Falha no e-mail não deve fazer o MP reenviar o evento
          }
        }
      }
    } else if (["rejected", "cancelled"].includes(payment.status)) {
      if (order.status === "AGUARDANDO_PAGAMENTO") {
        await updateOrderStatus(order.id, "PAGAMENTO_RECUSADO", "REJECTED", payment.id);
      }
    } else if (["refunded", "charged_back"].includes(payment.status)) {
      await updateOrderStatus(order.id, "REEMBOLSADO", "REFUNDED", payment.id);
    }

    await markWebhookEventProcessed(eventKey, eventType || "payment", {
      paymentId: payment.id,
      status: payment.status,
      orderNumber: order.orderNumber,
    });

    return NextResponse.json({ received: true, status: payment.status }, { status: 200 });
  } catch (err: unknown) {
    // Erro 500 faz o Mercado Pago tentar novamente mais tarde
    console.error("[webhook mercadopago] Erro ao processar evento:", err);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 });
  }
}
