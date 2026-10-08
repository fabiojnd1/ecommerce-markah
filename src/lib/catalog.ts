import { isDatabaseConfigured, assertDevFallbackAllowed, isTestEnvironment } from "@/lib/runtime";
import {
  SEED_CATEGORIES,
  SEED_COLLECTIONS,
  SEED_PRODUCTS,
  type SeedCategory,
  type SeedProduct,
  type SeedVariant,
} from "./data/catalog-seed";
import { db } from "./db";

export interface ProductFilterParams {
  categorySlug?: string;
  collectionSlug?: string;
  search?: string;
  material?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  sortBy?: "relevance" | "price-asc" | "price-desc" | "newest";
  limit?: number;
  includeInactive?: boolean;
}

/**
 * Retorna todas as categorias ativas ordenadas por displayOrder.
 */
export async function getCategories(): Promise<SeedCategory[]> {
  try {
    if (isDatabaseConfigured()) {
      const dbCategories = await db.category.findMany({
        where: { active: true },
        orderBy: { displayOrder: "asc" },
      });
      return dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        displayOrder: c.displayOrder,
        imageUrl: c.imageUrl || undefined,
      }));
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback silencioso para dados em memória (somente em desenvolvimento)
  }

  return SEED_CATEGORIES.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Retorna uma categoria específica pelo slug.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<SeedCategory | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) || null;
}

/**
 * Retorna as coleções cadastradas.
 */
export async function getFeaturedCollections() {
  return SEED_COLLECTIONS;
}

/**
 * Consulta de produtos com filtros de busca, categoria, material e ordenação.
 */
export async function getProducts(
  filters: ProductFilterParams = {}
): Promise<SeedProduct[]> {
  let products: SeedProduct[] = [];
  let loadedFromDb = false;

  try {
    if (isDatabaseConfigured()) {
      const dbProducts = await db.product.findMany({
        where: {
          ...(filters.includeInactive ? { status: { not: "ARCHIVED" } } : { status: "ACTIVE" }),
          ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
        },
        include: {
          category: true,
          collections: { include: { collection: true } },
          images: { orderBy: { displayOrder: "asc" } },
          options: {
            orderBy: { displayOrder: "asc" },
            include: { values: { orderBy: { displayOrder: "asc" } } },
          },
          variants: {
            ...(filters.includeInactive ? {} : { where: { active: true } }),
            include: { optionValues: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      products = dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        categorySlug: p.category.slug,
        collectionSlugs: p.collections.map((c) => c.collection.slug),
        material: p.material as "PLA" | "PETG",
        isSustainable: p.isSustainable,
        productionDays: p.productionDays,
        dimensions: p.dimensions || "",
        weightGrams: p.weightGrams || 350,
        socketType: p.socketType || undefined,
        maxWattage: p.maxWattage || undefined,
        bulbIncluded: p.bulbIncluded,
        cordLengthCm: p.cordLengthCm || undefined,
        waterproof: p.waterproof,
        tags: [],
        images: p.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          displayOrder: img.displayOrder,
          isPrimary: img.isPrimary,
          isHover: img.isHover,
        })),
        options: p.options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          values: opt.values.map((val) => ({
            id: val.id,
            name: val.name,
            colorHex: val.colorHex || undefined,
          })),
        })),
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          priceCents: v.priceCents,
          compareAtPriceCents: v.compareAtPriceCents,
          weightGrams: v.weightGrams,
          packageHeightCm: v.packageHeightCm,
          packageWidthCm: v.packageWidthCm,
          packageDepthCm: v.packageDepthCm,
          active: v.active,
          selectedOptionValueIds: v.optionValues.map((ov) => ov.optionValueId),
        })),
      }));
      loadedFromDb = true;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
  }

  if (!loadedFromDb) {
    products = [...SEED_PRODUCTS];
  }

  // 1. Filtro por Categoria
  if (filters.categorySlug) {
    products = products.filter((p) => p.categorySlug === filters.categorySlug);
  }

  // 2. Filtro por Coleção
  if (filters.collectionSlug) {
    products = products.filter((p) =>
      p.collectionSlugs.includes(filters.collectionSlug!)
    );
  }

  // 3. Filtro por Busca (nome ou descrição)
  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.toLowerCase().trim();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categorySlug.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  // 4. Filtro por Material (PLA / PETG)
  if (filters.material) {
    products = products.filter((p) => p.material === filters.material);
  }

  // 5. Filtro por Faixa de Preço (baseado na menor variação)
  if (filters.minPriceCents !== undefined) {
    products = products.filter((p) => {
      const minVariantPrice = Math.min(...p.variants.map((v) => v.priceCents));
      return minVariantPrice >= filters.minPriceCents!;
    });
  }

  if (filters.maxPriceCents !== undefined) {
    products = products.filter((p) => {
      const minVariantPrice = Math.min(...p.variants.map((v) => v.priceCents));
      return minVariantPrice <= filters.maxPriceCents!;
    });
  }

  // 6. Ordenação
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case "price-asc":
        products.sort((a, b) => {
          const aPrice = Math.min(...a.variants.map((v) => v.priceCents));
          const bPrice = Math.min(...b.variants.map((v) => v.priceCents));
          return aPrice - bPrice;
        });
        break;
      case "price-desc":
        products.sort((a, b) => {
          const aPrice = Math.min(...a.variants.map((v) => v.priceCents));
          const bPrice = Math.min(...b.variants.map((v) => v.priceCents));
          return bPrice - aPrice;
        });
        break;
      case "newest":
        products.sort((a, b) => {
          const aIsNew = a.collectionSlugs.includes("lancamentos") ? 1 : 0;
          const bIsNew = b.collectionSlugs.includes("lancamentos") ? 1 : 0;
          return bIsNew - aIsNew;
        });
        break;
      case "relevance":
      default:
        break;
    }
  }

  // 7. Limite
  if (filters.limit && filters.limit > 0) {
    products = products.slice(0, filters.limit);
  }

  return products;
}

/**
 * Retorna um produto detalhado pelo slug.
 */
export async function getProductBySlug(
  slug: string
): Promise<SeedProduct | null> {
  const normalized = slug.trim().toLowerCase();

  try {
    if (isDatabaseConfigured()) {
      const p = await db.product.findFirst({
        where: {
          OR: [
            { slug: normalized },
            ...(normalized === "luminaria-saturno"
              ? [{ slug: "luminaria-de-mesa-saturno" }]
              : []),
            ...(normalized === "luminaria-aurora"
              ? [{ slug: "luminaria-coluna-duna" }]
              : []),
          ],
        },
        include: {
          category: true,
          images: { orderBy: { displayOrder: "asc" } },
          options: {
            orderBy: { displayOrder: "asc" },
            include: { values: { orderBy: { displayOrder: "asc" } } },
          },
          variants: {
            include: { optionValues: true },
          },
        },
      });

      if (p) {
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          categorySlug: p.category.slug,
          collectionSlugs: [],
          material: p.material as "PLA" | "PETG",
          isSustainable: p.isSustainable,
          productionDays: p.productionDays,
          dimensions: p.dimensions || "",
          weightGrams: p.weightGrams || 350,
          socketType: p.socketType || undefined,
          maxWattage: p.maxWattage || undefined,
          bulbIncluded: p.bulbIncluded,
          cordLengthCm: p.cordLengthCm || undefined,
          waterproof: p.waterproof,
          images: p.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            isHover: img.isHover,
          })),
          options: p.options.map((opt) => ({
            id: opt.id,
            name: opt.name,
            values: opt.values.map((val) => ({
              id: val.id,
              name: val.name,
              colorHex: val.colorHex || undefined,
            })),
          })),
          variants: p.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            priceCents: v.priceCents,
            compareAtPriceCents: v.compareAtPriceCents,
            weightGrams: v.weightGrams,
            packageHeightCm: v.packageHeightCm,
            packageWidthCm: v.packageWidthCm,
            packageDepthCm: v.packageDepthCm,
            active: v.active,
            selectedOptionValueIds: v.optionValues.map((ov) => ov.optionValueId),
          })),
        };
      }
      if (!isTestEnvironment()) {
        return null;
      }
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
  }

  const product = SEED_PRODUCTS.find(
    (p) =>
      p.slug === normalized ||
      (normalized === "luminaria-saturno" && p.slug === "luminaria-de-mesa-saturno") ||
      (normalized === "luminaria-aurora" && p.slug === "luminaria-coluna-duna") ||
      (normalized === "vaso-origami" && p.slug === "vaso-facetado-hera") ||
      (normalized === "abajur-colmeia" && p.slug === "pendente-geometrico-origami") ||
      (normalized === "suporte-headphone" && p.slug === "organizador-de-mesa-wave")
  );
  return product || null;
}

/**
 * Retorna um produto detalhado pelo ID ou Slug (para admin ou rotas diretas).
 */
export async function getProductById(
  idOrSlug: string,
  includeInactive = true
): Promise<SeedProduct | null> {
  const normalized = idOrSlug.trim();

  try {
    if (isDatabaseConfigured()) {
      const p = await db.product.findFirst({
        where: {
          OR: [{ id: normalized }, { slug: normalized.toLowerCase() }],
          ...(includeInactive ? { status: { not: "ARCHIVED" } } : { status: "ACTIVE" }),
        },
        include: {
          category: true,
          collections: { include: { collection: true } },
          images: { orderBy: { displayOrder: "asc" } },
          options: {
            orderBy: { displayOrder: "asc" },
            include: { values: { orderBy: { displayOrder: "asc" } } },
          },
          variants: {
            ...(includeInactive ? {} : { where: { active: true } }),
            include: { optionValues: true },
          },
        },
      });

      if (p) {
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          categorySlug: p.category.slug,
          collectionSlugs: p.collections.map((c) => c.collection.slug),
          material: p.material as "PLA" | "PETG",
          isSustainable: p.isSustainable,
          productionDays: p.productionDays,
          dimensions: p.dimensions || "",
          weightGrams: p.weightGrams || 350,
          socketType: p.socketType || undefined,
          maxWattage: p.maxWattage || undefined,
          bulbIncluded: p.bulbIncluded,
          cordLengthCm: p.cordLengthCm || undefined,
          waterproof: p.waterproof,
          tags: [],
          images: p.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            displayOrder: img.displayOrder,
            isPrimary: img.isPrimary,
            isHover: img.isHover,
          })),
          options: p.options.map((opt) => ({
            id: opt.id,
            name: opt.name,
            values: opt.values.map((val) => ({
              id: val.id,
              name: val.name,
              colorHex: val.colorHex || undefined,
            })),
          })),
          variants: p.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            priceCents: v.priceCents,
            compareAtPriceCents: v.compareAtPriceCents,
            weightGrams: v.weightGrams,
            packageHeightCm: v.packageHeightCm,
            packageWidthCm: v.packageWidthCm,
            packageDepthCm: v.packageDepthCm,
            active: v.active,
            selectedOptionValueIds: v.optionValues.map((ov) => ov.optionValueId),
          })),
        };
      }
      if (!isTestEnvironment()) {
        return null;
      }
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
  }

  const found = SEED_PRODUCTS.find(
    (p) => p.id === normalized || p.slug === normalized.toLowerCase()
  );
  return found || null;
}

/**
 * Retorna produtos relacionados (mesma categoria ou em coleções similares).
 */
export async function getRelatedProducts(
  productId: string,
  limit = 4
): Promise<SeedProduct[]> {
  try {
    if (isDatabaseConfigured()) {
      const current = await db.product.findUnique({
        where: { id: productId },
        select: { categoryId: true },
      });
      if (current) {
        const related = await db.product.findMany({
          where: {
            id: { not: productId },
            status: "ACTIVE",
            categoryId: current.categoryId,
          },
          take: limit,
          include: {
            category: true,
            collections: { include: { collection: true } },
            images: { orderBy: { displayOrder: "asc" } },
            options: {
              orderBy: { displayOrder: "asc" },
              include: { values: { orderBy: { displayOrder: "asc" } } },
            },
            variants: {
              where: { active: true },
              include: { optionValues: true },
            },
          },
        });

        if (related.length > 0) {
          return related.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            categorySlug: p.category.slug,
            collectionSlugs: p.collections.map((c) => c.collection.slug),
            material: p.material as "PLA" | "PETG",
            isSustainable: p.isSustainable,
            productionDays: p.productionDays,
            dimensions: p.dimensions || "",
            weightGrams: p.weightGrams || 350,
            socketType: p.socketType || undefined,
            maxWattage: p.maxWattage || undefined,
            bulbIncluded: p.bulbIncluded,
            cordLengthCm: p.cordLengthCm || undefined,
            waterproof: p.waterproof,
            tags: [],
            images: p.images.map((img) => ({
              id: img.id,
              url: img.url,
              alt: img.alt,
              displayOrder: img.displayOrder,
              isPrimary: img.isPrimary,
              isHover: img.isHover,
            })),
            options: p.options.map((opt) => ({
              id: opt.id,
              name: opt.name,
              values: opt.values.map((val) => ({
                id: val.id,
                name: val.name,
                colorHex: val.colorHex || undefined,
              })),
            })),
            variants: p.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              priceCents: v.priceCents,
              compareAtPriceCents: v.compareAtPriceCents,
              weightGrams: v.weightGrams,
              packageHeightCm: v.packageHeightCm,
              packageWidthCm: v.packageWidthCm,
              packageDepthCm: v.packageDepthCm,
              active: v.active,
              selectedOptionValueIds: v.optionValues.map((ov) => ov.optionValueId),
            })),
          }));
        }
      }
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
  }

  const currentSeed = SEED_PRODUCTS.find((p) => p.id === productId);
  if (!currentSeed) return SEED_PRODUCTS.slice(0, limit);

  return SEED_PRODUCTS.filter((p) => p.id !== productId)
    .sort((a, b) => {
       const aScore = a.categorySlug === currentSeed.categorySlug ? 2 : 0;
       const bScore = b.categorySlug === currentSeed.categorySlug ? 2 : 0;
       return bScore - aScore;
     })
     .slice(0, limit);
}

/**
 * Formata o nome descritivo legível de uma variante (ex: no carrinho, checkout e pedidos).
 * Lida com peças bicolores (Base + Cúpula + Tamanho), cor única e variações simples.
 */
export function formatVariantDisplayName(
  product: SeedProduct,
  variant: SeedVariant
): string {
  if (!product || !variant || !product.options) {
    return "Padrão";
  }

  // Verifica se o produto tem opções de Base e Cúpula
  const baseOpt = product.options.find((o) =>
    o.name.toLowerCase().includes("base")
  );
  const cupulaOpt = product.options.find(
    (o) =>
      o.name.toLowerCase().includes("cúpula") ||
      o.name.toLowerCase().includes("cupula")
  );
  const tamanhoOpt = product.options.find((o) =>
    o.name.toLowerCase().includes("tamanho")
  );

  if (baseOpt && cupulaOpt) {
    const baseVal = baseOpt.values.find((v) =>
      variant.selectedOptionValueIds.includes(v.id)
    );
    const cupulaVal = cupulaOpt.values.find((v) =>
      variant.selectedOptionValueIds.includes(v.id)
    );
    const tamVal = tamanhoOpt?.values.find((v) =>
      variant.selectedOptionValueIds.includes(v.id)
    );

    const parts: string[] = [];
    if (baseVal && cupulaVal) {
      parts.push(`Base: ${baseVal.name} / Cúpula: ${cupulaVal.name}`);
    } else if (baseVal) {
      parts.push(`Base: ${baseVal.name}`);
    } else if (cupulaVal) {
      parts.push(`Cúpula: ${cupulaVal.name}`);
    }

    if (tamVal) {
      parts.push(tamVal.name);
    }

    if (parts.length > 0) {
      return parts.join(" · ");
    }
  }

  // Caso padrão / geral: concatena valores correspondentes
  const matchedValues: string[] = [];
  for (const option of product.options) {
    const matched = option.values.find((v) =>
      variant.selectedOptionValueIds.includes(v.id)
    );
    if (matched) {
      matchedValues.push(matched.name);
    }
  }

  return matchedValues.length > 0 ? matchedValues.join(" · ") : "Padrão";
}

/**
 * Extrai as amostras de cor associadas a uma variante (ex: hex da base e da cúpula).
 */
export function getVariantColors(
  product: SeedProduct,
  variant: SeedVariant
): { name: string; hex?: string; label?: string }[] {
  if (!product || !variant || !product.options) {
    return [];
  }

  const colors: { name: string; hex?: string; label?: string }[] = [];
  for (const option of product.options) {
    const isColorOption =
      option.name.toLowerCase().includes("cor") ||
      option.name.toLowerCase().includes("base") ||
      option.name.toLowerCase().includes("cúpula") ||
      option.name.toLowerCase().includes("cupula") ||
      option.values.some((v) => Boolean(v.colorHex));

    if (isColorOption) {
      const matched = option.values.find((v) =>
        variant.selectedOptionValueIds.includes(v.id)
      );
      if (matched && matched.colorHex) {
        colors.push({
          name: matched.name,
          hex: matched.colorHex,
          label: option.name,
        });
      }
    }
  }

  return colors;
}
