import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES, SEED_COLLECTIONS, SEED_PRODUCTS } from "../src/lib/data/catalog-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do Ecommerce Markah...");

  // 1. Configurações da loja
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "Markah Brasil",
      whatsappNumber: "5511999999999",
      instagramHandle: "markah_br",
      originPostalCode: "01001000",
      pixDiscountPercent: 5,
      maxInstallmentsFree: 3,
      freeShippingThresholdCents: 20000,
      defaultProductionDays: 3,
    },
  });

  // 2. Categorias
  for (const cat of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        displayOrder: cat.displayOrder,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
      },
    });
  }

  // 3. Coleções
  for (const col of SEED_COLLECTIONS) {
    await prisma.collection.upsert({
      where: { slug: col.slug },
      update: {
        name: col.name,
        description: col.description,
      },
      create: {
        name: col.name,
        slug: col.slug,
        description: col.description,
      },
    });
  }

  // 4. Produtos
  for (const prod of SEED_PRODUCTS) {
    const category = await prisma.category.findUnique({
      where: { slug: prod.categorySlug },
    });
    if (!category) continue;

    const productRecord = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        description: prod.description,
        material: prod.material,
        isSustainable: prod.isSustainable,
        productionDays: prod.productionDays,
        dimensions: prod.dimensions,
        weightGrams: prod.weightGrams,
        socketType: prod.socketType,
        maxWattage: prod.maxWattage,
        bulbIncluded: prod.bulbIncluded,
        cordLengthCm: prod.cordLengthCm,
        waterproof: prod.waterproof,
        categoryId: category.id,
      },
      create: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        material: prod.material,
        isSustainable: prod.isSustainable,
        productionDays: prod.productionDays,
        dimensions: prod.dimensions,
        weightGrams: prod.weightGrams,
        socketType: prod.socketType,
        maxWattage: prod.maxWattage,
        bulbIncluded: prod.bulbIncluded,
        cordLengthCm: prod.cordLengthCm,
        waterproof: prod.waterproof,
        categoryId: category.id,
      },
    });

    // Limpar e recriar opções e variantes para idempotência
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: productRecord.id },
      select: { id: true },
    });
    const existingVariantIds = existingVariants.map((v) => v.id);
    if (existingVariantIds.length > 0) {
      await prisma.productVariantOptionValue.deleteMany({
        where: { variantId: { in: existingVariantIds } },
      });
      await prisma.productVariant.deleteMany({
        where: { id: { in: existingVariantIds } },
      });
    }

    const existingOptions = await prisma.productOption.findMany({
      where: { productId: productRecord.id },
      select: { id: true },
    });
    const existingOptionIds = existingOptions.map((o) => o.id);
    if (existingOptionIds.length > 0) {
      await prisma.productOptionValue.deleteMany({
        where: { optionId: { in: existingOptionIds } },
      });
      await prisma.productOption.deleteMany({
        where: { id: { in: existingOptionIds } },
      });
    }

    const valueIdMap = new Map<string, string>();
    for (let i = 0; i < prod.options.length; i++) {
      const opt = prod.options[i];
      const createdOpt = await prisma.productOption.create({
        data: {
          productId: productRecord.id,
          name: opt.name,
          displayOrder: i,
        },
      });

      for (let j = 0; j < opt.values.length; j++) {
        const val = opt.values[j];
        const createdVal = await prisma.productOptionValue.create({
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

    for (const variant of prod.variants) {
      const createdVar = await prisma.productVariant.create({
        data: {
          productId: productRecord.id,
          sku: variant.sku,
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
          await prisma.productVariantOptionValue.create({
            data: {
              variantId: createdVar.id,
              optionValueId: prismaValId,
            },
          });
        }
      }
    }

    await prisma.productImage.deleteMany({
      where: { productId: productRecord.id },
    });

    for (let i = 0; i < prod.images.length; i++) {
      const img = prod.images[i];
      await prisma.productImage.create({
        data: {
          productId: productRecord.id,
          url: img.url,
          alt: img.alt || `${prod.name} foto ${i + 1}`,
          displayOrder: img.displayOrder !== undefined ? img.displayOrder : i,
          isPrimary: img.isPrimary,
          isHover: img.isHover,
        },
      });
    }
  }

  console.log("Seed de categorias, coleções e produtos concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
