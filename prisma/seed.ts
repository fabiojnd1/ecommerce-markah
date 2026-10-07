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

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
