import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/product-form";

export default async function AdminNovoProdutoPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ink font-display">
          Cadastrar Novo Produto
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Adicione uma nova peça ao catálogo com ficha técnica e parâmetros de envio
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
