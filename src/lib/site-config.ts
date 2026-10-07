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
