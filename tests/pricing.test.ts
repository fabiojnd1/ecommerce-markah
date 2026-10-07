import { describe, it, expect } from "vitest";
import {
  formatCents,
  calculatePixPrice,
  calculateInstallmentPrice,
  calculateDiscountPercentage,
  getProductPricing,
  calculateCartTotals,
} from "@/lib/pricing";

describe("src/lib/pricing.ts — Regras de Preço da Markah", () => {
  describe("formatCents", () => {
    it("deve formatar centavos em BRL corretamente", () => {
      expect(formatCents(14990)).toMatch(/R\$\s?149,90/);
      expect(formatCents(9900)).toMatch(/R\$\s?99,00/);
      expect(formatCents(0)).toMatch(/R\$\s?0,00/);
    });
  });

  describe("calculatePixPrice (5% padrão de desconto)", () => {
    it("deve calcular o desconto de 5% no Pix em centavos inteiros", () => {
      // R$ 100,00 (10000 centavos) com 5% de desconto -> R$ 95,00 (9500 centavos)
      expect(calculatePixPrice(10000, 5)).toBe(9500);

      // R$ 149,90 (14990 centavos) com 5% -> 14990 * 0.95 = 14240.5 -> arredondado para 14241 centavos
      expect(calculatePixPrice(14990, 5)).toBe(14241);

      // R$ 199,00 (19900 centavos) com 5% -> 19900 * 0.95 = 18905 centavos
      expect(calculatePixPrice(19900, 5)).toBe(18905);
    });

    it("não deve permitir números fracionários de centavos", () => {
      const pix = calculatePixPrice(15333, 5);
      expect(Number.isInteger(pix)).toBe(true);
    });
  });

  describe("calculateInstallmentPrice (3x sem juros)", () => {
    it("deve dividir o valor da parcela em 3x sem juros", () => {
      // 9900 centavos / 3 = 3300 centavos (R$ 33,00)
      expect(calculateInstallmentPrice(9900, 3)).toBe(3300);

      // 10000 centavos / 3 = 3333 centavos
      expect(calculateInstallmentPrice(10000, 3)).toBe(3333);
    });
  });

  describe("calculateDiscountPercentage", () => {
    it("deve calcular o percentual de desconto de/por", () => {
      // De R$ 200,00 por R$ 150,00 -> 25% de desconto
      expect(calculateDiscountPercentage(15000, 20000)).toBe(25);

      // Sem preço de comparação ou menor que o preço atual -> 0%
      expect(calculateDiscountPercentage(15000, null)).toBe(0);
      expect(calculateDiscountPercentage(15000, 15000)).toBe(0);
      expect(calculateDiscountPercentage(15000, 12000)).toBe(0);
    });
  });

  describe("getProductPricing", () => {
    it("deve gerar resumo completo com preço promocional, Pix e parcelas", () => {
      const pricing = getProductPricing({
        priceCents: 18900,
        compareAtPriceCents: 21900,
        pixDiscountPercent: 5,
        maxInstallments: 3,
      });

      expect(pricing.priceCents).toBe(18900);
      expect(pricing.compareAtPriceCents).toBe(21900);
      expect(pricing.hasDiscount).toBe(true);
      expect(pricing.discountPercentage).toBe(14); // 3000 / 21900 = 13.69% -> 14%
      expect(pricing.pixPriceCents).toBe(17955); // 18900 * 0.95 = 17955
      expect(pricing.formatted.price).toMatch(/R\$\s?189,00/);
      expect(pricing.formatted.pixPrice).toMatch(/R\$\s?179,55/);
      expect(pricing.formatted.compareAtPrice).toMatch(/R\$\s?219,00/);
    });
  });

  describe("calculateCartTotals (PRD §5.1 & §5.2)", () => {
    it("deve calcular o subtotal, progresso para frete grátis e desconto Pix apenas sobre os itens", () => {
      // 1 Luminária Saturno (R$ 189,00) + frete de R$ 20,00
      const cart = calculateCartTotals({
        items: [{ priceCents: 18900, quantity: 1 }],
        shippingPriceCents: 2000,
        pixDiscountPercent: 5,
        freeShippingThresholdCents: 20000,
      });

      expect(cart.subtotalCents).toBe(18900);
      expect(cart.isFreeShippingQualified).toBe(false);
      expect(cart.remainingForFreeShippingCents).toBe(1100); // Faltam R$ 11,00
      expect(cart.freeShippingProgressPercent).toBe(95); // 18900 / 20000 = 94.5% -> 95%
      expect(cart.effectiveShippingPriceCents).toBe(2000);
      expect(cart.totalCents).toBe(20900); // 18900 + 2000

      // Desconto Pix de 5% sobre R$ 189,00 = R$ 9,45 (945 centavos)
      // Total Pix = (18900 - 945) + 2000 = 17955 + 2000 = 19955 centavos
      expect(cart.pixDiscountAmountCents).toBe(945);
      expect(cart.pixTotalCents).toBe(19955);
    });

    it("deve zerar o frete quando o subtotal atingir ou superar R$ 200,00", () => {
      // 2 Luminárias Saturno (R$ 378,00)
      const cart = calculateCartTotals({
        items: [{ priceCents: 18900, quantity: 2 }],
        shippingPriceCents: 2000,
        freeShippingThresholdCents: 20000,
      });

      expect(cart.subtotalCents).toBe(37800);
      expect(cart.isFreeShippingQualified).toBe(true);
      expect(cart.remainingForFreeShippingCents).toBe(0);
      expect(cart.freeShippingProgressPercent).toBe(100);
      expect(cart.effectiveShippingPriceCents).toBe(0);
      expect(cart.totalCents).toBe(37800);
    });

    it("deve aplicar cupom percentual e calcular desconto Pix sobre o valor líquido dos produtos (PRD §5.1)", () => {
      // Subtotal de R$ 200,00 (20000 centavos) com cupom de 10%
      // Desconto do cupom = R$ 20,00 (2000 centavos)
      // Subtotal líquido = R$ 180,00 (18000 centavos)
      // Frete de R$ 25,00 (2500 centavos)
      // Desconto Pix (5%) sobre R$ 180,00 = R$ 9,00 (900 centavos)
      // Total Pix = 18000 - 900 + 2500 = 19600 centavos (R$ 196,00)
      const cart = calculateCartTotals({
        items: [{ priceCents: 20000, quantity: 1 }],
        shippingPriceCents: 2500,
        pixDiscountPercent: 5,
        freeShippingThresholdCents: 20000,
        coupon: {
          code: "BEMVINDO10",
          type: "PERCENTAGE",
          value: 10,
        },
      });

      expect(cart.subtotalCents).toBe(20000);
      expect(cart.couponDiscountCents).toBe(2000);
      expect(cart.discountedSubtotalCents).toBe(18000);
      // Como o subtotal líquido (18000) ficou abaixo de 20000, não qualifica frete grátis (PRD §5.2)
      expect(cart.isFreeShippingQualified).toBe(false);
      expect(cart.effectiveShippingPriceCents).toBe(2500);
      expect(cart.totalCents).toBe(20500); // 18000 + 2500
      expect(cart.pixDiscountAmountCents).toBe(900);
      expect(cart.pixTotalCents).toBe(19600);
      expect(cart.formatted.couponDiscount).toMatch(/-R\$\s?20,00/);
    });

    it("deve aplicar cupom de valor fixo e limitar ao subtotal se o cupom for maior", () => {
      // Subtotal R$ 15,00 com cupom de R$ 20,00
      const cart = calculateCartTotals({
        items: [{ priceCents: 1500, quantity: 1 }],
        coupon: {
          code: "MARKAH20",
          type: "FIXED",
          value: 2000,
        },
      });

      expect(cart.couponDiscountCents).toBe(1500);
      expect(cart.discountedSubtotalCents).toBe(0);
      expect(cart.totalCents).toBe(0);
    });

    it("deve conceder frete grátis quando utilizado cupom do tipo FREE_SHIPPING mesmo com valor abaixo do threshold", () => {
      // Subtotal de R$ 80,00 com frete de R$ 25,00
      const cart = calculateCartTotals({
        items: [{ priceCents: 8000, quantity: 1 }],
        shippingPriceCents: 2500,
        coupon: {
          code: "FRETEGRATIS",
          type: "FREE_SHIPPING",
          value: 0,
        },
      });

      expect(cart.isFreeShippingQualified).toBe(true);
      expect(cart.effectiveShippingPriceCents).toBe(0);
      expect(cart.totalCents).toBe(8000);
      expect(cart.freeShippingProgressPercent).toBe(100);
    });
  });
});

describe("Frete grátis — opção mais barata e cupom (PRD §5.2)", () => {
  it("com frete grátis, cobra apenas a diferença quando o cliente escolhe uma opção mais cara", () => {
    const totals = calculateCartTotals({
      items: [{ priceCents: 25000, quantity: 1 }],
      shippingPriceCents: 3500, // SEDEX
      cheapestShippingPriceCents: 1800, // PAC
    });
    expect(totals.isFreeShippingQualified).toBe(true);
    expect(totals.effectiveShippingPriceCents).toBe(1700);
  });

  it("não concede frete grátis quando o cupom deixa o subtotal abaixo de R$ 200", () => {
    const totals = calculateCartTotals({
      items: [{ priceCents: 21000, quantity: 1 }],
      shippingPriceCents: 1800,
      coupon: { code: "DESC20", type: "FIXED", value: 2000 },
    });
    expect(totals.discountedSubtotalCents).toBe(19000);
    expect(totals.isFreeShippingQualified).toBe(false);
    expect(totals.effectiveShippingPriceCents).toBe(1800);
  });
});
