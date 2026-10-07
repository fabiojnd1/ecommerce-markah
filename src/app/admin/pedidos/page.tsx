import { requireAdmin } from "@/lib/auth";
import { listAllOrders, getOrderMetrics } from "@/lib/orders-repository";
import { OrdersTable } from "@/components/admin/orders-table";
import { formatCents } from "@/lib/pricing";
import {
  Clock,
  Printer,
  Truck,
  DollarSign,
} from "lucide-react";

export const metadata = {
  title: "Gestão de Pedidos — Admin Markah Brasil",
};

export default async function AdminPedidosPage() {
  await requireAdmin();
  const [{ orders }, metrics] = await Promise.all([
    listAllOrders(),
    getOrderMetrics(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Topo com Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">
            Gestão de Pedidos
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Controle do ciclo de manufatura sob demanda, expedição e logística
          </p>
        </div>
      </div>

      {/* Métricas Rápidas Operacionais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface rounded-card border border-border p-3.5 shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-text-muted tracking-wider block">
              Aguardando Pgto
            </span>
            <span className="text-lg font-bold text-ink">
              {metrics.waitingPaymentCount}
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-3.5 shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-text-muted tracking-wider block">
              Em Produção 3D
            </span>
            <span className="text-lg font-bold text-cyan-800">
              {metrics.inProductionCount}
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-3.5 shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-text-muted tracking-wider block">
              Em Trânsito
            </span>
            <span className="text-lg font-bold text-purple-800">
              {metrics.shippedCount}
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-3.5 shadow-subtle flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-text-muted tracking-wider block">
              Faturamento
            </span>
            <span className="text-base font-bold text-emerald-800">
              {formatCents(metrics.totalRevenueCents)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela Interativa de Pedidos com Filtros */}
      <OrdersTable initialOrders={orders} />
    </div>
  );
}
