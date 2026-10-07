import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getCategories, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/loja/product-grid";
import { ProductFilters } from "@/components/loja/product-filters";
import { SEED_COLLECTIONS } from "@/lib/data/catalog-seed";

interface CategoriaPageProps {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{
    material?: string;
    ordem?: "relevance" | "price-asc" | "price-desc" | "newest";
  }>;
}

export async function generateMetadata({
  params,
}: CategoriaPageProps): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  const collection = SEED_COLLECTIONS.find((c) => c.slug === categoria);

  const title = category?.name || collection?.name || "Categoria";
  const description =
    category?.description ||
    collection?.description ||
    "Objetos decorativos autorais impressos em 3D pela Markah Brasil.";

  return {
    title: `${title} — Decoração em Impressão 3D`,
    description,
  };
}

export default async function CategoriaPage({
  params,
  searchParams,
}: CategoriaPageProps) {
  const { categoria } = await params;
  const resolvedSearchParams = await searchParams;

  const category = await getCategoryBySlug(categoria);
  const collection = SEED_COLLECTIONS.find((c) => c.slug === categoria);

  if (!category && !collection) {
    notFound();
  }

  const title = category?.name || collection?.name;
  const description = category?.description || collection?.description;

  const allCategories = await getCategories();
  const products = await getProducts({
    categorySlug: category ? category.slug : undefined,
    collectionSlug: collection ? collection.slug : undefined,
    material: resolvedSearchParams.material,
    sortBy: resolvedSearchParams.ordem,
  });

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Cabeçalho da Categoria */}
      <div className="mb-8">
        <div className="inline-block px-3 py-1 rounded-full bg-surface-alt text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider font-mono">
          Categoria Markah
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-text-muted mt-2 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Filtros rápidos */}
      <ProductFilters categories={allCategories} totalCount={products.length} />

      {/* Grade de Produtos da Categoria */}
      <ProductGrid
        products={products}
        emptyMessage={`Nenhuma peça encontrada na categoria ${title} com os filtros selecionados.`}
      />
    </div>
  );
}
