"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  Check,
  Loader2,
  Lock,
  ArrowLeft,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCart, type ShippingOption } from "@/lib/cart-context";
import { FreeShippingBar } from "./free-shipping-bar";
import { CartItemRow } from "./cart-item-row";
import { Button, getButtonClassName } from "@/components/ui/button";
import { calculateCartTotals, formatCents } from "@/lib/pricing";
import { getShippingQuotesAction } from "@/server/shipping-actions";

export function CartPageClient() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    subtotalCents,
    selectedShipping,
    setSelectedShipping,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponError,
    isApplyingCoupon,
  } = useCart();

  const [cep, setCep] = useState("");
  const [shippingQuotes, setShippingQuotes] = useState<ShippingOption[]>([]);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isPendingShipping, startShippingTransition] = useTransition();

  // Seção de cupom recolhível na página (PRD §7.1)
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");

  const shippingCostCents = selectedShipping ? selectedShipping.priceCents : 0;
  const totals = calculateCartTotals({
    items: items.map((i) => ({ priceCents: i.priceCents, quantity: i.quantity })),
    shippingPriceCents: shippingCostCents,
    coupon: appliedCoupon,
  });

  // Revalida frete grátis se o subtotal mudar
  useEffect(() => {
    if (shippingQuotes.length > 0) {
      const isFreeQualified =
        totals.isFreeShippingQualified || totals.discountedSubtotalCents >= 20000;
      setShippingQuotes((prev) =>
        prev.map((quote, index) => {
          const isFree = isFreeQualified && index === 0;
          const priceCents = isFree ? 0 : quote.originalPriceCents;
          return {
            ...quote,
            priceCents,
            isFree,
          };
        })
      );
    }
  }, [totals.discountedSubtotalCents, totals.isFreeShippingQualified, shippingQuotes.length]);

  function handleCalculateShipping(e: React.FormEvent) {
    e.preventDefault();
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setShippingError("Digite um CEP válido com 8 números.");
      return;
    }

    setShippingError(null);
    startShippingTransition(async () => {
      const itemsInput = items.map((i) => ({
        weightGrams: i.weightGrams,
        packageHeightCm: i.packageHeightCm,
        packageWidthCm: i.packageWidthCm,
        packageDepthCm: i.packageDepthCm,
        priceCents: i.priceCents,
        quantity: i.quantity,
      }));

      const res = await getShippingQuotesAction(cleanCep, itemsInput);
      if (res.success && res.quotes) {
        const isFreeQualified =
          totals.isFreeShippingQualified || totals.discountedSubtotalCents >= 20000;

        const mapped: ShippingOption[] = res.quotes.map((q, index) => {
          const isFree = (isFreeQualified && index === 0) || q.isFree;
          return {
            id: q.id,
            name: q.name,
            company: q.company,
            priceCents: isFree ? 0 : q.originalPriceCents,
            originalPriceCents: q.originalPriceCents,
            carrierDays: q.carrierDays,
            productionDays: q.productionDays,
            totalDays: q.totalDays,
            isFree,
          };
        });
        setShippingQuotes(mapped);
        if (!selectedShipping || !mapped.some((m) => m.id === selectedShipping.id)) {
          setSelectedShipping(mapped[0] || null);
        }
      } else {
        setShippingError(res.error || "Não foi possível calcular o frete.");
      }
    });
  }

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    const res = await applyCoupon(couponCodeInput);
    if (res.success) {
      setCouponCodeInput("");
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-surface-alt flex items-center justify-center mx-auto text-text-muted">
            <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink">
              Seu carrinho está vazio
            </h1>
            <p className="text-sm text-text-muted">
              Você ainda não adicionou nenhuma luminária, vaso ou peça de design ao seu carrinho.
            </p>
          </div>
          <Link
            href="/produtos"
            className={getButtonClassName({
              variant: "primary",
              size: "lg",
              className: "gap-2",
            })}
          >
            <span>Explorar Peças de Design</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Título e Ação de Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink">
            Meu Carrinho
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Revise seus produtos, calcule o frete e prossiga para o pagamento seguro
          </p>
        </div>
        <Link
          href="/produtos"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-text hover:text-magenta transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continuar Comprando</span>
        </Link>
      </div>

      {/* Grid Principal: 8 Colunas Lista + 4 Colunas Resumo */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Coluna Esquerda: Itens e Frete */}
        <div className="lg:col-span-8 space-y-6">
          {/* Barra de Frete Grátis com gradiente da marca */}
          <FreeShippingBar
            subtotalCents={totals.discountedSubtotalCents}
            thresholdCents={20000}
          />

          {/* Lista de Itens do Carrinho */}
          <div className="bg-surface rounded-card border border-border divide-y divide-border p-5 shadow-xs">
            <div className="flex justify-between items-center pb-3 text-xs text-text-muted">
              <span>Produto</span>
              <button
                type="button"
                onClick={clearCart}
                className="min-h-11 px-2 text-xs text-text-muted hover:text-red-600 transition-colors"
              >
                Esvaziar carrinho
              </button>
            </div>

            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Bloco de Simulação de Frete */}
          <div className="bg-surface rounded-card border border-border p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink font-display">
              <Truck className="w-4 h-4 text-laranja" />
              <span>Calcular Frete e Prazo de Entrega</span>
            </div>
            <p className="text-xs text-text-muted">
              Prazos transparentes que somam nossos <strong>3 dias úteis de produção sob demanda</strong> com a entrega da transportadora.
            </p>

            <form onSubmit={handleCalculateShipping} className="flex gap-2 max-w-sm">
              <label htmlFor="cart-shipping-cep" className="sr-only">CEP para calcular frete e prazo</label>
              <input
                id="cart-shipping-cep"
                type="text"
                value={cep}
                onChange={(e) =>
                  setCep(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                placeholder="Digite seu CEP (ex: 01001000)"
                maxLength={8}
                inputMode="numeric"
                autoComplete="postal-code"
                className="min-w-0 min-h-11 flex-1 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink font-mono"
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={isPendingShipping}
                className="min-h-11 px-4 text-sm font-semibold"
              >
                {isPendingShipping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Calcular"
                )}
              </Button>
            </form>

            {shippingError && (
              <p className="text-xs text-red-500 font-medium">
                {shippingError}
              </p>
            )}

            {/* Opções Retornadas de Frete */}
            {shippingQuotes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {shippingQuotes.map((quote) => {
                  const isSelected = selectedShipping?.id === quote.id;
                  return (
                    <button
                      key={quote.id}
                      type="button"
                      onClick={() => setSelectedShipping(quote)}
                      className={`text-left p-3.5 rounded-lg border text-xs transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "border-ink bg-surface-alt font-semibold shadow-xs"
                          : "border-border hover:border-border/80 bg-surface"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                            isSelected
                              ? "bg-ink border-ink text-white"
                              : "border-border"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-ink">
                              {quote.name}
                            </span>
                            {quote.isFree && (
                              <span className="text-[10px] font-bold text-verde bg-verde/10 px-1.5 py-0.2 rounded-full uppercase">
                                Frete Grátis
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Produção ({quote.productionDays}d) + Entrega ({quote.carrierDays}d) ={" "}
                            <strong className="text-text font-bold">
                              {quote.totalDays} dias úteis
                            </strong>
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-xs shrink-0 font-mono">
                        {quote.isFree ? (
                          <span className="text-verde">Grátis</span>
                        ) : (
                          formatCents(quote.priceCents)
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Resumo Financeiro */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-surface rounded-card border border-border p-6 space-y-5 shadow-xs">
            <h2 className="text-base font-bold font-display text-ink border-b border-border pb-3">
              Resumo do Pedido
            </h2>

            {/* Bloco de Cupom de Desconto */}
            <div className="pb-3 border-b border-border">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-verde/10 border border-verde/20 text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-verde" />
                    <div>
                      <div className="font-bold text-verde flex items-center gap-1.5 font-mono">
                        <span>{appliedCoupon.code}</span>
                        <span className="text-[10px] bg-verde text-white px-1.5 py-0.2 rounded-full uppercase">
                          Aplicado
                        </span>
                      </div>
                      {appliedCoupon.description && (
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {appliedCoupon.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remover cupom"
                    className="flex h-11 w-11 items-center justify-center text-text-muted hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsCouponOpen(!isCouponOpen)}
                    className="w-full min-h-11 flex items-center justify-between text-xs font-semibold text-text hover:text-ink transition-colors py-1"
                  >
                    <span className="flex items-center gap-2 font-mono uppercase tracking-wider text-[11px]">
                      <Tag className="w-3.5 h-3.5 text-text-muted" />
                      <span>Possui cupom de desconto?</span>
                    </span>
                    {isCouponOpen ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </button>

                  {isCouponOpen && (
                    <form
                      onSubmit={handleApplyCoupon}
                      className="pt-2 flex gap-2 animate-in fade-in duration-200"
                    >
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        placeholder="Ex: BEMVINDO10"
                        className="min-w-0 min-h-11 flex-1 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink font-mono uppercase"
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={isApplyingCoupon || !couponCodeInput.trim()}
                        className="min-h-11 px-3 text-sm"
                      >
                        {isApplyingCoupon ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Aplicar"
                        )}
                      </Button>
                    </form>
                  )}

                  {couponError && (
                    <p className="text-xs text-red-500 font-medium pt-1">
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2.5 text-xs text-text">
              <div className="flex justify-between">
                <span className="text-text-muted">
                  Subtotal ({totalItems} {totalItems === 1 ? "item" : "itens"})
                </span>
                <span className="font-mono font-medium">
                  {formatCents(subtotalCents)}
                </span>
              </div>

              {/* Linha de Cupom de Desconto */}
              {totals.couponDiscountCents > 0 && (
                <div className="flex justify-between text-verde">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Cupom ({appliedCoupon?.code})</span>
                  </span>
                  <span className="font-mono font-semibold">
                    {totals.formatted.couponDiscount}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-text-muted">Frete</span>
                <span className="font-mono font-medium">
                  {selectedShipping ? (
                    selectedShipping.isFree ? (
                      <span className="text-verde font-semibold">Grátis</span>
                    ) : (
                      formatCents(selectedShipping.priceCents)
                    )
                  ) : (
                    <span className="text-text-muted text-[11px]">
                      A calcular
                    </span>
                  )}
                </span>
              </div>

              {/* Total Geral com Destaque Pix */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-ink">Total</span>
                  <span className="text-lg font-bold text-ink font-mono">
                    {formatCents(totals.totalCents)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-verde/5 border border-verde/20 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-verde">
                      À vista no Pix (5% OFF):
                    </span>
                    <span className="font-bold text-verde text-sm font-mono">
                      {formatCents(totals.pixTotalCents)}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted">
                    Economia de {formatCents(totals.pixDiscountAmountCents)} exclusiva no Pix.
                  </p>
                </div>

                <div className="text-right text-xs text-text-muted">
                  ou até {totals.formatted.installments}
                </div>
              </div>
            </div>

            {/* Botão de Finalização */}
            <div className="space-y-2 pt-2">
              <Link
                href="/checkout"
                className={getButtonClassName({
                  variant: "primary",
                  size: "lg",
                  className: "w-full gap-2 text-sm font-semibold shadow-md group py-6",
                })}
              >
                <Lock className="w-4 h-4" />
                <span>Finalizar Compra</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 ml-auto" />
              </Link>

              <p className="text-[11px] text-center text-text-muted flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-verde" />
                <span>Ambiente Seguro com Criptografia SSL</span>
              </p>
            </div>
          </div>

          {/* Destaques de Confiança */}
          <div className="p-4 rounded-lg bg-surface-alt/60 border border-border text-xs text-text-muted space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-verde" />
              <span>Produção sob demanda em até 3 dias úteis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-verde" />
              <span>Garantia de 90 dias contra defeitos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-verde" />
              <span>Peças impressas em PLA e PETG ecológicos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
