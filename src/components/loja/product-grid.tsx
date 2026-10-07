import { ProductCard } from "./product-card";
import type { SeedProduct } from "@/lib/data/catalog-seed";

interface ProductGridProps {
  products: SeedProduct[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = "Nenhum produto encontrado com os filtros selecionados.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-surface rounded-card border border-border">
        <p className="text-text-muted text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
