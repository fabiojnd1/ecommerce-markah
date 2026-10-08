import { describe, it, expect, vi } from "vitest";
import {
  saveProductAction,
  duplicateProductAction,
  deleteProductAction,
} from "@/server/admin-actions";
import * as auth from "@/lib/auth";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Fase 2 — Painel Administrativo e Regras de Segurança", () => {
  describe("Regra P-007: Proteção obrigatória no servidor", () => {
    it("deve rejeitar mutações de produto se o usuário não for administrador", async () => {
      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(
        saveProductAction({
          name: "Peça Não Autorizada",
          slug: "peca-nao-autorizada",
          description: "Teste",
          categorySlug: "vasos",
          material: "PLA",
          isSustainable: true,
          productionDays: 3,
          dimensions: "10 × 10 × 10 cm",
          weightGrams: 200,
          priceCents: 10000,
          packageHeightCm: 15,
          packageWidthCm: 15,
          packageDepthCm: 15,
        })
      ).rejects.toThrow(/Acesso não autorizado/);
    });
  });

  describe("Regra P-006: Peso e dimensões de embalagem obrigatórios para frete", () => {
    it("deve recusar cadastro de produto com peso ou dimensões zerados/ausentes", async () => {
      vi.spyOn(auth, "requireAdmin").mockResolvedValue({
        id: "admin_test",
        name: "Admin",
        email: "admin@markah.com.br",
        role: "ADMIN",
      });

      const resMissingWeight = await saveProductAction({
        name: "Peça Sem Peso",
        slug: "peca-sem-peso",
        description: "Teste",
        categorySlug: "vasos",
        material: "PLA",
        isSustainable: true,
        productionDays: 3,
        dimensions: "10 × 10 × 10 cm",
        weightGrams: 0, // Inválido
        priceCents: 10000,
        packageHeightCm: 15,
        packageWidthCm: 15,
        packageDepthCm: 15,
      });

      expect(resMissingWeight.success).toBe(false);
      expect(resMissingWeight.error).toContain("Peso em gramas é obrigatório");

      const resMissingDims = await saveProductAction({
        name: "Peça Sem Dimensões",
        slug: "peca-sem-dimensoes",
        description: "Teste",
        categorySlug: "vasos",
        material: "PLA",
        isSustainable: true,
        productionDays: 3,
        dimensions: "10 × 10 × 10 cm",
        weightGrams: 200,
        priceCents: 10000,
        packageHeightCm: 0, // Inválido
        packageWidthCm: 15,
        packageDepthCm: 15,
      });

      expect(resMissingDims.success).toBe(false);
      expect(resMissingDims.error).toContain("Dimensões da embalagem");
    });
  });

  describe("Duplicação e gerenciamento de peças", () => {
    it(
      "deve permitir a duplicação de um produto existente gerando novo SKU e slug",
      async () => {
        vi.spyOn(auth, "requireAdmin").mockResolvedValue({
          id: "admin_test",
          name: "Admin",
          email: "admin@markah.com.br",
          role: "ADMIN",
        });

        const res = await duplicateProductAction("prod_saturno");
        expect(res.success).toBe(true);
        expect(res.product?.name).toContain("(Cópia)");
        expect(res.product?.slug).toContain("copia");
      },
      15000
    );

    it(
      "deve excluir um produto com sucesso e remover do catálogo",
      async () => {
        vi.spyOn(auth, "requireAdmin").mockResolvedValue({
          id: "admin_test",
          name: "Admin",
          email: "admin@markah.com.br",
          role: "ADMIN",
        });

        const created = await saveProductAction({
          name: "Peça Teste Exclusão",
          slug: "peca-teste-exclusao",
          description: "Teste",
          categorySlug: "vasos",
          material: "PLA",
          isSustainable: true,
          productionDays: 3,
          dimensions: "10 × 10 × 10 cm",
          weightGrams: 200,
          priceCents: 10000,
          packageHeightCm: 15,
          packageWidthCm: 15,
          packageDepthCm: 15,
        });

        expect(created.success).toBe(true);

        const deleteRes = await deleteProductAction(created.product!.id);
        expect(deleteRes.success).toBe(true);
      },
      15000
    );
  });
});
