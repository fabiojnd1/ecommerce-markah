import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/auth";
import {
  listProductReviews,
  getProductRatingStats,
  listAllReviews,
  createReview,
  updateReviewStatus,
  deleteReview,
  listGalleryPosts,
  saveGalleryPost,
  deleteGalleryPost,
} from "@/lib/social-proof-repository";
import {
  submitProductReviewAction,
  getProductReviewsAction,
  getAdminReviewsAction,
  updateReviewStatusAction,
  deleteReviewAction,
  saveGalleryPostAction,
  deleteGalleryPostAction,
} from "@/server/social-proof-actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Fase 7 — Prova Social, Avaliações e Favoritos (v0.8.0)", () => {
  const mockAdminUser = {
    id: "admin_test",
    name: "Admin Markah",
    email: "admin@markah.com.br",
    role: "ADMIN" as const,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Regra P-007: Proteção obrigatória no servidor para moderação de avaliações", () => {
    it("deve rejeitar busca de avaliações administrativas sem autenticação de administrador", async () => {
      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(getAdminReviewsAction()).rejects.toThrow(/Acesso não autorizado/);
    });

    it("deve rejeitar atualização de status ou exclusão de avaliação sem administrador", async () => {
      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(
        updateReviewStatusAction("rev_1", "REJECTED")
      ).rejects.toThrow(/Acesso não autorizado/);

      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(deleteReviewAction("rev_1")).rejects.toThrow(/Acesso não autorizado/);
    });

    it("deve rejeitar gestão da galeria de clientes sem permissão de administrador", async () => {
      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(
        saveGalleryPostAction({
          customerName: "Tentativa Invasora",
          imageUrl: "https://example.com/foto.jpg",
        })
      ).rejects.toThrow(/Acesso não autorizado/);

      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(deleteGalleryPostAction("post_1")).rejects.toThrow(/Acesso não autorizado/);
    });
  });

  describe("Submissão e Validação de Avaliações (PDP)", () => {
    it("deve rejeitar avaliação com nome de cliente muito curto", async () => {
      const res = await submitProductReviewAction({
        productSlug: "luminaria-saturno",
        productName: "Luminária Saturno",
        customerName: "A",
        rating: 5,
        comment: "Excelente acabamento e iluminação!",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/mínimo de 2 caracteres/i);
    });

    it("deve rejeitar nota fora do intervalo de 1 a 5 estrelas", async () => {
      const res = await submitProductReviewAction({
        productSlug: "luminaria-saturno",
        productName: "Luminária Saturno",
        customerName: "Carlos Pereira",
        rating: 6,
        comment: "Excelente acabamento e iluminação!",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/entre 1 e 5 estrelas/i);
    });

    it("deve rejeitar comentário com menos de 8 caracteres", async () => {
      const res = await submitProductReviewAction({
        productSlug: "luminaria-saturno",
        productName: "Luminária Saturno",
        customerName: "Carlos Pereira",
        rating: 5,
        comment: "Curto",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/pelo menos 8 caracteres/i);
    });

    it("deve aceitar e persistir uma avaliação válida com sucesso", async () => {
      const res = await submitProductReviewAction({
        productSlug: "luminaria-saturno",
        productName: "Luminária Saturno",
        customerName: "Carlos Roberto",
        customerEmail: "carlos@exemplo.com",
        rating: 5,
        title: "Superou as expectativas",
        comment: "A textura da impressão 3D é fantástica, luz muito agradável.",
      });

      expect(res.success).toBe(true);
      expect(res.review).toBeDefined();
      expect(res.review?.customerName).toBe("Carlos Roberto");
      expect(res.review?.rating).toBe(5);
    });
  });

  describe("Cálculo de Estatísticas e Listagem de Avaliações", () => {
    it("deve calcular média, total e distribuição de estrelas corretamente", async () => {
      const stats = await getProductRatingStats("luminaria-saturno");

      expect(stats.totalReviews).toBeGreaterThanOrEqual(1);
      expect(stats.average).toBeGreaterThanOrEqual(1);
      expect(stats.average).toBeLessThanOrEqual(5);
      expect(stats.distribution[5]).toBeGreaterThanOrEqual(1);
      expect(stats.recommendationPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.recommendationPercentage).toBeLessThanOrEqual(100);
    });

    it("deve listar avaliações aprovadas do produto", async () => {
      const reviews = await listProductReviews("luminaria-saturno");
      expect(reviews.length).toBeGreaterThanOrEqual(1);
      expect(reviews.every((r) => r.status === "APPROVED")).toBe(true);
      expect(reviews.every((r) => r.productSlug === "luminaria-saturno")).toBe(true);
    });

    it("deve retornar ação pública getProductReviewsAction com dados coerentes", async () => {
      const res = await getProductReviewsAction("luminaria-saturno");
      expect(res.success).toBe(true);
      expect(res.reviews.length).toBeGreaterThanOrEqual(1);
      expect(res.stats.totalReviews).toBe(res.reviews.length);
    });
  });

  describe("Moderação Administrativa de Avaliações", () => {
    it("deve permitir que o administrador altere o status de uma avaliação", async () => {
      vi.spyOn(auth, "requireAdmin").mockResolvedValue(mockAdminUser);

      // Cria uma avaliação teste
      const created = await createReview({
        productId: "prod_test",
        productName: "Produto Teste",
        productSlug: "produto-teste-mod",
        customerName: "Moderado Teste",
        rating: 4,
        comment: "Teste de moderação para aprovar e rejeitar.",
        verifiedPurchase: false,
        status: "PENDING",
      });

      expect(created.status).toBe("PENDING");

      // Atualiza para REJECTED
      const updatedReject = await updateReviewStatusAction(created.id, "REJECTED");
      expect(updatedReject.success).toBe(true);
      expect(updatedReject.review?.status).toBe("REJECTED");

      // Atualiza para APPROVED
      const updatedApprove = await updateReviewStatusAction(created.id, "APPROVED");
      expect(updatedApprove.success).toBe(true);
      expect(updatedApprove.review?.status).toBe("APPROVED");

      // Exclui
      const deleted = await deleteReviewAction(created.id);
      expect(deleted.success).toBe(true);
    });
  });

  describe("Galeria de Clientes (Markah em Casa)", () => {
    it("deve listar fotos públicas da galeria com aprovação ativa", async () => {
      const posts = await listGalleryPosts(true);
      expect(posts.length).toBeGreaterThanOrEqual(1);
      expect(posts.every((p) => p.approved)).toBe(true);

      const saturnoPost = posts.find((p) => p.productSlug === "luminaria-saturno");
      expect(saturnoPost).toBeDefined();
      expect(saturnoPost?.customerInstagram).toContain("@");
    });

    it("deve permitir que o administrador salve e remova post da galeria", async () => {
      vi.spyOn(auth, "requireAdmin").mockResolvedValue(mockAdminUser);

      const saved = await saveGalleryPostAction({
        customerName: "Arquiteta Fernanda",
        customerInstagram: "@arq.fernanda",
        imageUrl: "/products/pendente-colmeia-1.jpg",
        productSlug: "pendente-colmeia",
        productName: "Pendente Colmeia",
        caption: "Iluminação geométrica na sala de jantar!",
        approved: true,
      });

      expect(saved.success).toBe(true);
      expect(saved.post?.customerName).toBe("Arquiteta Fernanda");

      if (saved.post?.id) {
        const deleted = await deleteGalleryPostAction(saved.post.id);
        expect(deleted.success).toBe(true);
      }
    });
  });
});
