import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { saveCategoryAction, deleteCategoryAction } from "@/server/admin-actions";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminCategoriasPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ink font-display">
          Categorias da Loja
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Gerencie os departamentos que organizam o catálogo e aparecem no menu de navegação
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Formulário de Criação Rápida */}
        <div className="bg-surface rounded-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-text uppercase tracking-wider font-mono">
            <PlusCircle className="w-4 h-4 text-magenta" />
            <span>Nova Categoria</span>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              const name = formData.get("name") as string;
              const slug =
                (formData.get("slug") as string) ||
                name
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9]+/g, "-");
              const description = formData.get("description") as string;
              const displayOrder = Number(formData.get("displayOrder")) || 1;

              if (name && slug) {
                await saveCategoryAction({
                  name,
                  slug,
                  description,
                  displayOrder,
                });
              }
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Nome da Categoria *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ex: Esculturas de Mesa"
                className="w-full h-9 px-3 rounded-input border border-border bg-surface text-xs focus:outline-none focus:border-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Slug (URL)
              </label>
              <input
                type="text"
                name="slug"
                placeholder="esculturas-de-mesa"
                className="w-full h-9 px-3 rounded-input border border-border bg-surface text-xs font-mono focus:outline-none focus:border-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Ordem no Menu
              </label>
              <input
                type="number"
                name="displayOrder"
                defaultValue={categories.length + 1}
                className="w-full h-9 px-3 rounded-input border border-border bg-surface text-xs focus:outline-none focus:border-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Descrição Curta
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Texto explicativo para SEO e subtítulo da página..."
                className="w-full p-2.5 rounded-input border border-border bg-surface text-xs focus:outline-none focus:border-ink"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full text-xs font-semibold"
            >
              Adicionar Categoria
            </Button>
          </form>
        </div>

        {/* Tabela de Categorias Existentes */}
        <div className="md:col-span-2 bg-surface rounded-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-text uppercase tracking-wider font-mono">
              Categorias Ativas ({categories.length})
            </span>
          </div>

          <div className="divide-y divide-border">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 flex items-center justify-between hover:bg-surface-alt/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-alt text-[10px] font-mono font-bold flex items-center justify-center text-text-muted">
                      {cat.displayOrder}
                    </span>
                    <strong className="text-xs font-semibold text-ink">
                      {cat.name}
                    </strong>
                    <span className="text-[11px] font-mono text-text-muted">
                      /{cat.slug}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-[11px] text-text-muted mt-1 max-w-md line-clamp-1">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await deleteCategoryAction(cat.id);
                    }}
                  >
                    <button
                      type="submit"
                      title="Excluir categoria"
                      className="p-1.5 rounded text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
