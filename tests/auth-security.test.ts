import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Cookie store simulado para next/headers
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));

import { signToken, verifyToken, ADMIN_SESSION_COOKIE } from "@/lib/session";
import {
  authenticateAdmin,
  getCurrentUser,
  createCustomerMagicLinkToken,
  authenticateCustomerWithMagicLink,
  getCustomerUser,
  resetLoginAttemptsForTesting,
} from "@/lib/auth";

function loginForm(email: string, password: string) {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  return fd;
}

beforeEach(() => {
  jar.clear();
  resetLoginAttemptsForTesting();
});
afterEach(() => {
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
});

describe("Sessões assinadas (M-001)", () => {
  it("aceita token íntegro e rejeita token adulterado", async () => {
    const token = await signToken({ sub: "admin", role: "ADMIN", email: "a@b.com", purpose: "session" }, 60);
    expect(await verifyToken(token, { role: "ADMIN", purpose: "session" })).not.toBeNull();

    const [body, sig] = token.split(".");
    const forgedBody = Buffer.from(
      JSON.stringify({ sub: "x", role: "ADMIN", email: "hacker@x.com", purpose: "session", exp: 9999999999 })
    ).toString("base64url");
    expect(await verifyToken(`${forgedBody}.${sig}`, { role: "ADMIN", purpose: "session" })).toBeNull();
    expect(await verifyToken(`${body}.assinaturafalsa`, { role: "ADMIN", purpose: "session" })).toBeNull();
  });

  it("rejeita token expirado e token de outra finalidade", async () => {
    const expired = await signToken({ sub: "a", role: "ADMIN", email: "a@b.com", purpose: "session" }, -10);
    expect(await verifyToken(expired, { role: "ADMIN", purpose: "session" })).toBeNull();

    const magic = await signToken({ sub: "c", role: "CUSTOMER", email: "c@d.com", purpose: "magic-link" }, 60);
    expect(await verifyToken(magic, { role: "CUSTOMER", purpose: "session" })).toBeNull();
  });

  it("não aceita o cookie no formato antigo 'id:ADMIN:email'", async () => {
    jar.set(ADMIN_SESSION_COOKIE, "admin_master:ADMIN:hacker@x.com");
    expect(await getCurrentUser()).toBeNull();
  });
});

describe("Login do administrador (M-002)", () => {
  it("usa ADMIN_EMAIL / ADMIN_PASSWORD e recusa a senha padrão antiga", async () => {
    process.env.ADMIN_EMAIL = "dono@markah.com.br";
    process.env.ADMIN_PASSWORD = "SenhaForte!2026";

    const oldDefault = await authenticateAdmin(loginForm("admin@markah.com.br", "markah2026"));
    expect(oldDefault.success).toBe(false);

    const wrong = await authenticateAdmin(loginForm("dono@markah.com.br", "errada"));
    expect(wrong.success).toBe(false);
    expect(await getCurrentUser()).toBeNull();

    const ok = await authenticateAdmin(loginForm("dono@markah.com.br", "SenhaForte!2026"));
    expect(ok.success).toBe(true);
    expect((await getCurrentUser())?.email).toBe("dono@markah.com.br");
  });

  it("bloqueia tentativas repetidas de força bruta após 5 falhas consecutivas", async () => {
    process.env.ADMIN_EMAIL = "dono@markah.com.br";
    process.env.ADMIN_PASSWORD = "SenhaForte!2026";

    // 4 falhas
    for (let i = 0; i < 4; i++) {
      const res = await authenticateAdmin(loginForm("dono@markah.com.br", `senha-errada-${i}`));
      expect(res.success).toBe(false);
      expect(res.error).toContain("tentativa(s) antes do bloqueio");
    }

    // 5ª falha: aciona o bloqueio
    const fifth = await authenticateAdmin(loginForm("dono@markah.com.br", "senha-errada-5"));
    expect(fifth.success).toBe(false);
    expect(fifth.error).toContain("bloqueado temporariamente");

    // Tentativa subsequente é imediatamente rejeitada pelo bloqueio
    const sixth = await authenticateAdmin(loginForm("dono@markah.com.br", "SenhaForte!2026"));
    expect(sixth.success).toBe(false);
    expect(sixth.error).toContain("Muitas tentativas incorretas");
  });
});

describe("Login do cliente por link mágico (M-005)", () => {
  it("só abre a sessão com um link válido", async () => {
    const bad = await authenticateCustomerWithMagicLink("token.invalido");
    expect(bad.success).toBe(false);
    expect(await getCustomerUser()).toBeNull();

    const token = await createCustomerMagicLinkToken("Cliente@Exemplo.com");
    const ok = await authenticateCustomerWithMagicLink(token);
    expect(ok.success).toBe(true);
    expect((await getCustomerUser())?.email).toBe("cliente@exemplo.com");
  });
});
