import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import {
  FolderTree,
  PlusCircle,
  Settings,
  ArrowRight,
  ShoppingBag,
  Truck,
  Printer,
  DollarSign,
} from "lucide-react";
import { getProducts } from "@/lib/catalog";
import { formatCents } from "@/lib/pricing";
import { getOrderMetrics, listAllOrders } from "@/lib/orders-repository";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [products, metrics, { orders: recentOrders }] = await Promise.all([
    getProducts(),
    getOrderMetrics(),
    listAllOrders({ limit: 5 }),
  ]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">
            Painel Geral
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Visão consolidada do catálogo e parâmetros comerciais da Markah Brasil
          </p>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-subtle"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Produto</span>
        </Link>
      </div>

      {/* Cards de Métricas Operacionais e Comerciais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-card border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted font-mono uppercase">
              Faturamento
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-ink font-display">
              {formatCents(metrics.totalRevenueCents)}
            </span>
            <span className="text-xs text-text-muted block mt-1">
              receita total aprovada
            </span>
          </div>
        </div>

        <Link
          href="/admin/pedidos"
          className="bg-surface rounded-card border border-border p-5 hover:border-ink transition-colors block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted font-mono uppercase">
              Total Pedidos
            </span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-ink font-display">
              {metrics.totalOrders}
            </span>
            <span className="text-xs text-text-muted block mt-1">
              pedidos recebidos
            </span>
          </div>
        </Link>

        <div className="bg-surface rounded-card border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted font-mono uppercase">
              Produção 3D
            </span>
            <Printer className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-cyan-800 font-display">
              {metrics.inProductionCount}
            </span>
            <span className="text-xs text-text-muted block mt-1">
              itens na impressora
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted font-mono uppercase">
              Em Trânsito
            </span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-purple-800 font-display">
              {metrics.shippedCount}
            </span>
            <span className="text-xs text-text-muted block mt-1">
              despachados / frete
            </span>
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos e Gestão */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/pedidos"
          className="p-4 rounded-card bg-surface border border-border hover:border-ink hover:shadow-subtle transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-ink/5 text-ink flex items-center justify-center mb-2.5">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold text-ink group-hover:text-magenta transition-colors">
            Gerenciar Pedidos
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
            Fluxo de impressão, expedição e código de rastreamento.
          </p>
        </Link>

        <Link
          href="/admin/produtos/novo"
          className="p-4 rounded-card bg-surface border border-border hover:border-magenta hover:shadow-subtle transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-magenta/10 text-magenta flex items-center justify-center mb-2.5">
            <PlusCircle className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold text-ink group-hover:text-magenta transition-colors">
            Cadastrar Produto
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
            Adicione nova luminária ou peça com cores e especificações.
          </p>
        </Link>

        <Link
          href="/admin/categorias"
          className="p-4 rounded-card bg-surface border border-border hover:border-ciano hover:shadow-subtle transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-ciano/10 text-ciano flex items-center justify-center mb-2.5">
            <FolderTree className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold text-ink group-hover:text-ciano transition-colors">
            Categorias
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
            Organize os departamentos e ordem de vitrine da loja.
          </p>
        </Link>

        <Link
          href="/admin/configuracoes"
          className="p-4 rounded-card bg-surface border border-border hover:border-laranja hover:shadow-subtle transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-laranja/10 text-laranja flex items-center justify-center mb-2.5">
            <Settings className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold text-ink group-hover:text-laranja transition-colors">
            Configurações
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
            WhatsApp, CEP de origem e regras de frete e produção.
          </p>
        </Link>
      </div>

      {/* Grid de 2 Colunas: Pedidos Recentes e Catálogo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos Recentes */}
        <div className="bg-surface rounded-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                Pedidos Recentes
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                Últimos pedidos recebidos no sistema
              </p>
            </div>
            <Link
              href="/admin/pedidos"
              className="text-xs font-semibold text-text hover:text-ink flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border text-xs">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-text-muted">
                Nenhum pedido registrado ainda.
              </div>
            ) : (
              recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 flex items-center justify-between hover:bg-surface-alt/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/pedidos/${ord.id}`}
                        className="font-mono font-bold text-ink hover:underline"
                      >
                        {ord.orderNumber}
                      </Link>
                      <OrderStatusBadge status={ord.status} size="sm" />
                    </div>
                    <span className="text-[11px] text-text-muted block mt-0.5">
                      {ord.customerName} • {formatCents(ord.finalAmountCents)}
                    </span>
                  </div>

                  <Link
                    href={`/admin/pedidos/${ord.id}`}
                    className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-text font-medium text-[11px] transition-colors"
                  >
                    Ver detalhes
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

      {/* Lista de Peças Recentes no Catálogo */}
      <div className="bg-surface rounded-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">Peças no Catálogo</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Últimos itens ativos na vitrine
            </p>
          </div>
          <Link
            href="/admin/produtos"
            className="text-xs font-semibold text-text hover:text-magenta flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-border">
          {products.slice(0, 5).map((p) => {
            const minPrice = Math.min(...p.variants.map((v) => v.priceCents));
            return (
              <div
                key={p.id}
                className="p-4 flex items-center justify-between hover:bg-surface-alt/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 bg-surface-alt rounded overflow-hidden relative shrink-0">
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
                      className="text-xs font-semibold text-ink hover:text-magenta transition-colors"
                    >
                      {p.name}
                    </Link>
                    <span className="text-[11px] text-text-muted block">
                      {p.categorySlug} · {p.material} · {p.variants.length} variações
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-text">
                    {formatCents(minPrice)}
                  </span>
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    className="px-3 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-text font-medium text-[11px] transition-colors"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
}


