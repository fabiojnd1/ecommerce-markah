import { describe, it, expect } from "vitest";
import {
  validateCouponAction,
  calculateServerCartTotalsAction,
} from "@/server/cart-actions";

describe("src/server/cart-actions.ts — Server Actions de Carrinho e Cupom (P-001)", () => {
  describe("validateCouponAction", () => {
    it("deve rejeitar cupom vazio ou com espaços em branco", async () => {
      const res = await validateCouponAction("   ", 10000);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Digite um código de cupom");
    });

    it("deve rejeitar cupom inexistente", async () => {
      const res = await validateCouponAction("CUPOMFALSO123", 10000);
      expect(res.success).toBe(false);
      expect(res.error).toContain("não encontrado ou expirado");
    });

    it("deve validar com sucesso cupom percentual de boas-vindas BEMVINDO10", async () => {
      const res = await validateCouponAction("bemvindo10", 18900);
      expect(res.success).toBe(true);
      expect(res.coupon).toBeDefined();
      expect(res.coupon?.code).toBe("BEMVINDO10");
      expect(res.coupon?.type).toBe("PERCENTAGE");
      expect(res.coupon?.value).toBe(10);
    });

    it("deve bloquear cupom MARKAH20 quando o pedido mínimo não for atingido", async () => {
      // Pedido mínimo: R$ 150,00 (15000 centavos)
      // Carrinho com R$ 120,00 (12000 centavos)
      const res = await validateCouponAction("MARKAH20", 12000);
      expect(res.success).toBe(false);
      expect(res.error).toContain("a partir de R$ 150,00");
    });

    it("deve aprovar cupom MARKAH20 quando o pedido atingir o valor mínimo", async () => {
      // Carrinho com R$ 189,00 >= R$ 150,00
      const res = await validateCouponAction("MARKAH20", 18900);
      expect(res.success).toBe(true);
      expect(res.coupon?.value).toBe(2000); // R$ 20,00
    });
  });

  describe("calculateServerCartTotalsAction", () => {
    it("deve recalcular os totais no servidor com fidelidade de regras financeiras", async () => {
      const res = await calculateServerCartTotalsAction(
        [{ priceCents: 18900, quantity: 1 }],
        1500, // Frete R$ 15,00
        "BEMVINDO10"
      );

      expect(res.success).toBe(true);
      expect(res.totals).toBeDefined();
      // Subtotal = 18900
      // 10% Cupom = 1890
      // Subtotal Líquido = 17010
      // Frete = 1500
      // Total = 18510
      // Pix 5% sobre 17010 = 851 (Math.round(850.5))
      // Total Pix = 17010 - 851 + 1500 = 17659
      expect(res.totals?.subtotalCents).toBe(18900);
      expect(res.totals?.couponDiscountCents).toBe(1890);
      expect(res.totals?.discountedSubtotalCents).toBe(17010);
      expect(res.totals?.totalCents).toBe(18510);
      expect(res.totals?.pixDiscountAmountCents).toBe(851);
      expect(res.totals?.pixTotalCents).toBe(17659);
    });
  });
});
