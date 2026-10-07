/**
 * Dados públicos da loja lidos das variáveis de ambiente.
 * Defina NEXT_PUBLIC_WHATSAPP_NUMBER (só números, com DDI e DDD: 55 + DDD + número).
 */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999").replace(
  /\D/g,
  ""
);

export const INSTAGRAM_USER = process.env.NEXT_PUBLIC_INSTAGRAM_USER || "markah_br";

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Retorna a URL base do site sempre sanitizada com protocolo (https://)
 * e sem barra final, evitando erros de URL inválida no SSR/Node.js.
 */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "https://markah.com.br").trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  return `https://${raw}`.replace(/\/$/, "");
}

/**
 * Retorna a URL base formatada como objeto URL para o metadataBase do Next.js
 */
export function getSiteMetadataBase(): URL {
  try {
    return new URL(getSiteUrl());
  } catch {
    return new URL("https://markah.com.br");
  }
}
