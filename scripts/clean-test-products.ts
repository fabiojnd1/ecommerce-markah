import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanTestProducts() {
  console.log("======================================================");
  console.log("   MARKAH — SCRIPT DE LIMPEZA DE PRODUTOS DE TESTE    ");
  console.log("======================================================\n");

  // 1. Verificação prévia de segurança: Categorias
  const existingCategories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
  });

  console.log(`[CATEGORIAS] Encontradas ${existingCategories.length} categorias cadastradas:`);
  for (const cat of existingCategories) {
    console.log(`  - ${cat.name} (slug: ${cat.slug}, ordem: ${cat.displayOrder})`);
  }

  if (existingCategories.length === 0) {
    throw new Error("ALERTA: Nenhuma categoria encontrada! Abortando por segurança.");
  }

  console.log("\n-> CATEGORIAS ESTÃO PRESERVADAS E NÃO SERÃO ALTERADAS.");

  // 2. Contagem de produtos de teste existentes antes da limpeza
  const productCountBefore = await prisma.product.count();
  const variantCountBefore = await prisma.productVariant.count();
  const imageCountBefore = await prisma.productImage.count();

  console.log(`\n[ESTADO ATUAL]`);
  console.log(`  - Produtos a remover: ${productCountBefore}`);
  console.log(`  - Variantes a remover: ${variantCountBefore}`);
  console.log(`  - Imagens de produtos a remover: ${imageCountBefore}`);

  // 3. Execução transacional de exclusão limpa dos produtos e filhos
  console.log("\n[EXECUÇÃO] Iniciando exclusão física em cascata...");

  await prisma.$transaction(async (tx) => {
    // 3.1. Relações produto-coleção
    const pc = await tx.productCollection.deleteMany({});
    console.log(`  ✓ Relações produto-coleção removidas: ${pc.count}`);

    // 3.2. Valores de opções de variantes
    const pvov = await tx.productVariantOptionValue.deleteMany({});
    console.log(`  ✓ Vínculos variante-opção removidos: ${pvov.count}`);

    // 3.3. Variantes de produto
    const variants = await tx.productVariant.deleteMany({});
    console.log(`  ✓ Variantes de produto removidas: ${variants.count}`);

    // 3.4. Valores de opções
    const pov = await tx.productOptionValue.deleteMany({});
    console.log(`  ✓ Valores de opções removidos: ${pov.count}`);

    // 3.5. Opções de produtos
    const options = await tx.productOption.deleteMany({});
    console.log(`  ✓ Opções de produtos removidas: ${options.count}`);

    // 3.6. Imagens de produtos
    const images = await tx.productImage.deleteMany({});
    console.log(`  ✓ Imagens de produtos removidas: ${images.count}`);

    // 3.7. Avaliações de teste vinculadas a produtos antigos
    const reviews = await tx.review.deleteMany({});
    console.log(`  ✓ Avaliações de teste removidas: ${reviews.count}`);

    // 3.8. Produtos propriamente ditos
    const prods = await tx.product.deleteMany({});
    console.log(`  ✓ Produtos de teste removidos: ${prods.count}`);
  });

  // 4. Verificação pós-execução
  const productCountAfter = await prisma.product.count();
  const categoryCountAfter = await prisma.category.count();

  console.log("\n======================================================");
  console.log("              RESULTADO DA VERIFICAÇÃO                ");
  console.log("======================================================");
  console.log(`  - Produtos restantes na base: ${productCountAfter} (Esperado: 0)`);
  console.log(`  - Categorias preservadas na base: ${categoryCountAfter} (Esperado: 6)`);

  if (productCountAfter === 0 && categoryCountAfter === existingCategories.length) {
    console.log("\n SUCESSO: A base de dados está limpa e pronta para receber os produtos oficiais!");
  } else {
    console.warn("\n AVISO: Revise as contagens acima.");
  }
}

cleanTestProducts()
  .catch((err) => {
    console.error("ERRO durante a limpeza:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
