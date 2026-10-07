/**
 * =====================================================================
 * ECOMMERCE MARKAH — AMBIENTE DE EXECUÇÃO (src/lib/runtime.ts)
 * =====================================================================
 * Regra: simulações e dados em memória existem SOMENTE para desenvolvimento
 * local e testes. Em produção, falhas de banco, pagamento ou frete devem
 * aparecer como erro, nunca ser "resolvidas" com dados falsos
 * (ver decisoes.md D-018 e mistakes.md M-003).
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Dados de demonstração (catálogo e pedidos em memória) só em desenvolvimento,
 * ou quando ALLOW_DEMO_DATA=true for definido explicitamente — útil para rodar
 * `npm run build && npm start` no computador sem banco. NUNCA definir na Vercel
 * em produção. Pagamentos continuam sem simulação em produção mesmo com esta opção.
 */
export function isDemoDataAllowed(): boolean {
  return !isProduction() || process.env.ALLOW_DEMO_DATA === "true";
}

/**
 * Indica se há um banco de dados real configurado.
 * Em produção, a ausência de DATABASE_URL é um erro de configuração.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  const configured = Boolean(url && !url.includes("ep-sample"));
  if (!configured && !isDemoDataAllowed()) {
    throw new Error("DATABASE_URL não configurada em produção.");
  }
  return configured;
}

/**
 * Chamar dentro de um `catch` antes de usar dados em memória:
 * em produção relança o erro original em vez de mascará-lo.
 */
export function assertDevFallbackAllowed(err: unknown): void {
  if (!isDemoDataAllowed()) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}
