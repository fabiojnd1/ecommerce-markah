/**
 * =====================================================================
 * ECOMMERCE MARKAH — TOKENS ASSINADOS (src/lib/session.ts)
 * =====================================================================
 * Sessões e links mágicos são tokens `payload.assinatura` assinados com
 * HMAC-SHA256 (Web Crypto — funciona no Node e no middleware/edge).
 * Sem a chave AUTH_SECRET ninguém consegue forjar um cookie de sessão
 * (ver mistakes.md M-001).
 */

export type SessionRole = "ADMIN" | "CUSTOMER";

export interface SessionPayload {
  /** Identificador do usuário */
  sub: string;
  role: SessionRole;
  email: string;
  name?: string;
  /** Expiração em segundos (epoch) */
  exp: number;
  /** Finalidade do token: sessão ou link mágico de login */
  purpose: "session" | "magic-link";
}

const DEV_FALLBACK_SECRET = "markah-dev-secret-nao-usar-em-producao";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const isPlaceholder = !secret || secret.startsWith("gerar-chave");
  if (isPlaceholder) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET não configurada. Gere uma com `openssl rand -base64 32` e defina na Vercel."
      );
    }
    return DEV_FALLBACK_SECRET;
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

/** Comparação em tempo constante para evitar ataques de temporização (timing attacks). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  const maxLen = Math.max(bufA.length, bufB.length);
  let diff = bufA.length ^ bufB.length;
  for (let i = 0; i < maxLen; i++) {
    const byteA = i < bufA.length ? bufA[i] : 0;
    const byteB = i < bufB.length ? bufB[i] : 0;
    diff |= byteA ^ byteB;
  }
  return diff === 0;
}

export async function signToken(
  data: Omit<SessionPayload, "exp">,
  ttlSeconds: number
): Promise<string> {
  const payload: SessionPayload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmac(body));
  return `${body}.${signature}`;
}

export async function verifyToken(
  token: string | undefined | null,
  expected: { role?: SessionRole; purpose: SessionPayload["purpose"] }
): Promise<SessionPayload | null> {
  try {
    if (!token) return null;
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    const expectedSignature = toBase64Url(await hmac(body));
    if (!safeEqual(signature, expectedSignature)) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.purpose !== expected.purpose) return null;
    if (expected.role && payload.role !== expected.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export const ADMIN_SESSION_COOKIE = "markah_admin_session";
export const CUSTOMER_SESSION_COOKIE = "markah_customer_session";
export const ADMIN_SESSION_TTL = 60 * 60 * 12; // 12 horas
export const CUSTOMER_SESSION_TTL = 60 * 60 * 24 * 30; // 30 dias
export const MAGIC_LINK_TTL = 60 * 20; // 20 minutos
