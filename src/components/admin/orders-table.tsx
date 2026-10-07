"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ArrowRight,
  Truck,
  CreditCard,
  QrCode,
  Package,
} from "lucide-react";
import { formatCents } from "@/lib/pricing";
import { OrderStatusBadge } from "./order-status-badge";
import type { OrderRecord } from "@/lib/orders-repository";

interface OrdersTableProps {
  initialOrders: OrderRecord[];
}

const STATUS_FILTERS = [
  { key: "ALL", label: "Todos" },
  { key: "AGUARDANDO_PAGAMENTO", label: "Aguardando Pagamento" },
  { key: "PAGO", label: "Pagos" },
  { key: "EM_PRODUCAO", label: "Em Produção" },
  { key: "PRONTO_PARA_ENVIO", label: "Prontos p/ Envio" },
  { key: "ENVIADO", label: "Enviados" },
  { key: "ENTREGUE", label: "Entregues" },
  { key: "CANCELADO", label: "Cancelados" },
];

export function OrdersTable({ initialOrders }: OrdersTableProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      // Filtro de status
      if (selectedStatus !== "ALL" && order.status !== selectedStatus) {
        return false;
      }

      // Filtro de busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesEmail = order.customerEmail.toLowerCase().includes(q);
        const matchesCpf = order.customerCpf.includes(q);
        const matchesTracking = order.trackingCode?.toLowerCase().includes(q) || false;

        if (!matchesNumber && !matchesName && !matchesEmail && !matchesCpf && !matchesTracking) {
          return false;
        }
      }

      return true;
    });
  }, [initialOrders, selectedStatus, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Pesquisa */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Abas de Status com contadores */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {STATUS_FILTERS.map((tab) => {
            const count =
              tab.key === "ALL"
                ? initialOrders.length
                : initialOrders.filter((o) => o.status === tab.key).length;

            const isSelected = selectedStatus === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-ink text-white shadow-sm"
                    : "bg-surface-alt/70 text-text-muted hover:text-text hover:bg-surface-alt"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Input de busca */}
        <div className="relative min-w-[260px] shrink-0">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por #pedido, cliente, CPF ou rastreio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-surface rounded-card border border-border overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-alt/70 text-text-muted border-b border-border uppercase font-mono tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Pedido / Data</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Itens</th>
                <th className="py-3.5 px-4">Total & Pagamento</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Logística / Rastreio</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    <Package className="w-8 h-8 mx-auto mb-2 text-text-muted/60" />
                    <p className="font-medium">Nenhum pedido encontrado</p>
                    <p className="text-[11px] mt-0.5">
                      Tente alterar os filtros ou o termo de busca pesquisado.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const items = order.items || [];
                  const firstItem = items[0];

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-alt/40 transition-colors group"
                    >
                      {/* Pedido / Data */}
                      <td className="py-3.5 px-4 font-mono font-medium">
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="text-ink hover:underline font-bold block"
                        >
                          {order.orderNumber}
                        </Link>
                        <span className="text-[10px] text-text-muted block">
                          {dateStr}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold block text-text">
                          {order.customerName}
                        </span>
                        <span className="text-[10px] text-text-muted block">
                          {order.shippingCity}/{order.shippingState}
                        </span>
                      </td>

                      {/* Itens */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {firstItem && (
                            <div className="relative w-8 h-10 rounded border border-border overflow-hidden shrink-0 bg-surface-alt">
                              <Image
                                src={firstItem.imageUrl}
                                alt={firstItem.productName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-[11px] line-clamp-1">
                              {firstItem ? firstItem.productName : "Sem itens"}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {items.length > 1
                                ? `+ ${items.length - 1} outro(s) item(ns)`
                                : `${firstItem?.quantity || 1}x ${firstItem?.variantName || ""}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total & Pagamento */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-ink block">
                          {formatCents(order.finalAmountCents)}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted mt-0.5">
                          {order.paymentMethod === "PIX" ? (
                            <>
                              <QrCode className="w-3 h-3 text-emerald-600" />
                              <span>Pix</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              <span>Cartão {order.cardInstallments ? `${order.cardInstallments}x` : ""}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={order.status} size="sm" />
                      </td>

                      {/* Logística / Rastreio */}
                      <td className="py-3.5 px-4">
                        {order.trackingCode ? (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-purple-700 font-semibold">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{order.trackingCode}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted">
                            {order.shippingCarrier}
                          </span>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text hover:bg-surface-alt hover:text-ink transition-colors"
                        >
                          <span>Gerenciar</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
