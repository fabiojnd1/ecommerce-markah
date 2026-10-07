"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, getCustomerUser } from "@/lib/auth";
import { listOrdersByCustomerEmail } from "@/lib/orders-repository";
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
  type ReviewRecord,
  type GalleryPostRecord,
  type ProductRatingStats,
} from "@/lib/social-proof-repository";

export interface SubmitReviewInput {
  productSlug: string;
  productName: string;
  productId?: string;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1 a 5
  title?: string;
  comment: string;
}

/**
 * Compra verificada: o cliente está logado (link mágico) e tem pedido pago
 * contendo o produto. O e-mail digitado no formulário não é usado para isso,
 * pois qualquer pessoa poderia digitar o e-mail de outra.
 */
async function isVerifiedBuyer(productSlug: string): Promise<boolean> {
  try {
    const user = await getCustomerUser();
    if (!user) return false;
    const orders = await listOrdersByCustomerEmail(user.email);
    const paidStatuses = ["PAGO", "EM_PRODUCAO", "PRONTO_PARA_ENVIO", "ENVIADO", "ENTREGUE"];
    return orders.some(
      (o) =>
        paidStatuses.includes(o.status) &&
        (o.items || []).some((item) => item.productSlug === productSlug)
    );
  } catch {
    return false;
  }
}

/**
 * Server Action: Submissão de avaliação por um cliente na PDP.
 * Validações de tamanho e pontuação.
 */
export async function submitProductReviewAction(data: SubmitReviewInput): Promise<{
  success: boolean;
  review?: ReviewRecord;
  error?: string;
  message?: string;
}> {
  try {
    if (!data.productSlug || !data.productName) {
      return { success: false, error: "Identificação do produto ausente." };
    }

    const trimmedName = data.customerName?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: "Por favor, informe seu nome (mínimo de 2 caracteres)." };
    }

    const rating = Math.round(Number(data.rating));
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return { success: false, error: "A nota deve ser entre 1 e 5 estrelas." };
    }

    const trimmedComment = data.comment?.trim();
    if (!trimmedComment || trimmedComment.length < 8) {
      return { success: false, error: "Por favor, escreva um comentário de pelo menos 8 caracteres sobre o produto." };
    }

    const review = await createReview({
      productId: data.productId || `prod_${data.productSlug}`,
      productName: data.productName,
      productSlug: data.productSlug,
      customerName: trimmedName,
      customerEmail: data.customerEmail?.trim(),
      rating,
      title: data.title?.trim(),
      comment: trimmedComment,
      verifiedPurchase: await isVerifiedBuyer(data.productSlug),
      // PRD §7.3: publicação somente após aprovação do admin
      status: "PENDING",
    });

    revalidatePath(`/produtos/${data.productSlug}`);

    return {
      success: true,
      review,
      message: "Obrigado! Sua avaliação foi recebida e aparecerá aqui depois de revisada pela nossa equipe.",
    };
  } catch (err: unknown) {
    console.error("[avaliações] Erro ao salvar avaliação", err);
    return { success: false, error: "Não foi possível enviar sua avaliação agora. Tente novamente." };
  }
}

/**
 * Server Action: Obter avaliações e estatísticas para a PDP.
 */
export async function getProductReviewsAction(productSlug: string): Promise<{
  success: boolean;
  reviews: ReviewRecord[];
  stats: ProductRatingStats;
  error?: string;
}> {
  try {
    const reviews = await listProductReviews(productSlug);
    const stats = await getProductRatingStats(productSlug);
    return { success: true, reviews, stats };
  } catch {
    return {
      success: false,
      reviews: [],
      stats: {
        average: 5.0,
        totalReviews: 0,
        recommendationPercentage: 100,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      error: "Erro ao carregar avaliações.",
    };
  }
}

/**
 * Server Action: Listar avaliações no painel administrativo.
 * Regra P-007: Exige requireAdmin().
 */
export async function getAdminReviewsAction(status?: "PENDING" | "APPROVED" | "REJECTED"): Promise<{
  success: boolean;
  reviews?: ReviewRecord[];
  error?: string;
}> {
  await requireAdmin();

  try {
    const reviews = await listAllReviews(status);
    return { success: true, reviews };
  } catch {
    return { success: false, error: "Erro ao buscar avaliações." };
  }
}

/**
 * Server Action: Atualizar status de moderação de uma avaliação.
 * Regra P-007: Exige requireAdmin().
 */
export async function updateReviewStatusAction(
  reviewId: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
): Promise<{
  success: boolean;
  review?: ReviewRecord;
  error?: string;
}> {
  await requireAdmin();

  try {
    const updated = await updateReviewStatus(reviewId, status);
    if (!updated) {
      return { success: false, error: "Avaliação não encontrada." };
    }
    revalidatePath(`/produtos/${updated.productSlug}`);
    revalidatePath("/admin/avaliacoes");
    return { success: true, review: updated };
  } catch {
    return { success: false, error: "Erro ao atualizar status da avaliação." };
  }
}

/**
 * Server Action: Excluir uma avaliação.
 * Regra P-007: Exige requireAdmin().
 */
export async function deleteReviewAction(reviewId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireAdmin();

  try {
    const deleted = await deleteReview(reviewId);
    if (!deleted) {
      return { success: false, error: "Avaliação não encontrada." };
    }
    revalidatePath("/admin/avaliacoes");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao excluir avaliação." };
  }
}

/**
 * Server Action: Listar fotos da galeria de clientes (público).
 */
export async function getGalleryPostsAction(approvedOnly = true): Promise<{
  success: boolean;
  posts: GalleryPostRecord[];
  error?: string;
}> {
  try {
    const posts = await listGalleryPosts(approvedOnly);
    return { success: true, posts };
  } catch {
    return { success: false, posts: [], error: "Erro ao carregar fotos de clientes." };
  }
}

/**
 * Server Action: Salvar ou editar post da galeria de clientes.
 * Regra P-007: Exige requireAdmin().
 */
export async function saveGalleryPostAction(data: {
  id?: string;
  customerInstagram?: string;
  customerName: string;
  imageUrl: string;
  productSlug?: string;
  productName?: string;
  caption?: string;
  approved?: boolean;
  displayOrder?: number;
}): Promise<{
  success: boolean;
  post?: GalleryPostRecord;
  error?: string;
}> {
  await requireAdmin();

  try {
    const post = await saveGalleryPost(data);
    revalidatePath("/");
    return { success: true, post };
  } catch {
    return { success: false, error: "Erro ao salvar post da galeria." };
  }
}

/**
 * Server Action: Excluir post da galeria.
 * Regra P-007: Exige requireAdmin().
 */
export async function deleteGalleryPostAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireAdmin();

  try {
    const deleted = await deleteGalleryPost(id);
    revalidatePath("/");
    return { success: deleted };
  } catch {
    return { success: false, error: "Erro ao excluir post da galeria." };
  }
}
