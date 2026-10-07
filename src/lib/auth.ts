import { cookies } from "next/headers";
import { db } from "./db";
import { isDatabaseConfigured } from "./runtime";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_TTL,
  MAGIC_LINK_TTL,
  safeEqual,
  signToken,
  verifyToken,
} from "./session";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
}

// Credenciais usadas SOMENTE em desenvolvimento local, quando ADMIN_EMAIL /
// ADMIN_PASSWORD não estão definidas. Em produção são recusadas (mistakes.md M-002).
const DEV_ADMIN_EMAIL = "admin@markah.com.br";
const DEV_ADMIN_PASS = "markah2026";

function getAdminCredentials(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD;
  const password = rawPassword ? rawPassword.trim() : undefined;
  if (email && password) {
    return { email, password };
  }
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return { email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASS };
}

// ==========================================
// ADMINISTRADOR
// ==========================================

/**
 * Retorna o administrador autenticado (cookie assinado e não expirado).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // cookies() fica FORA do try: o Next usa a exceção dela para marcar a página
  // como dinâmica. Engoli-la fazia /admin e /conta virarem páginas estáticas
  // geradas no build (mistakes.md M-008).
  const cookieStore = await cookies();
  try {
    const payload = await verifyToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, {
      role: "ADMIN",
      purpose: "session",
    });
    if (!payload) return null;

    return {
      id: payload.sub,
      name: payload.name || "Administrador Markah",
      email: payload.email,
      role: "ADMIN",
    };
  } catch {
    return null;
  }
}

/**
 * Regra P-007: proteção obrigatória no servidor.
 * Deve ser chamada no topo de toda Server Action e página do painel /admin.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error(
      "Acesso não autorizado: privilégio de administrador necessário (P-007)."
    );
  }
  return user;
}

interface LoginAttemptRecord {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export function resetLoginAttemptsForTesting(): void {
  loginAttempts.clear();
}

/**
 * Autenticação do administrador (e-mail + senha definidos em ADMIN_EMAIL / ADMIN_PASSWORD).
 * Protegido contra ataques de força bruta com bloqueio temporal e limite de tentativas.
 */
export async function authenticateAdmin(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) || "";

  if (!email || !password) {
    return { success: false, error: "Informe e-mail e senha." };
  }

  // Verificação de bloqueio por tentativas excessivas (Anti Brute Force)
  const attemptKey = email;
  const now = Date.now();
  const record = loginAttempts.get(attemptKey);

  if (record?.lockedUntil && record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return {
      success: false,
      error: `Muitas tentativas incorretas. Por segurança, tente novamente em ${remainingMinutes} minuto(s).`,
    };
  }

  const credentials = getAdminCredentials();
  if (!credentials) {
    return {
      success: false,
      error: "Login administrativo não configurado (defina ADMIN_EMAIL e ADMIN_PASSWORD).",
    };
  }

  const emailOk = safeEqual(email, credentials.email);
  const rawInputPassword = (formData.get("password") as string) || "";
  const trimmedInputPassword = rawInputPassword.trim();
  const passwordOk =
    safeEqual(trimmedInputPassword, credentials.password) ||
    safeEqual(rawInputPassword, process.env.ADMIN_PASSWORD || "");
  if (!emailOk || !passwordOk) {
    // Registra tentativa falha e calcula bloqueio se exceder limite
    const currentAttempts =
      record && now - record.lastAttempt < ATTEMPT_WINDOW_MS
        ? record.attempts + 1
        : 1;

    const lockedUntil =
      currentAttempts >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_DURATION_MS : undefined;

    loginAttempts.set(attemptKey, {
      attempts: currentAttempts,
      lastAttempt: now,
      lockedUntil,
    });

    // Atraso de 500ms em caso de erro para frear ataques automatizados de dicionário
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (lockedUntil) {
      return {
        success: false,
        error: "Limite de tentativas excedido. O login foi bloqueado temporariamente por 15 minutos.",
      };
    }

    const remaining = MAX_FAILED_ATTEMPTS - currentAttempts;
    return {
      success: false,
      error: `Credenciais administrativas inválidas. Restam ${remaining} tentativa(s) antes do bloqueio.`,
    };
  }

  // Sucesso: limpa histórico de tentativas daquele e-mail
  loginAttempts.delete(attemptKey);

  const token = await signToken(
    { sub: "admin", role: "ADMIN", email, name: "Administrador Markah", purpose: "session" },
    ADMIN_SESSION_TTL
  );

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL,
  });

  return { success: true };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

// ==========================================
// CLIENTE (login por link mágico enviado ao e-mail)
// ==========================================

export async function getCustomerUser(): Promise<SessionUser | null> {
  // cookies() fica FORA do try: o Next usa a exceção dela para marcar a página
  // como dinâmica. Engoli-la fazia /admin e /conta virarem páginas estáticas
  // geradas no build (mistakes.md M-008).
  const cookieStore = await cookies();
  try {
    const payload = await verifyToken(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value, {
      role: "CUSTOMER",
      purpose: "session",
    });
    if (!payload) return null;

    return {
      id: payload.sub,
      name: payload.name || "Cliente Markah",
      email: payload.email,
      role: "CUSTOMER",
    };
  } catch {
    return null;
  }
}

/**
 * Gera o token do link mágico. O cliente só entra na conta depois de abrir
 * o link recebido no próprio e-mail (prova de que o e-mail é dele).
 */
export async function createCustomerMagicLinkToken(email: string): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  return signToken(
    { sub: cleanEmail, role: "CUSTOMER", email: cleanEmail, purpose: "magic-link" },
    MAGIC_LINK_TTL
  );
}

/**
 * Valida o link mágico e abre a sessão do cliente.
 * Deve ser chamado apenas pela rota /conta/entrar.
 */
export async function authenticateCustomerWithMagicLink(
  token: string
): Promise<{ success: boolean; user?: SessionUser }> {
  const payload = await verifyToken(token, { role: "CUSTOMER", purpose: "magic-link" });
  if (!payload) return { success: false };

  const cleanEmail = payload.email.trim().toLowerCase();
  let userId = cleanEmail;
  let name = "Cliente Markah";

  if (isDatabaseConfigured()) {
    const dbUser = await db.user.upsert({
      where: { email: cleanEmail },
      update: {},
      create: { email: cleanEmail, name, role: "CUSTOMER" },
    });
    userId = dbUser.id;
    name = dbUser.name || name;
  }

  const sessionToken = await signToken(
    { sub: userId, role: "CUSTOMER", email: cleanEmail, name, purpose: "session" },
    CUSTOMER_SESSION_TTL
  );

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_TTL,
  });

  return { success: true, user: { id: userId, name, email: cleanEmail, role: "CUSTOMER" } };
}

export async function logoutCustomer(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}
