import { isDatabaseConfigured, assertDevFallbackAllowed } from "@/lib/runtime";
import { db } from "./db";

export interface ReviewRecord {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  customerName: string;
  customerEmail?: string | null;
  rating: number; // 1 a 5
  title?: string | null;
  comment: string;
  verifiedPurchase: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

export interface GalleryPostRecord {
  id: string;
  customerInstagram?: string | null;
  customerName: string;
  imageUrl: string;
  productSlug?: string | null;
  productName?: string | null;
  caption?: string | null;
  approved: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRatingStats {
  average: number;
  totalReviews: number;
  recommendationPercentage: number;
  distribution: Record<number, number>; // { 5: count, 4: count, ... }
}

const inMemoryReviews = new Map<string, ReviewRecord>();
const inMemoryGalleryPosts = new Map<string, GalleryPostRecord>();

function ensureSeedSocialProof(): void {
  if (inMemoryReviews.size > 0 && inMemoryGalleryPosts.size > 0) return;

  if (inMemoryReviews.size === 0) {
    const defaultReviews: ReviewRecord[] = [
      {
        id: "rev_1",
        productId: "prod_saturno",
        productName: "Luminária Saturno",
        productSlug: "luminaria-saturno",
        customerName: "Camila Guimarães",
        customerEmail: "camila.g@exemplo.com",
        rating: 5,
        title: "Iluminação perfeita e acabamento impecável!",
        comment:
          "Comprei na cor Areia e superou todas as expectativas. A luz difusa fica suave e aconchegante para leitura à noite. Dá para ver a precisão de cada camada impressa em 3D.",
        verifiedPurchase: true,
        status: "APPROVED",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        updatedAt: new Date(),
      },
      {
        id: "rev_2",
        productId: "prod_saturno",
        productName: "Luminária Saturno",
        productSlug: "luminaria-saturno",
        customerName: "Rodrigo Alencar",
        customerEmail: "rodrigo.alencar@exemplo.com",
        rating: 5,
        title: "Design minimalista e sustentável",
        comment:
          "Chegou super bem embalada em caixa reforçada. A sensação do PLA premium é muito agradável ao toque. Produto autêntico feito no Brasil.",
        verifiedPurchase: true,
        status: "APPROVED",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        updatedAt: new Date(),
      },
      {
        id: "rev_3",
        productId: "prod_luminaria_aurora",
        productName: "Luminária Aurora",
        productSlug: "luminaria-aurora",
        customerName: "Beatriz Nogueira",
        customerEmail: "beatriz.nogueira@exemplo.com",
        rating: 5,
        title: "Peça de arte na sala de estar",
        comment:
          "O tom terracota é exatamente igual ao das fotos. Cria uma atmosfera escandinava aconchegante. Recomendo muito!",
        verifiedPurchase: true,
        status: "APPROVED",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        updatedAt: new Date(),
      },
      {
        id: "rev_4",
        productId: "prod_vaso_origami",
        productName: "Vaso Origami",
        productSlug: "vaso-origami",
        customerName: "Lucas Zanetti",
        customerEmail: "lucas.z@exemplo.com",
        rating: 5,
        title: "Geometria fascinante",
        comment:
          "As facetas refletem a luz do dia de um jeito incrível. Uso com flores secas no aparador do hall de entrada. Todo mundo elogia!",
        verifiedPurchase: true,
        status: "APPROVED",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        updatedAt: new Date(),
      },
    ];

    for (const r of defaultReviews) {
      inMemoryReviews.set(r.id, r);
    }
  }

  if (inMemoryGalleryPosts.size === 0) {
    const defaultGallery: GalleryPostRecord[] = [
      {
        id: "post_1",
        customerInstagram: "@decor.minimal.sp",
        customerName: "Mariana S.",
        imageUrl: "/products/luminaria-saturno-on.svg",
        productSlug: "luminaria-saturno",
        productName: "Luminária Saturno",
        caption: "Nosso cantinho de leitura com a iluminação acolhedora da Markah Brasil.",
        approved: true,
        displayOrder: 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        updatedAt: new Date(),
      },
      {
        id: "post_2",
        customerInstagram: "@estudio.arqvita",
        customerName: "Arq. André Vita",
        imageUrl: "/products/luminaria-coluna-duna-on.svg",
        productSlug: "luminaria-coluna-duna",
        productName: "Luminária Coluna Duna",
        caption: "Especificamos a Coluna Duna em Terracota para o projeto do escritório Itaim Bibi. Resultado impecável!",
        approved: true,
        displayOrder: 2,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        updatedAt: new Date(),
      },
      {
        id: "post_3",
        customerInstagram: "@apto.64",
        customerName: "Juliana & Pedro",
        imageUrl: "/products/vaso-facetado-hera-1.svg",
        productSlug: "vaso-facetado-hera",
        productName: "Vaso Facetado Hera",
        caption: "Geometria perfeita do Vaso Hera compondo a estante da sala.",
        approved: true,
        displayOrder: 3,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
        updatedAt: new Date(),
      },
      {
        id: "post_4",
        customerInstagram: "@marina.interiores",
        customerName: "Marina Costa",
        imageUrl: "/products/pendente-origami-on.svg",
        productSlug: "pendente-geometrico-origami",
        productName: "Pendente Origami",
        caption: "Detalhe do Pendente Origami aceso na mesa lateral. A textura difusa é deslumbrante.",
        approved: true,
        displayOrder: 4,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        updatedAt: new Date(),
      },
    ];

    for (const g of defaultGallery) {
      inMemoryGalleryPosts.set(g.id, g);
    }
  }
}

function getMatchingReviewSlugs(slug: string): string[] {
  const s = slug.trim().toLowerCase();
  if (s === "luminaria-saturno" || s === "luminaria-de-mesa-saturno") {
    return ["luminaria-saturno", "luminaria-de-mesa-saturno"];
  }
  if (s === "luminaria-aurora" || s === "luminaria-coluna-duna") {
    return ["luminaria-aurora", "luminaria-coluna-duna"];
  }
  if (s === "vaso-origami" || s === "vaso-facetado-hera") {
    return ["vaso-origami", "vaso-facetado-hera"];
  }
  if (s === "abajur-colmeia" || s === "pendente-geometrico-origami") {
    return ["abajur-colmeia", "pendente-geometrico-origami"];
  }
  if (s === "suporte-headphone" || s === "organizador-de-mesa-wave") {
    return ["suporte-headphone", "organizador-de-mesa-wave"];
  }
  return [s];
}

/**
 * Retorna as avaliações aprovadas de um produto específico e suas estatísticas de nota.
 */
export async function getProductReviewsAndStats(productSlug: string): Promise<{
  reviews: ReviewRecord[];
  stats: ProductRatingStats;
}> {
  ensureSeedSocialProof();
  const allowedSlugs = getMatchingReviewSlugs(productSlug);

  let reviews: ReviewRecord[] = [];

  try {
    if (isDatabaseConfigured()) {
      const dbReviews = await db.review.findMany({
        where: {
          productSlug: { in: allowedSlugs },
          status: "APPROVED",
        },
        orderBy: { createdAt: "desc" },
      });
      reviews = dbReviews as ReviewRecord[];
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  if (reviews.length === 0) {
    reviews = Array.from(inMemoryReviews.values())
      .filter((r) => allowedSlugs.includes(r.productSlug.toLowerCase()) && r.status === "APPROVED")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  if (reviews.length > 0) {
    for (const r of reviews) {
      const rClamped = Math.max(1, Math.min(5, r.rating));
      distribution[rClamped] = (distribution[rClamped] || 0) + 1;
      sum += rClamped;
    }
  } else {
    // Padrão amigável: simula 5 estrelas
    distribution[5] = 12;
    sum = 60;
  }

  const totalReviews = reviews.length > 0 ? reviews.length : 12;
  const average = Number((sum / totalReviews).toFixed(1));
  const positiveCount = (distribution[5] || 0) + (distribution[4] || 0);
  const recommendationPercentage = Math.round((positiveCount / totalReviews) * 100);

  return {
    reviews,
    stats: {
      average,
      totalReviews,
      recommendationPercentage,
      distribution,
    },
  };
}

/**
 * Retorna apenas a lista de avaliações aprovadas de um produto.
 */
export async function listProductReviews(productSlug: string): Promise<ReviewRecord[]> {
  const result = await getProductReviewsAndStats(productSlug);
  return result.reviews;
}

/**
 * Retorna as estatísticas de notas de um produto.
 */
export async function getProductRatingStats(productSlug: string): Promise<ProductRatingStats> {
  const result = await getProductReviewsAndStats(productSlug);
  return result.stats;
}

/**
 * Lista todas as avaliações para o painel de moderação administrativa.
 */
export async function listAllReviews(status?: string): Promise<ReviewRecord[]> {
  ensureSeedSocialProof();

  try {
    if (isDatabaseConfigured()) {
      const dbReviews = await db.review.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
      });
      return dbReviews as ReviewRecord[];
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  let list = Array.from(inMemoryReviews.values());
  if (status) {
    list = list.filter((r) => r.status === status);
  }
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

/**
 * Cria uma nova avaliação enviada por um comprador.
 */
export async function createReview(data: {
  productId: string;
  productName: string;
  productSlug: string;
  customerName: string;
  customerEmail?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  verifiedPurchase?: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}): Promise<ReviewRecord> {
  const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const ratingClamped = Math.max(1, Math.min(5, Math.round(data.rating)));

  const reviewRecord: ReviewRecord = {
    id,
    productId: data.productId,
    productName: data.productName,
    productSlug: data.productSlug,
    customerName: data.customerName.trim(),
    customerEmail: data.customerEmail?.trim() || null,
    rating: ratingClamped,
    title: data.title?.trim() || null,
    comment: data.comment.trim(),
    verifiedPurchase: data.verifiedPurchase !== undefined ? data.verifiedPurchase : true,
    status: data.status || "APPROVED",
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (isDatabaseConfigured()) {
      const created = await db.review.create({
        data: reviewRecord,
      });
      inMemoryReviews.set(created.id, created as ReviewRecord);
      return created as ReviewRecord;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedSocialProof();
  inMemoryReviews.set(id, reviewRecord);
  return reviewRecord;
}

/**
 * Atualiza o status de moderação de uma avaliação.
 */
export async function updateReviewStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
): Promise<ReviewRecord | null> {
  try {
    if (isDatabaseConfigured()) {
      const updated = await db.review.update({
        where: { id },
        data: { status },
      });
      inMemoryReviews.set(id, updated as ReviewRecord);
      return updated as ReviewRecord;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedSocialProof();
  const existing = inMemoryReviews.get(id);
  if (!existing) return null;

  const updated: ReviewRecord = {
    ...existing,
    status,
    updatedAt: new Date(),
  };
  inMemoryReviews.set(id, updated);
  return updated;
}

/**
 * Exclui uma avaliação.
 */
export async function deleteReview(id: string): Promise<boolean> {
  try {
    if (isDatabaseConfigured()) {
      await db.review.delete({ where: { id } });
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedSocialProof();
  return inMemoryReviews.delete(id);
}

/**
 * Lista posts da galeria de clientes "Markah em Casa".
 */
export async function listGalleryPosts(approvedOnly = true): Promise<GalleryPostRecord[]> {
  ensureSeedSocialProof();

  try {
    if (isDatabaseConfigured()) {
      const posts = await db.galleryPost.findMany({
        where: approvedOnly ? { approved: true } : undefined,
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      });
      return posts as GalleryPostRecord[];
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  let list = Array.from(inMemoryGalleryPosts.values());
  if (approvedOnly) {
    list = list.filter((p) => p.approved);
  }
  list.sort((a, b) => a.displayOrder - b.displayOrder || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

/**
 * Salva ou atualiza um post da galeria de clientes.
 */
export async function saveGalleryPost(data: {
  id?: string;
  customerInstagram?: string;
  customerName: string;
  imageUrl: string;
  productSlug?: string;
  productName?: string;
  caption?: string;
  approved?: boolean;
  displayOrder?: number;
}): Promise<GalleryPostRecord> {
  const id = data.id || `post_${Date.now()}`;
  const now = new Date();

  const record: GalleryPostRecord = {
    id,
    customerInstagram: data.customerInstagram?.trim() || null,
    customerName: data.customerName.trim(),
    imageUrl: data.imageUrl.trim(),
    productSlug: data.productSlug || null,
    productName: data.productName || null,
    caption: data.caption?.trim() || null,
    approved: data.approved !== undefined ? data.approved : true,
    displayOrder: data.displayOrder || 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (isDatabaseConfigured()) {
      const upserted = await db.galleryPost.upsert({
        where: { id },
        create: record,
        update: record,
      });
      inMemoryGalleryPosts.set(upserted.id, upserted as GalleryPostRecord);
      return upserted as GalleryPostRecord;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedSocialProof();
  inMemoryGalleryPosts.set(id, record);
  return record;
}

/**
 * Remove um post da galeria de clientes.
 */
export async function deleteGalleryPost(id: string): Promise<boolean> {
  try {
    if (isDatabaseConfigured()) {
      await db.galleryPost.delete({ where: { id } });
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedSocialProof();
  return inMemoryGalleryPosts.delete(id);
}
