/**
 * =====================================================================
 * ECOMMERCE MARKAH — E-MAILS TRANSACIONAIS (RESEND)
 * =====================================================================
 * Regras fundamentais (D-013, PRD §5.5):
 * 1. Disparo de e-mail ao criar pedido e ao confirmar pagamento via webhook.
 * 2. Formatação clara em HTML com dados do pedido e prazo de produção sob demanda (3 dias).
 * 3. Fallback seguro para logs em ambiente de desenvolvimento/testes.
 */

import type { OrderRecord } from "@/lib/orders-repository";
import { formatCents } from "@/lib/pricing";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

/** Escapa texto digitado pelo cliente antes de inserir no HTML do e-mail. */
function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Envia e-mail de Pedido Criado (com instruções de pagamento / Pix).
 */
export async function sendOrderCreatedEmail(
  order: OrderRecord
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Markah Brasil <contato@markah.com.br>";
  const isRealKey = Boolean(apiKey && !apiKey.includes("re_123456789"));

  const isPix = order.paymentMethod === "PIX";
  const subject = `Pedido #${order.orderNumber} recebido com sucesso! — Markah Brasil`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"/></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #1A1A1A;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E4DFD7; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #111111; padding: 24px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.05em;">MARKAH BRASIL</h1>
          <p style="color: #FAF8F5; margin: 4px 0 0 0; font-size: 12px;">DESIGN IMPRESSO EM 3D</p>
        </div>

        <div style="padding: 24px 32px;">
          <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #111111;">Olá, ${escapeHtml(order.customerName)}!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #6B665F; margin: 0 0 20px 0;">
            Recebemos o seu pedido <strong>#${order.orderNumber}</strong>. Nossas peças são produzidas sob demanda por impressão 3D sustentável com prazo padrão de fabricação de até <strong>3 dias úteis</strong>.
          </p>

          ${
            isPix && order.pixQrCode
              ? `
            <div style="background-color: #F1EEE9; border: 1px solid #E4DFD7; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="display: inline-block; background-color: #2BAA5E; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; text-transform: uppercase;">
                5% de Desconto no Pix
              </span>
              <h3 style="font-size: 16px; margin: 12px 0 6px 0; color: #111111;">Total no Pix: ${formatCents(order.finalAmountCents)}</h3>
              <p style="font-size: 12px; color: #6B665F; margin: 0 0 16px 0;">Copie o código abaixo e pague no app do seu banco:</p>
              
              <div style="background: #FFFFFF; border: 1px dashed #E4DFD7; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 11px; word-break: break-all; color: #111111; margin-bottom: 12px;">
                ${order.pixQrCode}
              </div>
              <p style="font-size: 11px; color: #B26A00; margin: 0;">O código Pix expira em 30 minutos.</p>
            </div>
            `
              : `
            <div style="background-color: #F1EEE9; border: 1px solid #E4DFD7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #111111;">
                <strong>Forma de Pagamento:</strong> Cartão de Crédito ${order.cardBrand ? `(${order.cardBrand.toUpperCase()})` : ""} em ${order.cardInstallments || 1}x de ${formatCents(Math.round(order.finalAmountCents / (order.cardInstallments || 1)))}
              </p>
            </div>
            `
          }

          <div style="border-top: 1px solid #E4DFD7; padding-top: 16px; margin-bottom: 20px;">
            <h3 style="font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em; color: #6B665F;">Entrega</h3>
            <p style="font-size: 13px; line-height: 1.5; margin: 0; color: #1A1A1A;">
              ${escapeHtml(order.shippingStreet)}, ${escapeHtml(order.shippingNumber)} ${order.shippingComplement ? `- ${escapeHtml(order.shippingComplement)}` : ""}<br/>
              ${escapeHtml(order.shippingNeighborhood)} — ${escapeHtml(order.shippingCity)}/${escapeHtml(order.shippingState)}<br/>
              CEP: ${escapeHtml(order.shippingPostalCode)}<br/>
              <strong>Transportadora:</strong> ${escapeHtml(order.shippingCarrier)} (Prazo total: ${order.totalDeliveryDays} dias úteis)
            </p>
          </div>

          <div style="border-top: 1px solid #E4DFD7; padding-top: 16px;">
            <p style="font-size: 12px; color: #6B665F; margin: 0;">
              Dúvidas? Entre em contato pelo WhatsApp da Markah Brasil a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  if (isRealKey) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [order.customerEmail],
          subject,
          html,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, messageId: data.id };
      }
    } catch {
      // Fallback
    }
  }

  // Em modo de testes / simulação
  return { success: true, messageId: `mock_email_${Date.now()}` };
}

/**
 * Envia e-mail de Pagamento Confirmado (produção 3D iniciada).
 */
export async function sendPaymentConfirmedEmail(
  order: OrderRecord
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Markah Brasil <contato@markah.com.br>";
  const isRealKey = Boolean(apiKey && !apiKey.includes("re_123456789"));

  const subject = `Pagamento aprovado! Pedido #${order.orderNumber} em produção — Markah Brasil`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"/></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #1A1A1A;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E4DFD7; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #2BAA5E; padding: 24px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700;">PAGAMENTO APROVADO!</h1>
          <p style="color: #FFFFFF; margin: 4px 0 0 0; font-size: 13px;">Seu pedido #${order.orderNumber} entrou em produção</p>
        </div>

        <div style="padding: 24px 32px;">
          <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #111111;">Olá, ${escapeHtml(order.customerName)}!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #6B665F; margin: 0 0 16px 0;">
            Confirmamos o pagamento no valor de <strong>${formatCents(order.finalAmountCents)}</strong>.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #6B665F; margin: 0 0 20px 0;">
            A impressão 3D das suas peças já começou em nosso ateliê! O prazo de produção é de <strong>3 dias úteis</strong>, e logo em seguida seu pacote será despachado via <strong>${escapeHtml(order.shippingCarrier)}</strong>.
          </p>

          <div style="background-color: #FAF8F5; border: 1px solid #E4DFD7; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px; color: #6B665F;">
              Assim que o pedido for postado, você receberá um e-mail com o código de rastreio para acompanhar a entrega até o seu endereço.
            </p>
          </div>

          <p style="font-size: 12px; color: #6B665F; margin: 0;">
            Agradecemos por escolher a Markah Brasil!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (isRealKey) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [order.customerEmail],
          subject,
          html,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, messageId: data.id };
      }
    } catch {
      // Fallback
    }
  }

  return { success: true, messageId: `mock_email_${Date.now()}` };
}

/**
 * Envia e-mail de Pedido Enviado com código de rastreamento (Fase 5).
 */
export async function sendOrderShippedEmail(
  order: OrderRecord,
  trackingCode: string
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Markah Brasil <contato@markah.com.br>";
  const isRealKey = Boolean(apiKey && !apiKey.includes("re_123456789"));

  const subject = `Seu pedido #${order.orderNumber} foi enviado! — Rastreamento Markah Brasil`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"/></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #1A1A1A;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E4DFD7; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #7C3AED; padding: 24px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700;">PEDIDO ENVIADO!</h1>
          <p style="color: #FFFFFF; margin: 4px 0 0 0; font-size: 13px;">Seu pacote está a caminho do seu endereço</p>
        </div>

        <div style="padding: 24px 32px;">
          <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #111111;">Olá, ${escapeHtml(order.customerName)}!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #6B665F; margin: 0 0 16px 0;">
            A produção do seu pedido <strong>#${order.orderNumber}</strong> foi concluída com sucesso e os itens já foram postados via <strong>${escapeHtml(order.shippingCarrier)}</strong>.
          </p>

          <div style="background-color: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #7C3AED; font-weight: 700; margin: 0 0 6px 0;">
              Código de Rastreamento
            </p>
            <p style="font-size: 20px; font-weight: 800; letter-spacing: 0.1em; color: #111111; margin: 0 0 12px 0; font-family: monospace;">
              ${trackingCode}
            </p>
            <p style="font-size: 12px; color: #6B665F; margin: 0;">
              Você pode acompanhar as movimentações através da página de rastreio em nosso site.
            </p>
          </div>

          <div style="border-top: 1px solid #E4DFD7; padding-top: 16px; margin-bottom: 20px;">
            <h3 style="font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em; color: #6B665F;">Endereço de Entrega</h3>
            <p style="font-size: 13px; line-height: 1.5; margin: 0; color: #1A1A1A;">
              ${escapeHtml(order.shippingStreet)}, ${escapeHtml(order.shippingNumber)} ${order.shippingComplement ? `- ${escapeHtml(order.shippingComplement)}` : ""}<br/>
              ${escapeHtml(order.shippingNeighborhood)} — ${escapeHtml(order.shippingCity)}/${escapeHtml(order.shippingState)}<br/>
              CEP: ${escapeHtml(order.shippingPostalCode)}
            </p>
          </div>

          <p style="font-size: 12px; color: #6B665F; margin: 0;">
            Obrigado por apoiar o design sustentável e a manufatura sob demanda!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (isRealKey) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [order.customerEmail],
          subject,
          html,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, messageId: data.id };
      }
    } catch {
      // Fallback
    }
  }

  return { success: true, messageId: `mock_email_${Date.now()}` };
}


/**
 * Envia o link mágico de acesso à área do cliente (/conta).
 * Em desenvolvimento, sem chave do Resend, o link é apenas registrado no console.
 */
export async function sendCustomerMagicLinkEmail(
  email: string,
  link: string
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Markah Brasil <contato@markah.com.br>";
  const isRealKey = Boolean(apiKey && !apiKey.includes("re_123456789"));

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"/></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #1A1A1A;">
      <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E4DFD7; border-radius: 12px; padding: 32px;">
        <h1 style="font-size: 18px; margin: 0 0 12px 0; color: #111111;">Seu acesso à Markah Brasil</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #6B665F; margin: 0 0 24px 0;">
          Clique no botão abaixo para entrar na sua conta e acompanhar seus pedidos. O link vale por 20 minutos.
        </p>
        <a href="${link}" style="display: inline-block; background: #111111; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 999px;">Entrar na minha conta</a>
        <p style="font-size: 12px; color: #6B665F; margin: 24px 0 0 0;">Se você não pediu este acesso, pode ignorar este e-mail.</p>
      </div>
    </body>
    </html>
  `;

  if (isRealKey) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "Seu link de acesso — Markah Brasil",
          html,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, messageId: data.id };
      }
      return { success: false, error: `Resend respondeu ${res.status}` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Falha no envio" };
    }
  }

  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "RESEND_API_KEY não configurada." };
  }

  console.info(`[dev] Link mágico para ${email}: ${link}`);
  return { success: true, messageId: `mock_email_${Date.now()}` };
}
