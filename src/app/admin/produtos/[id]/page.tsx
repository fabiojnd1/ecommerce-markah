import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getProductById, getCategories } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/product-form";

interface AdminEditarProdutoPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditarProdutoPage({
  params,
}: AdminEditarProdutoPageProps) {
  await requireAdmin();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductById(id, true),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ink font-display">
          Editar Peça: {product.name}
        </h1>
        <p className="text-xs text-text-muted mt-1 font-mono">
          ID: {product.id} · Categoria: {product.categorySlug}
        </p>
      </div>

      <ProductForm initialProduct={product} categories={categories} />
    </div>
  );
}
