import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/auth";
import {
  listAllCoupons,
  findCouponByCode,
  saveCoupon,
  deleteCoupon,
  toggleCouponStatus,
  incrementCouponUsage,
  validateCouponEligibility,
} from "@/lib/promotions-repository";
import {
  getAdminCouponsAction,
  saveCouponAction,
  toggleCouponAction,
  deleteCouponAction,
} from "@/server/promotions-actions";
import { validateCouponAction } from "@/server/cart-actions";
import { getProductPricing, calculateDiscountPercentage } from "@/lib/pricing";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Fase 6 — Promoções, Cupons Dinâmicos e Kits (v0.7.0)", () => {
  const mockAdminUser = {
    id: "admin_test",
    name: "Admin Markah",
    email: "admin@markah.com.br",
    role: "ADMIN" as const,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Regra P-007: Proteção obrigatória no servidor para gestão de cupons", () => {
    it("deve rejeitar listagem ou mutação de cupons se o usuário não for administrador", async () => {
      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(getAdminCouponsAction()).rejects.toThrow(/Acesso não autorizado/);

      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(
        saveCouponAction({
          code: "HACK50",
          type: "PERCENTAGE",
          value: 50,
        })
      ).rejects.toThrow(/Acesso não autorizado/);
    });
  });

  describe("Validação de Elegibilidade de Cupons (promotions-repository)", () => {
    it("deve rejeitar código inexistente", async () => {
      const res = await validateCouponEligibility("INEXISTENTE", 20000);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("não encontrado ou expirado");
    });

    it("deve validar cupom percentual de boas-vindas ativo", async () => {
      const res = await validateCouponEligibility("BEMVINDO10", 15000);
      expect(res.isValid).toBe(true);
      expect(res.coupon?.code).toBe("BEMVINDO10");
      expect(res.coupon?.type).toBe("PERCENTAGE");
      expect(res.coupon?.value).toBe(10);
    });

    it("deve rejeitar cupom quando o subtotal for inferior ao pedido mínimo", async () => {
      // MARKAH20 exige pedido mínimo de R$ 150,00 (15000 centavos)
      const resUnder = await validateCouponEligibility("MARKAH20", 10000);
      expect(resUnder.isValid).toBe(false);
      expect(resUnder.error).toContain("a partir de R$ 150,00");

      const resValid = await validateCouponEligibility("MARKAH20", 16000);
      expect(resValid.isValid).toBe(true);
    });

    it("deve rejeitar cupom desativado/pausado", async () => {
      await saveCoupon({
        code: "CUPOMPAUSADO",
        type: "PERCENTAGE",
        value: 15,
        active: false,
      });

      const res = await validateCouponEligibility("CUPOMPAUSADO", 20000);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("não está mais ativo");
    });

    it("deve rejeitar cupom que ultrapassou o limite máximo de utilizações", async () => {
      await saveCoupon({
        code: "ESGOTADO10",
        type: "PERCENTAGE",
        value: 10,
        usageLimit: 5,
        active: true,
      });

      // Simula 5 usos
      for (let i = 0; i < 5; i++) {
        await incrementCouponUsage("ESGOTADO10");
      }

      const res = await validateCouponEligibility("ESGOTADO10", 20000);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("limite máximo de utilizações");
    });

    it("deve rejeitar cupom expirado por data de vigência", async () => {
      await saveCoupon({
        code: "BLACKFRIDAYPASSADA",
        type: "PERCENTAGE",
        value: 30,
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // ontem
        active: true,
      });

      const res = await validateCouponEligibility("BLACKFRIDAYPASSADA", 20000);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("expirou");
    });
  });

  describe("Integração com Server Action do Carrinho (validateCouponAction)", () => {
    it("deve integrar perfeitamente com a action consumida pelo Drawer e Checkout", async () => {
      const res = await validateCouponAction("BEMVINDO10", 25000);
      expect(res.success).toBe(true);
      expect(res.coupon?.code).toBe("BEMVINDO10");
      expect(res.coupon?.value).toBe(10);
    });
  });

  describe("CRUD Administrativo de Cupons (promotions-actions)", () => {
    beforeEach(() => {
      vi.spyOn(auth, "requireAdmin").mockResolvedValue(mockAdminUser);
    });

    it("deve criar um novo cupom com validação de campos", async () => {
      const res = await saveCouponAction({
        code: "PROMO25",
        type: "PERCENTAGE",
        value: 25,
        description: "25% de desconto especial",
        minOrderCents: 10000,
        usageLimit: 50,
      });

      expect(res.success).toBe(true);
      expect(res.coupon?.code).toBe("PROMO25");
      expect(res.coupon?.value).toBe(25);

      // Consulta se foi persistido
      const found = await findCouponByCode("PROMO25");
      expect(found).not.toBeNull();
      expect(found?.code).toBe("PROMO25");
    });

    it("deve recusar cupom com porcentagem inválida (< 1 ou > 100)", async () => {
      const res1 = await saveCouponAction({
        code: "ZEROOFF",
        type: "PERCENTAGE",
        value: 0,
      });
      expect(res1.success).toBe(false);

      const res2 = await saveCouponAction({
        code: "MAXOFF",
        type: "PERCENTAGE",
        value: 120,
      });
      expect(res2.success).toBe(false);
    });

    it("deve permitir pausar e reativar cupom", async () => {
      const created = await saveCoupon({
        code: "PAUSAVEL",
        type: "PERCENTAGE",
        value: 10,
        active: true,
      });

      const paused = await toggleCouponAction(created.id, false);
      expect(paused.success).toBe(true);
      expect(paused.coupon?.active).toBe(false);

      const reactivated = await toggleCouponAction(created.id, true);
      expect(reactivated.success).toBe(true);
      expect(reactivated.coupon?.active).toBe(true);
    });

    it("deve permitir excluir um cupom", async () => {
      const created = await saveCoupon({
        code: "EXCLUIVEL",
        type: "FIXED",
        value: 1500,
      });

      const del = await deleteCouponAction(created.id);
      expect(del.success).toBe(true);

      const found = await findCouponByCode("EXCLUIVEL");
      expect(found).toBeNull();
    });
  });

  describe("Precificação Promocional De/Por e Economia de Kits", () => {
    it("deve calcular porcentagem de economia no preço De/Por", () => {
      // De R$ 200,00 por R$ 160,00 = 20% OFF
      const discount = calculateDiscountPercentage(16000, 20000);
      expect(discount).toBe(20);

      // Preço sem compareAt ou menor
      expect(calculateDiscountPercentage(16000, 16000)).toBe(0);
      expect(calculateDiscountPercentage(16000, null)).toBe(0);
    });

    it("deve formatar sumário promocional com desconto Pix e parcelas", () => {
      const pricing = getProductPricing({
        priceCents: 18990, // R$ 189,90
        compareAtPriceCents: 22990, // R$ 229,90
      });

      expect(pricing.hasDiscount).toBe(true);
      expect(pricing.discountPercentage).toBe(17);
      expect(pricing.formatted.price).toMatch(/R\$\s?189,90/);
      expect(pricing.formatted.compareAtPrice).toMatch(/R\$\s?229,90/);
      expect(pricing.pixDiscountPercent).toBe(5);
    });
  });
});
