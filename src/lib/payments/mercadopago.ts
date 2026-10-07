/**
 * =====================================================================
 * ECOMMERCE MARKAH — INTEGRAÇÃO MERCADO PAGO (PAGAMENTOS & PIX)
 * =====================================================================
 * Regras fundamentais (PRD §5.4, D-006, P-001, P-002, P-003, P-005):
 * 1. Todos os valores em centavos inteiros (D-011).
 * 2. Desconto Pix aplicado no servidor (PRD §5.1 / §5.4).
 * 3. Cartão SEMPRE tokenizado pelo Card Payment Brick do Mercado Pago:
 *    o número do cartão nunca passa pelo nosso servidor.
 * 4. Simulação existe SOMENTE em desenvolvimento local sem credenciais.
 *    Com credenciais configuradas (TEST- ou APP_USR-) ou em produção,
 *    qualquer falha da API é devolvida como erro — nunca como pagamento
 *    aprovado (mistakes.md M-003).
 */

import { isProduction } from "@/lib/runtime";

export interface CreatePixPaymentParams {
  orderNumber: string;
  amountCents: number;
  customer: {
    name: string;
    email: string;
    cpf: string;
  };
  itemsSummary: string;
}

export interface PixPaymentResult {
  success: boolean;
  paymentId: string;
  status: string; // "pending" | "approved" | "rejected"
  qrCode: string; // Copia e cola
  qrCodeBase64?: string; // Imagem em Base64 para exibição
  expiresAt: Date;
  error?: string;
}

export interface CreateCardPaymentParams {
  orderNumber: string;
  amountCents: number;
  token: string;
  installments: number;
  paymentMethodId: string; // "visa", "master", "elo", etc.
  issuerId?: string;
  customer: {
    name: string;
    email: string;
    cpf: string;
  };
}

export interface CardPaymentResult {
  success: boolean;
  paymentId: string;
  status: string; // "approved" | "in_process" | "pending" | "rejected"
  statusDetail?: string;
  cardBrand?: string;
  cardLastFour?: string;
  installments: number;
  error?: string;
}

export interface PaymentDetails {
  id: string;
  status: string; // "approved" | "pending" | "in_process" | "rejected" | "refunded" | "cancelled" | "charged_back"
  statusDetail?: string;
  /** Valor cobrado em centavos */
  transactionAmount: number;
  dateApproved?: string | null;
  paymentMethodId?: string;
  /** Número do pedido Markah enviado como external_reference */
  externalReference?: string | null;
}

const MP_API_URL = "https://api.mercadopago.com/v1/payments";
const PIX_EXPIRATION_MINUTES = 30;

/**
 * Retorna o access token quando há credencial real configurada
 * (teste "TEST-..." ou produção "APP_USR-...").
 */
export function getMercadoPagoAccessToken(): string | null {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) return null;
  if (token.includes("TEST-00000000") || token.includes("0000000000000000")) return null;
  return token;
}

/** Simulação só é permitida em desenvolvimento local sem credenciais. */
function isSimulationMode(): boolean {
  return !getMercadoPagoAccessToken() && !isProduction();
}

function missingCredentialsError(): string {
  return "Pagamento indisponível: credenciais do Mercado Pago não configuradas.";
}

/** Formata data no padrão aceito pelo MP, no fuso de Brasília (ex.: 2026-09-26T15:00:00.000-03:00). */
function toMercadoPagoDate(date: Date): string {
  const offsetMs = 3 * 60 * 60 * 1000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().replace("Z", "-03:00");
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] || "Cliente",
    last: parts.slice(1).join(" ") || "Markah",
  };
}

async function readMpError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.message || data?.error || `Mercado Pago respondeu ${response.status}`;
  } catch {
    return `Mercado Pago respondeu ${response.status}`;
  }
}

function notificationUrl(): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  // O MP rejeita notification_url com localhost; em dev local o webhook não é chamado.
  if (!siteUrl || siteUrl.includes("localhost")) return undefined;
  return `${siteUrl.replace(/\/$/, "")}/api/webhooks/mercadopago`;
}

/**
 * Cria cobrança instantânea via Pix no Mercado Pago.
 */
export async function createPixPayment(
  params: CreatePixPaymentParams
): Promise<PixPaymentResult> {
  const token = getMercadoPagoAccessToken();
  const cleanCpf = params.customer.cpf.replace(/\D/g, "");
  const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000); // PRD §5.4

  if (token) {
    try {
      const { first, last } = splitName(params.customer.name);
      const response = await fetch(MP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Idempotency-Key": `pix_${params.orderNumber}`,
        },
        body: JSON.stringify({
          transaction_amount: params.amountCents / 100,
          description: `Pedido ${params.orderNumber} — Markah Brasil`,
          payment_method_id: "pix",
          external_reference: params.orderNumber,
          date_of_expiration: toMercadoPagoDate(expiresAt),
          notification_url: notificationUrl(),
          payer: {
            email: params.customer.email,
            first_name: first,
            last_name: last,
            identification: { type: "CPF", number: cleanCpf },
          },
        }),
      });

      if (!response.ok) {
        return pixError(await readMpError(response), expiresAt);
      }

      const data = await response.json();
      const txData = data.point_of_interaction?.transaction_data;
      if (!txData?.qr_code) {
        return pixError("O Mercado Pago não retornou o código Pix.", expiresAt);
      }

      return {
        success: true,
        paymentId: String(data.id),
        status: data.status || "pending",
        qrCode: txData.qr_code,
        qrCodeBase64: txData.qr_code_base64
          ? `data:image/png;base64,${txData.qr_code_base64}`
          : undefined,
        expiresAt,
      };
    } catch (err) {
      return pixError(
        err instanceof Error ? err.message : "Falha de comunicação com o Mercado Pago.",
        expiresAt
      );
    }
  }

  if (!isSimulationMode()) {
    return pixError(missingCredentialsError(), expiresAt);
  }

  // ---- Simulação: somente desenvolvimento local sem credenciais ----
  const simulatedQrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#FFFFFF"/><path d="M20,20 h60 v60 h-60 z M30,30 v40 h40 v-40 z M40,40 h20 v20 h-20 z M120,20 h60 v60 h-60 z M130,30 v40 h40 v-40 z M140,40 h20 v20 h-20 z M20,120 h60 v60 h-60 z M30,130 v40 h40 v-40 z M40,140 h20 v20 h-20 z" fill="#111111"/><rect x="95" y="95" width="20" height="20" fill="#2BAA5E"/><text x="100" y="195" font-size="9" text-anchor="middle" fill="#C62828">SIMULAÇÃO — NÃO PAGAR</text></svg>`;

  return {
    success: true,
    paymentId: `mp_pix_${Date.now()}`,
    status: "pending",
    qrCode: `SIMULACAO-PIX-${params.orderNumber}-NAO-PAGAR`,
    qrCodeBase64: `data:image/svg+xml;utf8,${encodeURIComponent(simulatedQrSvg)}`,
    expiresAt,
  };
}

function pixError(error: string, expiresAt: Date): PixPaymentResult {
  return { success: false, paymentId: "", status: "error", qrCode: "", expiresAt, error };
}

function cardError(error: string, installments: number): CardPaymentResult {
  return { success: false, paymentId: "", status: "error", installments, error };
}

/**
 * Cria cobrança no cartão de crédito com o token gerado pelo Card Payment Brick.
 */
export async function createCardPayment(
  params: CreateCardPaymentParams
): Promise<CardPaymentResult> {
  const token = getMercadoPagoAccessToken();
  const cleanCpf = params.customer.cpf.replace(/\D/g, "");
  const installments = Math.min(12, Math.max(1, Math.floor(params.installments || 1)));

  if (!params.token) {
    return cardError("Dados do cartão não informados.", installments);
  }

  if (token) {
    if (params.token.startsWith("mock_")) {
      return cardError("Token de cartão inválido.", installments);
    }
    try {
      const { first, last } = splitName(params.customer.name);
      const response = await fetch(MP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Idempotency-Key": `card_${params.orderNumber}`,
        },
        body: JSON.stringify({
          transaction_amount: params.amountCents / 100,
          token: params.token,
          description: `Pedido ${params.orderNumber} — Markah Brasil`,
          installments,
          payment_method_id: params.paymentMethodId,
          issuer_id: params.issuerId ? Number(params.issuerId) || params.issuerId : undefined,
          external_reference: params.orderNumber,
          statement_descriptor: "MARKAH BRASIL",
          notification_url: notificationUrl(),
          payer: {
            email: params.customer.email,
            first_name: first,
            last_name: last,
            identification: { type: "CPF", number: cleanCpf },
          },
        }),
      });

      if (!response.ok) {
        return cardError(await readMpError(response), installments);
      }

      const data = await response.json();
      const accepted = ["approved", "in_process", "pending"].includes(data.status);
      return {
        success: accepted,
        paymentId: String(data.id),
        status: data.status,
        statusDetail: data.status_detail,
        cardBrand: data.payment_method_id,
        cardLastFour: data.card?.last_four_digits,
        installments: data.installments || installments,
        error: accepted ? undefined : describeCardRejection(data.status_detail),
      };
    } catch (err) {
      return cardError(
        err instanceof Error ? err.message : "Falha de comunicação com o Mercado Pago.",
        installments
      );
    }
  }

  if (!isSimulationMode()) {
    return cardError(missingCredentialsError(), installments);
  }

  // ---- Simulação: somente desenvolvimento local sem credenciais ----
  return {
    success: true,
    paymentId: `mp_card_${Date.now()}`,
    status: "approved",
    statusDetail: "accredited",
    cardBrand: params.paymentMethodId || "master",
    cardLastFour: "4242",
    installments,
  };
}

function describeCardRejection(statusDetail?: string): string {
  switch (statusDetail) {
    case "cc_rejected_insufficient_amount":
      return "Pagamento recusado: saldo ou limite insuficiente.";
    case "cc_rejected_bad_filled_security_code":
      return "Pagamento recusado: código de segurança inválido.";
    case "cc_rejected_bad_filled_date":
      return "Pagamento recusado: data de validade inválida.";
    case "cc_rejected_bad_filled_other":
    case "cc_rejected_bad_filled_card_number":
      return "Pagamento recusado: confira os dados do cartão.";
    case "cc_rejected_call_for_authorize":
      return "Pagamento recusado: autorize a compra com o banco emissor e tente de novo.";
    case "cc_rejected_high_risk":
      return "Pagamento recusado por segurança. Tente outro cartão ou pague com Pix.";
    default:
      return "Pagamento recusado pelo emissor do cartão. Tente outro cartão ou pague com Pix.";
  }
}

/**
 * Consulta o pagamento diretamente na API do Mercado Pago (P-003 / P-004).
 * Retorna null quando o pagamento não existe ou não pode ser consultado.
 */
export async function getPaymentDetails(
  paymentId: string
): Promise<PaymentDetails | null> {
  const token = getMercadoPagoAccessToken();

  if (token) {
    try {
      const response = await fetch(`${MP_API_URL}/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) return null;

      const data = await response.json();
      return {
        id: String(data.id),
        status: data.status,
        statusDetail: data.status_detail,
        transactionAmount: Math.round(Number(data.transaction_amount) * 100),
        dateApproved: data.date_approved,
        paymentMethodId: data.payment_method_id,
        externalReference: data.external_reference ?? null,
      };
    } catch {
      return null;
    }
  }

  // Simulação: somente desenvolvimento local, e somente para IDs simulados
  if (isSimulationMode() && paymentId.startsWith("mp_")) {
    return {
      id: paymentId,
      status: "approved",
      statusDetail: "accredited",
      transactionAmount: -1, // desconhecido na simulação
      dateApproved: new Date().toISOString(),
      paymentMethodId: paymentId.startsWith("mp_pix") ? "pix" : "master",
      externalReference: null,
    };
  }

  return null;
}

/**
 * Valida o cabeçalho x-signature enviado pelo Mercado Pago (P-003).
 * Manifesto: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * (partes ausentes são omitidas; data.id alfanumérico vai em minúsculas).
 * Assinatura: HMAC-SHA256 em hexadecimal com a chave secreta do webhook.
 */
export async function verifyMercadoPagoSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): Promise<boolean> {
  const { xSignature, xRequestId, dataId, secret } = params;
  if (!xSignature || !secret) return false;

  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of xSignature.split(",")) {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey?.trim();
    const value = rest.join("=").trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return false;

  let manifest = "";
  if (dataId) manifest += `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}
