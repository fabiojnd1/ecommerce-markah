"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Tag,
  PlusCircle,
  Percent,
  Truck,
  DollarSign,
  Trash2,
  Edit2,
  X,
  Sliders,
} from "lucide-react";
import { formatCents } from "@/lib/pricing";
import {
  saveCouponAction,
  toggleCouponAction,
  deleteCouponAction,
} from "@/server/promotions-actions";
import type { CouponRecord, SaveCouponInput } from "@/lib/promotions-repository";
import { type CouponDiscountType } from "@prisma/client";

interface PromotionsManagementViewProps {
  initialCoupons: CouponRecord[];
}

export function PromotionsManagementView({
  initialCoupons,
}: PromotionsManagementViewProps) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<CouponRecord[]>(initialCoupons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRecord | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponDiscountType>("PERCENTAGE");
  const [valueInput, setValueInput] = useState("10"); // "10" para 10% ou "20.00" para R$ 20
  const [description, setDescription] = useState("");
  const [minOrderReais, setMinOrderReais] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [isPixCumulative, setIsPixCumulative] = useState(true);
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function openCreateModal() {
    setEditingCoupon(null);
    setCode("");
    setType("PERCENTAGE");
    setValueInput("10");
    setDescription("");
    setMinOrderReais("");
    setUsageLimit("");
    setIsPixCumulative(true);
    setActive(true);
    setFeedback(null);
    setIsModalOpen(true);
  }

  function openEditModal(coupon: CouponRecord) {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValueInput(
      coupon.type === "FIXED"
        ? (coupon.value / 100).toFixed(2)
        : String(coupon.value)
    );
    setDescription(coupon.description || "");
    setMinOrderReais(
      coupon.minOrderCents ? (coupon.minOrderCents / 100).toFixed(2) : ""
    );
    setUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : "");
    setIsPixCumulative(coupon.isPixCumulative);
    setActive(coupon.active);
    setFeedback(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    let parsedValue = 0;
    if (type === "PERCENTAGE") {
      parsedValue = parseInt(valueInput, 10);
      if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 100) {
        setFeedback({
          type: "error",
          text: "A porcentagem deve estar entre 1% e 100%.",
        });
        setLoading(false);
        return;
      }
    } else if (type === "FIXED") {
      const reais = parseFloat(valueInput.replace(",", "."));
      if (isNaN(reais) || reais <= 0) {
        setFeedback({
          type: "error",
          text: "Informe um valor monetário válido em Reais.",
        });
        setLoading(false);
        return;
      }
      parsedValue = Math.round(reais * 100);
    } else {
      parsedValue = 0; // FREE_SHIPPING
    }

    const minOrderCents = minOrderReais.trim()
      ? Math.round(parseFloat(minOrderReais.replace(",", ".")) * 100)
      : null;

    const payload: SaveCouponInput = {
      id: editingCoupon?.id,
      code: code.trim().toUpperCase(),
      type,
      value: parsedValue,
      description: description.trim() || null,
      minOrderCents,
      usageLimit: usageLimit.trim() ? parseInt(usageLimit, 10) : null,
      isPixCumulative,
      active,
    };

    const res = await saveCouponAction(payload);
    setLoading(false);

    if (res.success && res.coupon) {
      if (editingCoupon) {
        setCoupons(coupons.map((c) => (c.id === res.coupon!.id ? res.coupon! : c)));
      } else {
        setCoupons([res.coupon, ...coupons]);
      }
      setIsModalOpen(false);
      router.refresh();
    } else {
      setFeedback({
        type: "error",
        text: res.error || "Erro ao salvar cupom.",
      });
    }
  }

  async function handleToggle(coupon: CouponRecord) {
    const nextState = !coupon.active;
    const res = await toggleCouponAction(coupon.id, nextState);
    if (res.success && res.coupon) {
      setCoupons(coupons.map((c) => (c.id === coupon.id ? res.coupon! : c)));
    }
  }

  async function handleDelete(coupon: CouponRecord) {
    if (!confirm(`Deseja realmente excluir o cupom "${coupon.code}"?`)) return;
    const res = await deleteCouponAction(coupon.id);
    if (res.success) {
      setCoupons(coupons.filter((c) => c.id !== coupon.id));
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">
            Promoções & Cupons
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Gestão de campanhas de desconto, cupons dinâmicos e precificação promocional
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-subtle"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Criar Cupom</span>
        </button>
      </div>

      {/* Cards de Parâmetros Comerciais Globais (PRD §5.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-card border border-border p-4 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-text-muted tracking-wider block">
                Desconto Pix
              </span>
              <span className="text-lg font-bold text-emerald-800">5% OFF</span>
            </div>
          </div>
          <Link
            href="/admin/configuracoes"
            className="text-xs text-text-muted hover:text-ink flex items-center gap-1 font-medium"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurar</span>
          </Link>
        </div>

        <div className="bg-surface rounded-card border border-border p-4 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-text-muted tracking-wider block">
                Parcelamento Sem Juros
              </span>
              <span className="text-lg font-bold text-blue-800">Até 3x</span>
            </div>
          </div>
          <Link
            href="/admin/configuracoes"
            className="text-xs text-text-muted hover:text-ink flex items-center gap-1 font-medium"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurar</span>
          </Link>
        </div>

        <div className="bg-surface rounded-card border border-border p-4 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-text-muted tracking-wider block">
                Frete Grátis Nacional
              </span>
              <span className="text-lg font-bold text-purple-800">A partir de R$ 200</span>
            </div>
          </div>
          <Link
            href="/admin/configuracoes"
            className="text-xs text-text-muted hover:text-ink flex items-center gap-1 font-medium"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurar</span>
          </Link>
        </div>
      </div>

      {/* Tabela de Cupons Cadastrados */}
      <div className="bg-surface rounded-card border border-border overflow-hidden shadow-subtle">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-alt/40">
          <div>
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
              Cupons Ativos & Campanhas ({coupons.length})
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              Cupons validados em tempo real no carrinho e no checkout
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-alt/70 text-text-muted border-b border-border uppercase font-mono tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Desconto</th>
                <th className="py-3.5 px-4">Pedido Mínimo</th>
                <th className="py-3.5 px-4">Utilizações</th>
                <th className="py-3.5 px-4">Regra Pix</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-text-muted/60" />
                    <p className="font-medium">Nenhum cupom cadastrado ainda</p>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-surface-alt/40 transition-colors"
                    >
                      {/* Código */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-ink text-xs px-2 py-0.5 rounded bg-surface-alt border border-border">
                            {coupon.code}
                          </span>
                        </div>
                        {coupon.description && (
                          <span className="text-[10px] text-text-muted block mt-1 line-clamp-1 max-w-xs">
                            {coupon.description}
                          </span>
                        )}
                      </td>

                      {/* Desconto */}
                      <td className="py-3.5 px-4 font-semibold">
                        {coupon.type === "PERCENTAGE" && (
                          <span className="text-emerald-700 font-bold">
                            {coupon.value}% OFF
                          </span>
                        )}
                        {coupon.type === "FIXED" && (
                          <span className="text-emerald-700 font-bold">
                            {formatCents(coupon.value)} OFF
                          </span>
                        )}
                        {coupon.type === "FREE_SHIPPING" && (
                          <span className="text-purple-700 font-bold">
                            Frete Grátis
                          </span>
                        )}
                      </td>

                      {/* Pedido Mínimo */}
                      <td className="py-3.5 px-4 text-text-muted">
                        {coupon.minOrderCents
                          ? formatCents(coupon.minOrderCents)
                          : "Sem mínimo"}
                      </td>

                      {/* Utilizações */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium">
                          {coupon.usageCount}
                        </span>
                        {coupon.usageLimit && (
                          <span className="text-text-muted text-[10px]">
                            {" "}
                            / {coupon.usageLimit}
                          </span>
                        )}
                      </td>

                      {/* Regra Pix */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {coupon.isPixCumulative ? (
                          <span className="text-emerald-700 font-medium">
                            + 5% no Pix
                          </span>
                        ) : (
                          <span className="text-text-muted">
                            Não acumula Pix
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggle(coupon)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                            coupon.active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                              : "bg-neutral-100 text-neutral-500 border border-neutral-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              coupon.active ? "bg-emerald-500" : "bg-neutral-400"
                            }`}
                          />
                          <span>{coupon.active ? "Ativo" : "Pausado"}</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 text-text-muted hover:text-ink hover:bg-surface-alt rounded transition-colors"
                            title="Editar cupom"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir cupom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Cupom */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-card border border-border w-full max-w-lg p-6 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-ink font-display">
                {editingCoupon ? "Editar Cupom" : "Novo Cupom de Desconto"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && (
              <p
                className={`p-2.5 rounded-lg text-xs font-medium ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {feedback.text}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">
                    Código do Cupom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MARKAH15"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface font-mono uppercase focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">
                    Tipo de Desconto
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CouponDiscountType)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-ink"
                  >
                    <option value="PERCENTAGE">Porcentagem (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                    <option value="FREE_SHIPPING">Frete Grátis</option>
                  </select>
                </div>
              </div>

              {type !== "FREE_SHIPPING" && (
                <div>
                  <label className="block font-semibold text-text mb-1">
                    {type === "PERCENTAGE"
                      ? "Percentual de Desconto (%) *"
                      : "Valor do Desconto (R$) *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={type === "PERCENTAGE" ? "15" : "25.00"}
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">
                    Pedido Mínimo (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 150.00"
                    value={minOrderReais}
                    onChange={(e) => setMinOrderReais(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">
                    Limite Total de Usos
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 100 (opcional)"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">
                  Descrição Interna
                </label>
                <input
                  type="text"
                  placeholder="Ex: Campanha de Primavera ou Primeira Compra"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-ink"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPixCumulative}
                    onChange={(e) => setIsPixCumulative(e.target.checked)}
                    className="rounded text-ink focus:ring-ink"
                  />
                  <span>
                    Cumulativo com o desconto de 5% no Pix (Recomendado)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-ink focus:ring-ink"
                  />
                  <span>Cupom ativo imediatamente</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-text hover:bg-surface-alt transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-ink text-white font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar Cupom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
