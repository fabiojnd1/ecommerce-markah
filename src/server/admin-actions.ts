"use server";

import { isDatabaseConfigured, assertDevFallbackAllowed } from "@/lib/runtime";

import { revalidatePath } from "next/cache";
import { requireAdmin, authenticateAdmin, logoutAdmin } from "@/lib/auth";
import {
  SEED_PRODUCTS,
  SEED_CATEGORIES,
  type SeedProduct,
  type SeedCategory,
  type SeedOption,
  type SeedVariant,
  type SeedImage,
} from "@/lib/data/catalog-seed";
import { db } from "@/lib/db";
import { deleteBlobsSafely } from "@/lib/blob-storage";
import { getProductById } from "@/lib/catalog";
import { generateVariantSku } from "@/lib/sku";

/**
 * Server Action de Login Administrativo.
 */
export async function loginAdminAction(formData: FormData) {
  return await authenticateAdmin(formData);
}

/**
 * Server Action de Logout Administrativo.
 */
export async function logoutAdminAction() {
  await logoutAdmin();
  revalidatePath("/admin");
}

export interface SaveProductPayload {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  collectionSlugs?: string[];
  material: "PLA" | "PETG";
  isSustainable: boolean;
  productionDays: number;
  dimensions: string;
  weightGrams: number;
  socketType?: string;
  maxWattage?: number;
  bulbIncluded?: boolean;
  cordLengthCm?: number;
  waterproof?: boolean;
  tags?: string[];
  priceCents: number;
  compareAtPriceCents?: number | null;
  packageHeightCm: number;
  packageWidthCm: number;
  packageDepthCm: number;
  colorName?: string;
  colorHex?: string;
  imageUrl?: string;
  hoverImageUrl?: string;
  images?: Array<{
    id?: string;
    url: string;
    alt?: string;
    displayOrder?: number;
    isPrimary?: boolean;
    isHover?: boolean;
  }>;
  deletedImageUrls?: string[];
  options?: SeedOption[];
  variants?: SeedVariant[];
  baseColors?: Array<{ id?: string; name: string; colorHex?: string }>;
  cupulaColors?: Array<{ id?: string; name: string; colorHex?: string }>;
}

/**
 * Server Action para Salvar ou Criar Produto.
 * Regra P-007: Exige privilégio ADMIN verificado no servidor.
 * Regra P-006: Exige peso e dimensões de embalagem cadastrados.
 * Regra D-011: Valores em centavos inteiros.
 */
export async function saveProductAction(payload: SaveProductPayload) {
  // 1. Checagem de privilégio administrativo no servidor (P-007)
  await requireAdmin();

  // 2. Validações de integridade e frete (P-006)
  if (!payload.name || payload.name.trim().length === 0) {
    return { success: false, error: "Nome do produto é obrigatório." };
  }
  if (!payload.slug || payload.slug.trim().length === 0) {
    return { success: false, error: "Slug do produto é obrigatório." };
  }
  if (!payload.priceCents || payload.priceCents <= 0) {
    return { success: false, error: "Preço em centavos deve ser maior que zero (D-011)." };
  }
  if (!payload.weightGrams || payload.weightGrams <= 0) {
    return { success: false, error: "Peso em gramas é obrigatório para cotação de frete (P-006)." };
  }
  if (
    !payload.packageHeightCm ||
    !payload.packageWidthCm ||
    !payload.packageDepthCm ||
    payload.packageHeightCm <= 0 ||
    payload.packageWidthCm <= 0 ||
    payload.packageDepthCm <= 0
  ) {
    return {
      success: false,
      error: "Dimensões da embalagem (A × L × P) são obrigatórias para o frete (P-006).",
    };
  }

  const productId = payload.id || `prod_${Date.now()}`;
  const cleanSlug = payload.slug.trim().toLowerCase();
  const isTableLamp = payload.categorySlug === "luminarias-de-mesa";
  let existingProduct = payload.id
    ? SEED_PRODUCTS.find((p) => p.id === payload.id || p.slug === payload.slug)
    : SEED_PRODUCTS.find((p) => p.slug === payload.slug);

  if (!existingProduct && isDatabaseConfigured()) {
    try {
      existingProduct = (await getProductById(payload.id || payload.slug)) || undefined;
    } catch {
      // ignore
    }
  }

  let finalOptions: SeedOption[] = [];
  let finalVariants: SeedVariant[] = [];

  // Se options e variants foram fornecidos no payload (do formulário ou de teste)
  if (payload.options && payload.options.length > 0 && payload.variants && payload.variants.length > 0) {
    // Validação de integridade do payload
    for (const opt of payload.options) {
      if (!opt.name || opt.name.trim().length === 0) {
        return { success: false, error: "Toda opção deve possuir um nome válido." };
      }
      if (!opt.values || opt.values.length === 0) {
        return { success: false, error: `A opção "${opt.name}" deve conter ao menos um valor.` };
      }
    }

    const allValueIds = new Set(
      payload.options.flatMap((o) => o.values.map((v) => v.id))
    );

    for (const variant of payload.variants) {
      if (!variant.sku || variant.sku.trim().length === 0) {
        return { success: false, error: "Toda variante deve possuir um SKU válido." };
      }
      if (!variant.selectedOptionValueIds || variant.selectedOptionValueIds.length === 0) {
        return { success: false, error: "Toda variante deve ter valores de opção selecionados." };
      }
      for (const valId of variant.selectedOptionValueIds) {
        if (!allValueIds.has(valId)) {
          return {
            success: false,
            error: `Variante com SKU "${variant.sku}" referencia valor de opção inválido (${valId}).`,
          };
        }
      }
    }

    finalOptions = payload.options;
    finalVariants = payload.variants;
  } else if (payload.baseColors && payload.cupulaColors && payload.baseColors.length > 0 && payload.cupulaColors.length > 0) {
    // Construção a partir de baseColors e cupulaColors
    const baseValues = payload.baseColors.map((b, idx) => ({
      id: b.id || `val_${productId}_base_${idx + 1}`,
      name: b.name.trim(),
      colorHex: b.colorHex || "#D97A53",
    }));

    const cupulaValues = payload.cupulaColors.map((c, idx) => ({
      id: c.id || `val_${productId}_cupula_${idx + 1}`,
      name: c.name.trim(),
      colorHex: c.colorHex || "#FAF8F5",
    }));

    finalOptions = [
      {
        id: `opt_${productId}_base`,
        name: "Cor da Base",
        values: baseValues,
      },
      {
        id: `opt_${productId}_cupula`,
        name: "Cor da Cúpula",
        values: cupulaValues,
      },
    ];

    finalVariants = [];
    for (const b of baseValues) {
      for (const c of cupulaValues) {
        finalVariants.push({
          id: `var_${productId}_${b.id.replace(/^val_/, "")}_${c.id.replace(/^val_/, "")}`,
          sku: generateVariantSku({
            productSlug: cleanSlug,
            categorySlug: payload.categorySlug,
            optionValueNames: [b.name, c.name],
          }),
          priceCents: Math.round(payload.priceCents),
          compareAtPriceCents: payload.compareAtPriceCents
            ? Math.round(payload.compareAtPriceCents)
            : null,
          weightGrams: payload.weightGrams,
          packageHeightCm: payload.packageHeightCm,
          packageWidthCm: payload.packageWidthCm,
          packageDepthCm: payload.packageDepthCm,
          active: true,
          selectedOptionValueIds: [b.id, c.id],
        });
      }
    }
  } else if (existingProduct?.options && existingProduct.options.length > 0) {
    // Preserva opções e variantes existentes se já configuradas (ex: Saturno, Duna)
    finalOptions = existingProduct.options;
    finalVariants = existingProduct.variants;
  } else if (isTableLamp) {
    // Nova luminária de mesa sem payload explícito: gera Base e Cúpula
    const baseValId = `val_${productId}_base_1`;
    const cupulaValId = `val_${productId}_cupula_1`;
    finalOptions = [
      {
        id: `opt_${productId}_base`,
        name: "Cor da Base",
        values: [
          {
            id: baseValId,
            name: payload.colorName || "Terracota",
            colorHex: payload.colorHex || "#D97A53",
          },
        ],
      },
      {
        id: `opt_${productId}_cupula`,
        name: "Cor da Cúpula",
        values: [
          {
            id: cupulaValId,
            name: "Branco Marfim",
            colorHex: "#FAF8F5",
          },
        ],
      },
    ];
    finalVariants = [
      {
        id: `var_${productId}_main`,
        sku: generateVariantSku({
          productSlug: cleanSlug,
          categorySlug: payload.categorySlug,
          optionValueNames: [payload.colorName || "Terracota", "Branco Marfim"],
        }),
        priceCents: Math.round(payload.priceCents),
        compareAtPriceCents: payload.compareAtPriceCents
          ? Math.round(payload.compareAtPriceCents)
          : null,
        weightGrams: payload.weightGrams,
        packageHeightCm: payload.packageHeightCm,
        packageWidthCm: payload.packageWidthCm,
        packageDepthCm: payload.packageDepthCm,
        active: true,
        selectedOptionValueIds: [baseValId, cupulaValId],
      },
    ];
  } else {
    // Nova peça de outra categoria: opção simples Cor
    const valId = `val_${productId}_c1`;
    finalOptions = [
      {
        id: `opt_${productId}_cor`,
        name: "Cor",
        values: [
          {
            id: valId,
            name: payload.colorName || "Padrão",
            colorHex: payload.colorHex || "#D97A53",
          },
        ],
      },
    ];
    finalVariants = [
      {
        id: `var_${productId}_main`,
        sku: generateVariantSku({
          productSlug: cleanSlug,
          categorySlug: payload.categorySlug,
          optionValueNames: payload.colorName && payload.colorName !== "Padrão" ? [payload.colorName] : [],
        }),
        priceCents: Math.round(payload.priceCents),
        compareAtPriceCents: payload.compareAtPriceCents
          ? Math.round(payload.compareAtPriceCents)
          : null,
        weightGrams: payload.weightGrams,
        packageHeightCm: payload.packageHeightCm,
        packageWidthCm: payload.packageWidthCm,
        packageDepthCm: payload.packageDepthCm,
        active: true,
        selectedOptionValueIds: [valId],
      },
    ];
  }

  // 3. Validação e montagem da galeria de fotos do produto
  let finalImages: SeedImage[] = [];

  if (payload.images && payload.images.length > 0) {
    const primaryImages = payload.images.filter((img) => img.isPrimary);
    if (primaryImages.length > 1) {
      return {
        success: false,
        error: "O produto pode ter no máximo uma imagem principal definida.",
      };
    }
    if (primaryImages.length === 0) {
      return {
        success: false,
        error: "É obrigatório definir exatamente uma imagem principal quando houver fotos cadastradas.",
      };
    }

    const hoverImages = payload.images.filter((img) => img.isHover);
    if (hoverImages.length > 1) {
      return {
        success: false,
        error: "O produto pode ter no máximo uma imagem de hover / iluminada definida.",
      };
    }

    finalImages = payload.images
      .map((img, idx) => ({
        id: img.id && !img.id.startsWith("temp_") ? img.id : `img_${productId}_${idx + 1}`,
        url: img.url,
        alt: img.alt?.trim() || `${payload.name} foto ${idx + 1}`,
        displayOrder: img.displayOrder !== undefined ? img.displayOrder : idx,
        isPrimary: Boolean(img.isPrimary),
        isHover: Boolean(img.isHover),
      }))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  } else if (payload.imageUrl) {
    finalImages = [
      {
        id: `img_${productId}_1`,
        url: payload.imageUrl,
        alt: `${payload.name} foto isolada`,
        displayOrder: 0,
        isPrimary: true,
        isHover: false,
      },
    ];
    if (payload.hoverImageUrl) {
      finalImages.push({
        id: `img_${productId}_2`,
        url: payload.hoverImageUrl,
        alt: `${payload.name} foto acesa/ambientada`,
        displayOrder: 1,
        isPrimary: false,
        isHover: true,
      });
    }
  } else if (payload.images && payload.images.length === 0) {
    finalImages = [];
  } else if (existingProduct?.images && existingProduct.images.length > 0) {
    finalImages = existingProduct.images;
  } else {
    finalImages = [
      {
        id: `img_${productId}_1`,
        url: "/products/luminaria-saturno-off.svg",
        alt: `${payload.name} foto isolada`,
        displayOrder: 0,
        isPrimary: true,
        isHover: false,
      },
      {
        id: `img_${productId}_2`,
        url: "/products/luminaria-saturno-on.svg",
        alt: `${payload.name} foto acesa/ambientada`,
        displayOrder: 1,
        isPrimary: false,
        isHover: true,
      },
    ];
  }

  const newProduct: SeedProduct = {
    id: productId,
    name: payload.name,
    slug: payload.slug,
    description: payload.description || "",
    categorySlug: payload.categorySlug,
    collectionSlugs: payload.collectionSlugs || [],
    material: payload.material,
    isSustainable: Boolean(payload.isSustainable),
    productionDays: payload.productionDays || 3,
    dimensions: payload.dimensions || "20 × 20 × 20 cm",
    weightGrams: payload.weightGrams,
    socketType: payload.socketType || undefined,
    maxWattage: payload.maxWattage || undefined,
    bulbIncluded: Boolean(payload.bulbIncluded),
    cordLengthCm: payload.cordLengthCm || undefined,
    waterproof: Boolean(payload.waterproof),
    tags: payload.tags || [],
    images: finalImages,
    options: finalOptions,
    variants: finalVariants,
  };

  // Tenta persistir no Prisma se houver conexão configurada
  let savedProductId = productId;
  try {
    if (isDatabaseConfigured()) {
      let category = await db.category.findUnique({
        where: { slug: payload.categorySlug },
      });
      if (!category) {
        category = await db.category.findFirst();
      }
      if (category) {
        await db.$transaction(async (tx) => {
          // 1. Atualizar por ID se já existir, ou upsert por slug
          let productRecord;
          if (payload.id) {
            const existingById = await tx.product.findUnique({
              where: { id: payload.id },
            });
            if (existingById) {
              productRecord = await tx.product.update({
                where: { id: payload.id },
                data: {
                  name: payload.name,
                  slug: payload.slug,
                  description: payload.description,
                  material: payload.material,
                  isSustainable: payload.isSustainable,
                  productionDays: payload.productionDays,
                  dimensions: payload.dimensions,
                  weightGrams: payload.weightGrams,
                  socketType: payload.socketType,
                  maxWattage: payload.maxWattage,
                  bulbIncluded: payload.bulbIncluded,
                  cordLengthCm: payload.cordLengthCm,
                  waterproof: payload.waterproof,
                  categoryId: category.id,
                },
              });
            }
          }

          if (!productRecord) {
            productRecord = await tx.product.upsert({
              where: { slug: payload.slug },
              update: {
                name: payload.name,
                description: payload.description,
                material: payload.material,
                isSustainable: payload.isSustainable,
                productionDays: payload.productionDays,
                dimensions: payload.dimensions,
                weightGrams: payload.weightGrams,
                socketType: payload.socketType,
                maxWattage: payload.maxWattage,
                bulbIncluded: payload.bulbIncluded,
                cordLengthCm: payload.cordLengthCm,
                waterproof: payload.waterproof,
                categoryId: category.id,
              },
              create: {
                id: productId,
                name: payload.name,
                slug: payload.slug,
                description: payload.description,
                material: payload.material,
                isSustainable: payload.isSustainable,
                productionDays: payload.productionDays,
                dimensions: payload.dimensions,
                weightGrams: payload.weightGrams,
                socketType: payload.socketType,
                maxWattage: payload.maxWattage,
                bulbIncluded: payload.bulbIncluded,
                cordLengthCm: payload.cordLengthCm,
                waterproof: payload.waterproof,
                categoryId: category.id,
              },
            });
          }

          savedProductId = productRecord.id;

          // 2. Limpar opções e variantes antigas se produto já existia
          const existingVariants = await tx.productVariant.findMany({
            where: { productId: productRecord.id },
            select: { id: true },
          });
          const existingVariantIds = existingVariants.map((v) => v.id);
          if (existingVariantIds.length > 0) {
            await tx.productVariantOptionValue.deleteMany({
              where: { variantId: { in: existingVariantIds } },
            });
            await tx.productVariant.deleteMany({
              where: { id: { in: existingVariantIds } },
            });
          }

          const existingOptions = await tx.productOption.findMany({
            where: { productId: productRecord.id },
            select: { id: true },
          });
          const existingOptionIds = existingOptions.map((o) => o.id);
          if (existingOptionIds.length > 0) {
            await tx.productOptionValue.deleteMany({
              where: { optionId: { in: existingOptionIds } },
            });
            await tx.productOption.deleteMany({
              where: { id: { in: existingOptionIds } },
            });
          }

          // 3. Criar ProductOptions e ProductOptionValues
          const valueIdMap = new Map<string, string>();
          for (let i = 0; i < finalOptions.length; i++) {
            const opt = finalOptions[i];
            const createdOpt = await tx.productOption.create({
              data: {
                productId: productRecord.id,
                name: opt.name,
                displayOrder: i,
              },
            });

            for (let j = 0; j < opt.values.length; j++) {
              const val = opt.values[j];
              const createdVal = await tx.productOptionValue.create({
                data: {
                  optionId: createdOpt.id,
                  name: val.name,
                  colorHex: val.colorHex,
                  displayOrder: j,
                },
              });
              valueIdMap.set(val.id, createdVal.id);
            }
          }

          // 4. Criar ProductVariants e associar em ProductVariantOptionValue
          const variantOptionValuesData: Array<{ variantId: string; optionValueId: string }> = [];
          const usedSkusInBatch = new Set<string>();

          for (let vi = 0; vi < finalVariants.length; vi++) {
            const variant = finalVariants[vi];
            let targetSku = variant.sku;

            // Evita duplicação dentro do próprio conjunto
            if (usedSkusInBatch.has(targetSku)) {
              targetSku = `${targetSku}-${vi + 1}`;
            }

            // Evita colisão com SKUs de outros produtos existentes
            const existingWithSku = await tx.productVariant.findFirst({
              where: {
                sku: targetSku,
                productId: { not: productRecord.id },
              },
              select: { id: true },
            });

            if (existingWithSku) {
              targetSku = `${targetSku}-${vi + 1}`;
            }

            usedSkusInBatch.add(targetSku);

            const createdVar = await tx.productVariant.create({
              data: {
                productId: productRecord.id,
                sku: targetSku,
                priceCents: variant.priceCents,
                compareAtPriceCents: variant.compareAtPriceCents,
                weightGrams: variant.weightGrams,
                packageHeightCm: variant.packageHeightCm,
                packageWidthCm: variant.packageWidthCm,
                packageDepthCm: variant.packageDepthCm,
                active: variant.active,
              },
            });

            for (const seedValId of variant.selectedOptionValueIds) {
              const prismaValId = valueIdMap.get(seedValId);
              if (prismaValId) {
                variantOptionValuesData.push({
                  variantId: createdVar.id,
                  optionValueId: prismaValId,
                });
              }
            }
          }

          if (variantOptionValuesData.length > 0) {
            await tx.productVariantOptionValue.createMany({
              data: variantOptionValuesData,
            });
          }

          // 5. Persistir ProductImage no mesmo fluxo transacional
          await tx.productImage.deleteMany({
            where: { productId: productRecord.id },
          });

          if (finalImages.length > 0) {
            await tx.productImage.createMany({
              data: finalImages.map((img, i) => ({
                productId: productRecord.id,
                url: img.url,
                alt: img.alt || `${payload.name} foto ${i + 1}`,
                displayOrder: img.displayOrder !== undefined ? img.displayOrder : i,
                isPrimary: img.isPrimary,
                isHover: img.isHover,
              })),
            });
          }
        }, {
          maxWait: 15000,
          timeout: 30000,
        });
      }
    }
  } catch (err) {
    console.error("[saveProductAction] Erro no banco de dados:", err);
    assertDevFallbackAllowed(err);
    return {
      success: false,
      error: `Não foi possível salvar o produto: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  newProduct.id = savedProductId;

  // Atualiza ou insere no repositório de dados em memória
  const existingIndex = SEED_PRODUCTS.findIndex(
    (p) => p.id === savedProductId || p.slug === payload.slug
  );
  if (existingIndex >= 0) {
    SEED_PRODUCTS[existingIndex] = newProduct;
  } else {
    SEED_PRODUCTS.unshift(newProduct);
  }

  revalidatePath("/produtos");
  revalidatePath("/");
  revalidatePath("/admin/produtos");
  revalidatePath(`/produtos/${payload.slug}`);

  // 6. Exclusão segura de blobs obsoletos do Vercel Blob somente após confirmação do salvamento
  if (payload.deletedImageUrls && payload.deletedImageUrls.length > 0) {
    const activeUrls = new Set([
      ...finalImages.map((img) => img.url),
      ...SEED_PRODUCTS.flatMap((p) => p.images.map((img) => img.url)),
    ]);

    const urlsToDelete = payload.deletedImageUrls.filter(
      (url) => !activeUrls.has(url)
    );

    if (urlsToDelete.length > 0) {
      deleteBlobsSafely(urlsToDelete).catch((err) => {
        console.error("[saveProductAction] Erro na limpeza de blobs:", err);
      });
    }
  }

  return { success: true, product: newProduct };
}

/**
 * Server Action para Duplicar Produto.
 */
export async function duplicateProductAction(productId: string) {
  await requireAdmin();

  let original: SeedProduct | null = null;
  if (isDatabaseConfigured()) {
    try {
      original = await getProductById(productId);
    } catch {
      // ignore
    }
  }
  if (!original) {
    original = SEED_PRODUCTS.find((p) => p.id === productId || p.slug === productId) || null;
  }
  if (!original) {
    return { success: false, error: "Produto não encontrado." };
  }

  const duplicatedId = `prod_${Date.now()}`;
  const duplicatedSlug = `${original.slug}-copia-${Date.now().toString().slice(-4)}`;

  const duplicatedProduct: SeedProduct = {
    ...original,
    id: duplicatedId,
    name: `${original.name} (Cópia)`,
    slug: duplicatedSlug,
    variants: original.variants.map((v, i) => ({
      ...v,
      id: `var_${duplicatedId}_${i}`,
      sku: `${v.sku}-CPY-${Date.now().toString().slice(-4)}`,
    })),
  };

  if (isDatabaseConfigured()) {
    try {
      const defaultVariant = duplicatedProduct.variants[0];
      await saveProductAction({
        id: duplicatedId,
        name: duplicatedProduct.name,
        slug: duplicatedProduct.slug,
        description: duplicatedProduct.description,
        categorySlug: duplicatedProduct.categorySlug,
        collectionSlugs: duplicatedProduct.collectionSlugs,
        material: duplicatedProduct.material,
        isSustainable: duplicatedProduct.isSustainable,
        productionDays: duplicatedProduct.productionDays,
        dimensions: duplicatedProduct.dimensions,
        weightGrams: duplicatedProduct.weightGrams,
        socketType: duplicatedProduct.socketType,
        maxWattage: duplicatedProduct.maxWattage,
        bulbIncluded: duplicatedProduct.bulbIncluded,
        cordLengthCm: duplicatedProduct.cordLengthCm,
        waterproof: duplicatedProduct.waterproof,
        priceCents: defaultVariant?.priceCents || 10000,
        compareAtPriceCents: defaultVariant?.compareAtPriceCents,
        packageHeightCm: defaultVariant?.packageHeightCm || 20,
        packageWidthCm: defaultVariant?.packageWidthCm || 20,
        packageDepthCm: defaultVariant?.packageDepthCm || 20,
        images: duplicatedProduct.images,
        options: duplicatedProduct.options,
        variants: duplicatedProduct.variants,
      });
    } catch (err) {
      assertDevFallbackAllowed(err);
    }
  }

  SEED_PRODUCTS.unshift(duplicatedProduct);

  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");

  return { success: true, product: duplicatedProduct };
}

/**
 * Server Action para Excluir ou Arquivar Produto.
 */
export async function deleteProductAction(productId: string) {
  await requireAdmin();

  let deletedSlug: string | undefined;

  try {
    if (isDatabaseConfigured()) {
      const existing = await db.product.findFirst({
        where: { OR: [{ id: productId }, { slug: productId }] },
        include: {
          orderItems: { select: { id: true } },
          images: { select: { url: true } },
        },
      });

      if (existing) {
        deletedSlug = existing.slug;

        if (existing.orderItems && existing.orderItems.length > 0) {
          // Se o produto possui pedidos vinculados, arquiva para preservar integridade contábil
          await db.product.update({
            where: { id: existing.id },
            data: { status: "ARCHIVED" },
          });
        } else {
          // Exclusão física definitiva em transação
          await db.$transaction(async (tx) => {
            await tx.productCollection.deleteMany({
              where: { productId: existing.id },
            });

            await tx.productImage.deleteMany({
              where: { productId: existing.id },
            });

            const variants = await tx.productVariant.findMany({
              where: { productId: existing.id },
              select: { id: true },
            });
            const variantIds = variants.map((v) => v.id);
            if (variantIds.length > 0) {
              await tx.productVariantOptionValue.deleteMany({
                where: { variantId: { in: variantIds } },
              });
              await tx.productVariant.deleteMany({
                where: { id: { in: variantIds } },
              });
            }

            const options = await tx.productOption.findMany({
              where: { productId: existing.id },
              select: { id: true },
            });
            const optionIds = options.map((o) => o.id);
            if (optionIds.length > 0) {
              await tx.productOptionValue.deleteMany({
                where: { optionId: { in: optionIds } },
              });
              await tx.productOption.deleteMany({
                where: { id: { in: optionIds } },
              });
            }

            await tx.product.delete({
              where: { id: existing.id },
            });
          });

          // Limpa blobs associados no Vercel Blob com segurança se aplicável
          if (existing.images && existing.images.length > 0) {
            const urlsToDelete = existing.images
              .map((img) => img.url)
              .filter((url) => url.startsWith("http"));
            if (urlsToDelete.length > 0) {
              deleteBlobsSafely(urlsToDelete).catch((err) => {
                console.error("[deleteProductAction] Erro na limpeza de blobs:", err);
              });
            }
          }
        }
      }
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    console.error("[deleteProductAction] Erro ao excluir produto:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao excluir produto no banco de dados.",
    };
  }

  // Atualiza também repositório em memória caso exista
  const index = SEED_PRODUCTS.findIndex((p) => p.id === productId || p.slug === productId);
  if (index >= 0) {
    if (!deletedSlug) deletedSlug = SEED_PRODUCTS[index].slug;
    SEED_PRODUCTS.splice(index, 1);
  }

  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin");
  revalidatePath("/");
  if (deletedSlug) {
    revalidatePath(`/produtos/${deletedSlug}`);
  }

  return { success: true };
}

/**
 * Server Action para Salvar Categoria.
 */
export async function saveCategoryAction(payload: {
  id?: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
}) {
  await requireAdmin();

  const categoryId = payload.id || `cat_${Date.now()}`;
  const newCategory: SeedCategory = {
    id: categoryId,
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    displayOrder: payload.displayOrder || 1,
  };

  const index = SEED_CATEGORIES.findIndex((c) => c.id === categoryId);
  if (index >= 0) {
    SEED_CATEGORIES[index] = newCategory;
  } else {
    SEED_CATEGORIES.push(newCategory);
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/produtos");
  revalidatePath("/");

  return { success: true, category: newCategory };
}

/**
 * Server Action para Excluir Categoria.
 */
export async function deleteCategoryAction(categoryId: string) {
  await requireAdmin();

  const index = SEED_CATEGORIES.findIndex((c) => c.id === categoryId);
  if (index >= 0) {
    SEED_CATEGORIES.splice(index, 1);
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/produtos");
  revalidatePath("/");

  return { success: true };
}

/**
 * Server Action para Salvar Configurações da Loja.
 */
export async function saveStoreSettingsAction(payload: {
  storeName: string;
  whatsappNumber: string;
  instagramHandle: string;
  originPostalCode: string;
  pixDiscountPercent: number;
  maxInstallmentsFree: number;
  freeShippingThresholdCents: number;
  defaultProductionDays: number;
}) {
  await requireAdmin();

  // Em banco Neon (se disponível)
  try {
    if (isDatabaseConfigured()) {
      await db.storeSettings.upsert({
        where: { id: "default" },
        update: payload,
        create: { id: "default", ...payload },
      });
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Configurações salvas (somente em desenvolvimento)
  }

  revalidatePath("/admin/configuracoes");
  revalidatePath("/");

  return { success: true };
}

/**
 * Server Action para alternar disponibilidade de uma variante específica no painel admin.
 */
export async function toggleVariantActiveAction(
  productId: string,
  variantId: string,
  active: boolean
) {
  await requireAdmin();

  try {
    if (isDatabaseConfigured()) {
      await db.productVariant.updateMany({
        where: { id: variantId },
        data: { active },
      });
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
  }

  const product = SEED_PRODUCTS.find((p) => p.id === productId);
  if (product) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      variant.active = active;
    }
    revalidatePath(`/produtos/${product.slug}`);
  }

  revalidatePath(`/admin/produtos/${productId}`);
  revalidatePath("/admin/produtos");
  return { success: true, active };
}

/**
 * Server Action para atualizar opções e variantes completas de uma peça.
 */
export async function updateProductVariantsAction(
  productId: string,
  options: SeedOption[],
  variants: SeedVariant[]
) {
  await requireAdmin();
  const product = SEED_PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return { success: false, error: "Produto não encontrado." };
  }
  product.options = options;
  product.variants = variants;

  revalidatePath(`/produtos/${product.slug}`);
  revalidatePath(`/admin/produtos/${productId}`);
  revalidatePath("/admin/produtos");
  return { success: true, product };
}
