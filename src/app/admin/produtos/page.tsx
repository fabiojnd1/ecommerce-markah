import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, ExternalLink, Copy, Trash2, Edit } from "lucide-react";
import { getProducts, getCategories } from "@/lib/catalog";
import { formatCents } from "@/lib/pricing";
import { duplicateProductAction, deleteProductAction } from "@/server/admin-actions";

export default async function AdminProdutosPage() {
  await requireAdmin();
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Topo: Título e Botão de Criação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">
            Gestão de Produtos
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {products.length} produtos cadastrados no catálogo da loja
          </p>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-subtle"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </Link>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-surface rounded-card border border-border overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-alt/70 text-text-muted border-b border-border uppercase font-mono tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Peça</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Material</th>
                <th className="py-3.5 px-4">Preço Base</th>
                <th className="py-3.5 px-4">Variações</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text">
              {products.map((p) => {
                const defaultVariant = p.variants[0];
                const category = categories.find((c) => c.slug === p.categorySlug);

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-alt/40 transition-colors"
                  >
                    {/* Foto e Nome */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded bg-surface-alt overflow-hidden shrink-0 border border-border relative">
                          <Image
                            src={p.images[0]?.url || "/brand/markah-simbolo.png"}
                            alt={p.name}
                            width={40}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/admin/produtos/${p.id}`}
                            className="font-semibold text-ink hover:text-magenta transition-colors line-clamp-1"
                          >
                            {p.name}
                          </Link>
                          <span className="text-[11px] text-text-muted font-mono block">
                            /{p.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="py-3 px-4 capitalize text-text-muted">
                      {category?.name || p.categorySlug}
                    </td>

                    {/* Material */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.material === "PLA"
                            ? "bg-verde/10 text-verde"
                            : "bg-ciano/10 text-ciano"
                        }`}
                      >
                        {p.material}
                      </span>
                    </td>

                    {/* Preço */}
                    <td className="py-3 px-4 font-bold text-ink">
                      {formatCents(defaultVariant.priceCents)}
                    </td>

                    {/* Contagem de Variações */}
                    <td className="py-3 px-4 text-text-muted">
                      {p.variants.length} opção(ões)
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-verde/10 text-verde font-semibold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-verde" />
                        <span>Ativo</span>
                      </span>
                    </td>

                    {/* Ações Rápidas */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver na loja */}
                        <Link
                          href={`/produtos/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Visualizar na loja"
                          className="p-1.5 rounded hover:bg-neutral-100 text-text-muted hover:text-text transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Editar */}
                        <Link
                          href={`/admin/produtos/${p.id}`}
                          title="Editar peça"
                          className="p-1.5 rounded hover:bg-neutral-100 text-text-muted hover:text-text transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Duplicar */}
                        <form
                          action={async () => {
                            "use server";
                            await duplicateProductAction(p.id);
                          }}
                        >
                          <button
                            type="submit"
                            title="Duplicar produto"
                            className="p-1.5 rounded hover:bg-neutral-100 text-text-muted hover:text-text transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </form>

                        {/* Excluir */}
                        <form
                          action={async () => {
                            "use server";
                            await deleteProductAction(p.id);
                          }}
                        >
                          <button
                            type="submit"
                            title="Excluir produto"
                            className="p-1.5 rounded hover:bg-red-50 text-text-muted hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
