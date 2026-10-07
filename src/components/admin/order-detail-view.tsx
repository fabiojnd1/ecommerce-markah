"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type OrderStatus } from "@prisma/client";
import {
  ArrowLeft,
  Printer,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Save,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { formatCents } from "@/lib/pricing";
import { OrderStatusBadge } from "./order-status-badge";
import {
  updateOrderStatusAction,
  updateOrderTrackingAction,
  saveInternalNotesAction,
  refundOrderAction,
} from "@/server/admin-order-actions";
import type { OrderRecord } from "@/lib/orders-repository";

interface OrderDetailViewProps {
  initialOrder: OrderRecord;
}

const LIFECYCLE_STEPS: Array<{
  status: OrderStatus;
  label: string;
  icon: typeof Clock;
}> = [
  { status: "AGUARDANDO_PAGAMENTO", label: "Aguardando Pgto", icon: Clock },
  { status: "PAGO", label: "Pago", icon: CheckCircle2 },
  { status: "EM_PRODUCAO", label: "Em Produção 3D", icon: Printer },
  { status: "PRONTO_PARA_ENVIO", label: "Pronto p/ Envio", icon: Package },
  { status: "ENVIADO", label: "Enviado", icon: Truck },
  { status: "ENTREGUE", label: "Entregue", icon: CheckCircle2 },
];

export function OrderDetailView({ initialOrder }: OrderDetailViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderRecord>(initialOrder);
  const [internalNotes, setInternalNotes] = useState(order.internalNotes || "");
  const [trackingInput, setTrackingInput] = useState(order.trackingCode || "");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const isCanceledOrRefunded =
    order.status === "CANCELADO" || order.status === "REEMBOLSADO";

  const currentStepIndex = LIFECYCLE_STEPS.findIndex(
    (s) => s.status === order.status
  );

  async function handleAdvanceStatus(newStatus: OrderStatus) {
    if (newStatus === "ENVIADO" && !trackingInput.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "Informe o código de rastreamento antes de marcar como Enviado.",
      });
      return;
    }

    setIsUpdatingStatus(true);
    setFeedbackMessage(null);

    const res = await updateOrderStatusAction(order.id, newStatus, {
      trackingCode: trackingInput.trim() || undefined,
    });

    setIsUpdatingStatus(false);
    if (res.success && res.order) {
      setOrder(res.order);
      setFeedbackMessage({
        type: "success",
        text: `Status atualizado com sucesso para "${newStatus}".`,
      });
      router.refresh();
    } else {
      setFeedbackMessage({
        type: "error",
        text: res.error || "Erro ao atualizar status.",
      });
    }
  }

  async function handleSaveTracking() {
    if (!trackingInput.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "Informe um código de rastreamento válido.",
      });
      return;
    }

    setIsDispatching(true);
    setFeedbackMessage(null);

    const res = await updateOrderTrackingAction(order.id, trackingInput.trim());

    setIsDispatching(false);
    if (res.success && res.order) {
      setOrder(res.order);
      setFeedbackMessage({
        type: "success",
        text: `Código de rastreamento salvo e pedido marcado como Enviado!`,
      });
      router.refresh();
    } else {
      setFeedbackMessage({
        type: "error",
        text: res.error || "Erro ao salvar rastreamento.",
      });
    }
  }

  async function handleSaveNotes() {
    setIsSavingNotes(true);
    setFeedbackMessage(null);

    const res = await saveInternalNotesAction(order.id, internalNotes);

    setIsSavingNotes(false);
    if (res.success && res.order) {
      setOrder(res.order);
      setFeedbackMessage({
        type: "success",
        text: "Anotações internas salvas com sucesso.",
      });
    } else {
      setFeedbackMessage({
        type: "error",
        text: "Erro ao salvar anotações.",
      });
    }
  }

  async function handleRefund() {
    const reason = prompt("Informe o motivo do cancelamento / reembolso:");
    if (reason === null) return;

    setIsRefunding(true);
    setFeedbackMessage(null);

    const res = await refundOrderAction(order.id, reason);

    setIsRefunding(false);
    if (res.success && res.order) {
      setOrder(res.order);
      setInternalNotes(res.order.internalNotes || "");
      setFeedbackMessage({
        type: "success",
        text: "Pedido registrado como reembolsado.",
      });
      router.refresh();
    } else {
      setFeedbackMessage({
        type: "error",
        text: res.error || "Erro ao registrar reembolso.",
      });
    }
  }

  function handleCopyTracking() {
    if (!order.trackingCode) return;
    navigator.clipboard.writeText(order.trackingCode);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Barra de Navegação Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pedidos"
            className="p-2 rounded-lg border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink font-mono">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Criado em{" "}
              {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Botão de Cancelar/Reembolsar */}
        {!isCanceledOrRefunded && (
          <button
            onClick={handleRefund}
            disabled={isRefunding}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reembolsar / Cancelar</span>
          </button>
        )}
      </div>

      {/* Alerta de Feedback */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Stepper do Ciclo de Produção & Despacho */}
      <div className="bg-surface rounded-card border border-border p-5 shadow-subtle">
        <h2 className="text-xs uppercase font-mono tracking-wider text-text-muted mb-4">
          Linha do Tempo de Produção & Entrega
        </h2>

        {isCanceledOrRefunded ? (
          <div className="p-4 rounded-lg bg-neutral-100 text-neutral-700 text-xs flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-neutral-500" />
            <span>
              Este pedido foi {order.status === "REEMBOLSADO" ? "reembolsado" : "cancelado"}.
            </span>
          </div>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step.status}
                    className={`flex flex-col items-center text-center p-3 rounded-lg border transition-all ${
                      isCurrent
                        ? "bg-ink text-white border-ink shadow-sm"
                        : isPassed
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                        : "bg-surface-alt/40 border-border text-text-muted"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-1.5 ${
                        isCurrent
                          ? "text-white"
                          : isPassed
                          ? "text-emerald-600"
                          : "text-text-muted/60"
                      }`}
                    />
                    <span className="text-[11px] font-semibold leading-tight">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Ações de Avanço Rápido */}
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-text-muted">
                Avançar estágio do fluxo:
              </span>
              <div className="flex flex-wrap gap-2">
                {order.status === "AGUARDANDO_PAGAMENTO" && (
                  <button
                    onClick={() => handleAdvanceStatus("PAGO")}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Confirmar Pagamento Manualmente
                  </button>
                )}
                {order.status === "PAGO" && (
                  <button
                    onClick={() => handleAdvanceStatus("EM_PRODUCAO")}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-700 text-white text-xs font-semibold hover:bg-cyan-800 transition-colors disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Iniciar Produção 3D</span>
                  </button>
                )}
                {order.status === "EM_PRODUCAO" && (
                  <button
                    onClick={() => handleAdvanceStatus("PRONTO_PARA_ENVIO")}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 transition-colors disabled:opacity-50"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Concluir Impressão & Embalar</span>
                  </button>
                )}
                {order.status === "PRONTO_PARA_ENVIO" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Código de Rastreio (ex: BR123456789BR)"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                      className="px-3 py-1.5 text-xs rounded-lg border border-border bg-surface font-mono"
                    />
                    <button
                      onClick={handleSaveTracking}
                      disabled={isDispatching}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition-colors disabled:opacity-50"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Despachar Pedido</span>
                    </button>
                  </div>
                )}
                {order.status === "ENVIADO" && (
                  <button
                    onClick={() => handleAdvanceStatus("ENTREGUE")}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar Entrega</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid Principal: Detalhes do Pedido & Logística */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda (2 cols): Itens e Anotações Internas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabela de Itens Comprados */}
          <div className="bg-surface rounded-card border border-border overflow-hidden shadow-subtle">
            <div className="px-5 py-3.5 border-b border-border bg-surface-alt/50 flex items-center justify-between">
              <h2 className="text-xs uppercase font-mono tracking-wider text-text font-bold">
                Itens Fabricados Sob Demanda ({order.items?.length || 0})
              </h2>
              <span className="text-xs text-text-muted">
                Prazo de fabricação: {order.productionDays} dias úteis
              </span>
            </div>

            <div className="divide-y divide-border">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-surface-alt/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-16 rounded-md border border-border overflow-hidden shrink-0 bg-surface-alt">
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-ink">
                        {item.productName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-text-muted">
                          Cor / Variação: {item.variantName}
                        </span>
                        {item.colorHex && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: item.colorHex }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-text-muted block mt-0.5">
                        SKU: {item.variantSku}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-ink block">
                      {formatCents(item.totalPriceCents)}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {item.quantity}x {formatCents(item.unitPriceCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo Financeiro */}
            <div className="p-4 bg-surface-alt/40 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal dos produtos</span>
                <span>{formatCents(order.subtotalCents)}</span>
              </div>
              {order.couponDiscountCents > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Cupom ({order.couponCode || "DESCONTO"})</span>
                  <span>- {formatCents(order.couponDiscountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-muted">
                <span>Frete ({order.shippingCarrier})</span>
                <span>
                  {order.isFreeShipping
                    ? "Grátis"
                    : formatCents(order.shippingPriceCents)}
                </span>
              </div>
              {order.pixDiscountAmountCents > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Desconto de 5% no Pix</span>
                  <span>- {formatCents(order.pixDiscountAmountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-ink pt-2 border-t border-border">
                <span>Total Final</span>
                <span>{formatCents(order.finalAmountCents)}</span>
              </div>
            </div>
          </div>

          {/* Anotações Internas da Equipe Markah */}
          <div className="bg-surface rounded-card border border-border p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase font-mono tracking-wider text-text font-bold">
                Anotações Internas da Produção
              </h2>
              <span className="text-[10px] text-text-muted">
                Visível apenas para administradores
              </span>
            </div>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Ex: Impressão iniciada na máquina 02 com filamento PETG Preto. Aguardando cura..."
              className="w-full p-3 text-xs rounded-lg border border-border bg-surface-alt/30 focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink placeholder:text-text-muted resize-y"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-white text-xs font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingNotes ? "Salvando..." : "Salvar Anotações"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Coluna Direita (1 col): Dados do Cliente, Entrega e Rastreamento */}
        <div className="space-y-6">
          {/* Dados do Cliente */}
          <div className="bg-surface rounded-card border border-border p-5 shadow-subtle space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-wider text-text-muted">
              Cliente
            </h2>
            <div className="space-y-1.5 text-xs text-text">
              <p className="font-bold text-ink text-sm">{order.customerName}</p>
              <p className="text-text-muted">E-mail: {order.customerEmail}</p>
              <p className="text-text-muted">Telefone: {order.customerPhone}</p>
              <p className="text-text-muted font-mono">CPF: {order.customerCpf}</p>
            </div>
          </div>

          {/* Endereço e Logística */}
          <div className="bg-surface rounded-card border border-border p-5 shadow-subtle space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-wider text-text-muted">
              Entrega & Logística
            </h2>
            <div className="text-xs space-y-1 text-text leading-relaxed">
              <p className="font-semibold text-ink">
                {order.shippingStreet}, {order.shippingNumber}{" "}
                {order.shippingComplement && `(${order.shippingComplement})`}
              </p>
              <p className="text-text-muted">
                {order.shippingNeighborhood} — {order.shippingCity}/
                {order.shippingState}
              </p>
              <p className="text-text-muted font-mono">
                CEP: {order.shippingPostalCode}
              </p>
            </div>

            <div className="pt-3 border-t border-border text-xs space-y-1">
              <p className="text-text-muted">
                <strong>Transportadora:</strong> {order.shippingCarrier}
              </p>
              <p className="text-text-muted">
                <strong>Prazo de envio:</strong> {order.carrierDays} dias úteis
              </p>
              <p className="text-text-muted">
                <strong>Prazo total (produção + frete):</strong>{" "}
                {order.totalDeliveryDays} dias úteis
              </p>
            </div>

            {/* Código de Rastreio */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider font-mono">
                  Código de Rastreamento
                </span>
                {order.trackingCode && (
                  <button
                    onClick={handleCopyTracking}
                    className="text-[11px] text-text-muted hover:text-text flex items-center gap-1"
                  >
                    {copiedTracking ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {order.trackingCode ? (
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-purple-700" />
                    <span className="font-mono font-bold text-xs text-purple-900">
                      {order.trackingCode}
                    </span>
                  </div>
                  <Link
                    href={`/rastreio?codigo=${order.orderNumber}`}
                    target="_blank"
                    className="text-purple-700 hover:text-purple-900"
                    title="Ver página pública de rastreio"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Adicionar código de rastreio"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface font-mono placeholder:text-text-muted"
                  />
                  <button
                    onClick={handleSaveTracking}
                    disabled={isDispatching}
                    className="w-full py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition-colors disabled:opacity-50"
                  >
                    Salvar e Notificar Cliente
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dados de Pagamento */}
          <div className="bg-surface rounded-card border border-border p-5 shadow-subtle space-y-2 text-xs">
            <h2 className="text-xs uppercase font-mono tracking-wider text-text-muted">
              Pagamento
            </h2>
            <div className="space-y-1">
              <p>
                <strong>Método:</strong>{" "}
                {order.paymentMethod === "PIX" ? "Pix" : "Cartão de Crédito"}
              </p>
              <p>
                <strong>Status do Pagamento:</strong>{" "}
                <span
                  className={
                    order.paymentStatus === "APPROVED"
                      ? "text-emerald-700 font-bold"
                      : "text-amber-700 font-bold"
                  }
                >
                  {order.paymentStatus}
                </span>
              </p>
              {order.paymentId && (
                <p className="font-mono text-[10px] text-text-muted">
                  ID Transação: {order.paymentId}
                </p>
              )}
              {order.cardBrand && (
                <p className="text-text-muted">
                  Bandeira: {order.cardBrand.toUpperCase()} •••• {order.cardLastFour}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
