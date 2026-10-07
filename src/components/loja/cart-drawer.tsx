"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  ArrowRight,
  Truck,
  Check,
  Loader2,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCart, type ShippingOption } from "@/lib/cart-context";
import { FreeShippingBar } from "./free-shipping-bar";
import { CartItemRow } from "./cart-item-row";
import { Button, getButtonClassName } from "@/components/ui/button";
import { calculateCartTotals, formatCents } from "@/lib/pricing";
import { getShippingQuotesAction } from "@/server/shipping-actions";

export function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
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

  // Seção de cupom recolhível (PRD §7.1)
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");

  // Fecha no Escape e trava o scroll da página
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    }

    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  const shippingCostCents = selectedShipping ? selectedShipping.priceCents : 0;
  const totals = calculateCartTotals({
    items: items.map((i) => ({ priceCents: i.priceCents, quantity: i.quantity })),
    shippingPriceCents: shippingCostCents,
    coupon: appliedCoupon,
  });

  // Se o subtotal mudar e já tínhamos cotações, revalida se ganhou frete grátis (PRD §5.2)
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
        // Seleciona automaticamente a opção mais barata se nenhuma selecionada
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

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop com desfoque e escurecimento */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Carrinho de compras"
          className="w-screen max-w-md bg-surface text-ink flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 border-l border-border"
        >
          {/* Header da Gaveta */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-ink" />
              <h2 className="font-display font-bold text-lg text-ink">
                Meu Carrinho
              </h2>
              {totalItems > 0 && (
                <span className="text-xs font-mono font-semibold bg-surface-alt px-2 py-0.5 rounded-full text-text-muted">
                  {totalItems} {totalItems === 1 ? "item" : "itens"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Fechar carrinho"
              className="h-11 w-11 inline-flex items-center justify-center text-text-muted hover:text-ink hover:bg-surface-alt rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo do Carrinho */}
          {items.length === 0 ? (
            /* Estado Vazio */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center text-text-muted">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-ink">
                  Seu carrinho está vazio
                </h3>
                <p className="text-xs text-text-muted max-w-[240px]">
                  Descubra peças de design exclusivas impressas em 3D para sua casa ou escritório.
                </p>
              </div>
              <Link
                href="/produtos"
                onClick={closeDrawer}
                className={getButtonClassName({ variant: "primary", size: "default" })}
              >
                Explorar Catálogo
              </Link>
            </div>
          ) : (
            /* Estado com Itens */
            <>
              {/* Barra de Frete Grátis com Gradiente */}
              <div className="p-4 border-b border-border bg-surface-alt/40">
                <FreeShippingBar
                  subtotalCents={totals.discountedSubtotalCents}
                  thresholdCents={20000}
                />
              </div>

              {/* Lista rolável de itens */}
              <div className="flex-1 overflow-y-auto px-5 divide-y divide-border">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    onItemClick={closeDrawer}
                  />
                ))}

                {/* Bloco de Cupom de Desconto Recolhível (PRD §7.1) */}
                <div className="py-4 border-b border-border space-y-2.5">
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
                        className="h-11 w-11 inline-flex items-center justify-center text-text-muted hover:text-red-600 transition-colors rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setIsCouponOpen(!isCouponOpen)}
                        className="w-full min-h-11 flex items-center justify-between text-xs font-semibold text-text hover:text-ink transition-colors"
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
                            className="min-w-0 flex-1 min-h-11 px-3 rounded-input border border-border text-base md:text-xs focus:outline-none focus:border-ink font-mono uppercase"
                          />
                          <Button
                            type="submit"
                            variant="secondary"
                            size="sm"
                            disabled={isApplyingCoupon || !couponCodeInput.trim()}
                            className="min-h-11 px-3 text-xs"
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

                {/* Simulador de Frete na Gaveta */}
                <div className="py-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text uppercase tracking-wider font-mono">
                    <Truck className="w-4 h-4 text-laranja" />
                    <span>Calcular Frete e Prazo</span>
                  </div>

                  <form onSubmit={handleCalculateShipping} className="flex gap-2">
                    <input
                      type="text"
                      value={cep}
                      onChange={(e) =>
                        setCep(e.target.value.replace(/\D/g, "").slice(0, 8))
                      }
                      placeholder="CEP (ex: 01001000)"
                      maxLength={8}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      className="min-w-0 flex-1 min-h-11 px-3 rounded-input border border-border text-base md:text-xs focus:outline-none focus:border-ink font-mono"
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      disabled={isPendingShipping}
                      className="min-h-11 px-3 text-xs"
                    >
                      {isPendingShipping ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

                  {/* Lista de Opções de Frete */}
                  {shippingQuotes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {shippingQuotes.map((quote) => {
                        const isSelected = selectedShipping?.id === quote.id;
                        return (
                          <button
                            key={quote.id}
                            type="button"
                            onClick={() => setSelectedShipping(quote)}
                            className={`w-full min-h-11 text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? "border-ink bg-surface-alt font-semibold shadow-xs"
                                : "border-border hover:border-border/80 bg-surface"
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <div
                                className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                                  isSelected
                                    ? "bg-ink border-ink text-white"
                                    : "border-border"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <div className="min-w-0">
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

              {/* Rodapé Financeiro e Botão de Finalização */}
              <div className="p-5 border-t border-border bg-surface space-y-3 shadow-lg">
                <div className="space-y-1.5 text-xs text-text">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Subtotal dos produtos</span>
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
                          Calcular acima
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Total com Destaque Pix */}
                  <div className="pt-2 border-t border-border flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-bold text-ink">Total</span>
                      <p className="text-[11px] text-verde font-semibold">
                        À vista no Pix com 5% OFF:{" "}
                        <strong className="font-mono">
                          {formatCents(totals.pixTotalCents)}
                        </strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-ink font-mono">
                        {formatCents(totals.totalCents)}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        ou {totals.formatted.installments}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="space-y-2 pt-1">
                  <Link
                    href="/carrinho"
                    onClick={closeDrawer}
                    className={getButtonClassName({
                      variant: "primary",
                      size: "lg",
                      className: "w-full gap-2 text-sm font-semibold shadow-md group py-3",
                    })}
                  >
                    <span>Finalizar Compra</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 ml-auto" />
                  </Link>

                  <div className="text-center">
                    <Link
                      href="/carrinho"
                      onClick={closeDrawer}
                      className="text-xs text-text-muted hover:text-ink transition-colors underline-offset-4 hover:underline"
                    >
                      Ver detalhes do carrinho
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
