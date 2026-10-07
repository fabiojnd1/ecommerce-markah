import { describe, it, expect } from "vitest";
import {
  consolidatePackage,
  calculateShippingQuotes,
} from "@/lib/shipping/melhor-envio";

describe("src/lib/shipping/melhor-envio.ts — Regras de Frete e Prazos", () => {
  const sampleItems = [
    {
      weightGrams: 420,
      packageHeightCm: 30,
      packageWidthCm: 30,
      packageDepthCm: 30,
      priceCents: 18900,
      quantity: 1,
    },
  ];

  describe("consolidatePackage", () => {
    it("deve somar pesos e respeitar dimensões mínimas para os Correios", () => {
      const pkg = consolidatePackage(sampleItems);
      expect(pkg.totalWeightGrams).toBe(420);
      expect(pkg.weightKg).toBe(0.42);
      expect(pkg.heightCm).toBeGreaterThanOrEqual(8);
      expect(pkg.widthCm).toBeGreaterThanOrEqual(12);
      expect(pkg.depthCm).toBeGreaterThanOrEqual(16);
    });
  });

  describe("calculateShippingQuotes & PRD §5.3 (Prazos de Produção)", () => {
    it("deve somar o prazo padrão de produção (3 dias úteis) ao prazo da transportadora", async () => {
      const quotes = await calculateShippingQuotes({
        destinationPostalCode: "01310100", // Av. Paulista, SP
        items: sampleItems,
        productionDays: 3,
      });

      expect(quotes.length).toBeGreaterThan(0);
      const pac = quotes.find((q) => q.name === "PAC");
      expect(pac).toBeDefined();
      expect(pac?.productionDays).toBe(3);
      expect(pac?.totalDays).toBe(pac!.productionDays + pac!.carrierDays);
      expect(pac?.formatted.prazoTexto).toContain("Produção (3 dias úteis)");
    });

    it("deve rejeitar CEPs com formato inválido", async () => {
      await expect(
        calculateShippingQuotes({
          destinationPostalCode: "123",
          items: sampleItems,
        })
      ).rejects.toThrow(/CEP de destino inválido/);
    });
  });

  describe("PRD §5.2: Frete Grátis acima de R$ 200,00", () => {
    it("não deve conceder frete grátis se o subtotal for menor que R$ 200,00", async () => {
      // 1 item de R$ 189,00 < R$ 200,00
      const quotes = await calculateShippingQuotes({
        destinationPostalCode: "01310100",
        items: sampleItems,
        freeShippingThresholdCents: 20000,
      });

      const pac = quotes.find((q) => q.name === "PAC");
      expect(pac?.isFree).toBe(false);
      expect(pac?.priceCents).toBeGreaterThan(0);
    });

    it("deve conceder frete grátis (R$ 0,00) na opção mais barata se subtotal >= R$ 200,00", async () => {
      // 2 itens de R$ 189,00 = R$ 378,00 >= R$ 200,00
      const quotes = await calculateShippingQuotes({
        destinationPostalCode: "01310100",
        items: [{ ...sampleItems[0], quantity: 2 }],
        freeShippingThresholdCents: 20000,
      });

      const pac = quotes.find((q) => q.name === "PAC");
      expect(pac?.isFree).toBe(true);
      expect(pac?.priceCents).toBe(0);
      expect(pac?.formatted.price).toBe("Grátis");

      // SEDEX não deve ficar grátis
      const sedex = quotes.find((q) => q.name === "SEDEX");
      expect(sedex?.isFree).toBe(false);
      expect(sedex?.priceCents).toBeGreaterThan(0);
    });
  });

  describe("getShippingQuotesAction (Server Action)", () => {
    it("deve retornar erro para CEP inválido ou vazio sem estourar exceção não tratada", async () => {
      const { getShippingQuotesAction } = await import("@/server/shipping-actions");
      const res = await getShippingQuotesAction("123", sampleItems);
      expect(res.success).toBe(false);
      expect(res.error).toContain("CEP inválido");
    });

    it("deve retornar sucesso com cotações formatadas para CEP válido", async () => {
      const { getShippingQuotesAction } = await import("@/server/shipping-actions");
      const res = await getShippingQuotesAction("01310-100", sampleItems);
      expect(res.success).toBe(true);
      expect(res.quotes).toBeDefined();
      expect(res.quotes!.length).toBeGreaterThan(0);
    });
  });
});

