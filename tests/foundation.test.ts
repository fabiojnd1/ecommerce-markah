import { describe, it, expect } from "vitest";
import { formatCurrency, cn } from "@/lib/utils";

describe("Fase 0 — Fundação e Regras Básicas", () => {
  describe("Regra D-011: Valores monetários em centavos inteiros", () => {
    it("deve formatar centavos em Real brasileiro (BRL) corretamente", () => {
      // 10000 centavos = R$ 100,00
      const formatted100 = formatCurrency(10000);
      expect(formatted100).toMatch(/R\$\s?100,00/);

      // 1990 centavos = R$ 19,90
      const formatted19 = formatCurrency(1990);
      expect(formatted19).toMatch(/R\$\s?19,90/);

      // 0 centavos = R$ 0,00
      const formattedZero = formatCurrency(0);
      expect(formattedZero).toMatch(/R\$\s?0,00/);
    });
  });

  describe("Utilitário cn (classNames e tailwindMerge)", () => {
    it("deve combinar classes e resolver conflitos do Tailwind", () => {
      const result = cn("px-2 py-1", "px-4", { "text-white": true, "text-black": false });
      expect(result).toBe("py-1 px-4 text-white");
    });
  });

  describe("Tokens e identidade visual de design.md", () => {
    it("deve validar que os nomes das variáveis CSS neutras e de acento estão bem definidos", () => {
      const designTokens = [
        "--bg",
        "--surface",
        "--surface-alt",
        "--border",
        "--text",
        "--text-muted",
        "--ink",
        "--magenta",
        "--laranja",
        "--amarelo",
        "--verde",
        "--ciano",
        "--violeta",
      ];
      expect(designTokens.length).toBe(13);
    });
  });
});
