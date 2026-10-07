import { Suspense } from "react";
import type { Metadata } from "next";
import { getProducts, getCategories } from "@/lib/catalog";
import { ProductGrid } from "@/components/loja/product-grid";
import { ProductFilters } from "@/components/loja/product-filters";

export const metadata: Metadata = {
  title: "Catálogo Completo de Peças 3D",
  description:
    "Explore todas as luminárias, vasos, cachepôs e objetos decorativos impressos em 3D pela Markah Brasil. 5% de desconto no Pix e frete grátis acima de R$ 200.",
};

interface ProdutosPageProps {
  searchParams: Promise<{
    categoria?: string;
    material?: string;
    ordem?: "relevance" | "price-asc" | "price-desc" | "newest";
    busca?: string;
  }>;
}

export default async function ProdutosPage({
  searchParams,
}: ProdutosPageProps) {
  const resolvedParams = await searchParams;

  const categories = await getCategories();
  const products = await getProducts({
    categorySlug: resolvedParams.categoria,
    material: resolvedParams.material,
    sortBy: resolvedParams.ordem,
    search: resolvedParams.busca,
  });

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Cabeçalho da Listagem */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display">
          {resolvedParams.busca
            ? `Resultados para "${resolvedParams.busca}"`
            : "Catálogo de Decoração"}
        </h1>
        <p className="text-sm sm:text-base text-text-muted mt-2 max-w-2xl">
          Peças autorais impressas em 3D camada por camada. Escolha seu modelo,
          selecione a cor e personalize a atmosfera do seu ambiente.
        </p>
      </div>

      {/* Barra de Filtros e Ordenação */}
      <Suspense fallback={<div className="h-14 bg-surface-alt rounded-card animate-pulse mb-8" />}>
        <ProductFilters categories={categories} totalCount={products.length} />
      </Suspense>

      {/* Grade de Produtos */}
      <ProductGrid
        products={products}
        emptyMessage="Nenhuma peça encontrada para os critérios selecionados. Experimente limpar os filtros."
      />
    </div>
  );
}
