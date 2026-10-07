"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  User,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useCart, type ShippingOption } from "@/lib/cart-context";
import { calculateCartTotals, formatCents } from "@/lib/pricing";
import { getShippingQuotesAction } from "@/server/shipping-actions";
import { createOrderAction } from "@/server/checkout-actions";
import { Button } from "@/components/ui/button";
import {
  MercadoPagoCardBrick,
  type MercadoPagoCardBrickHandle,
} from "./mercadopago-card-brick";

export function CheckoutForm() {
  const router = useRouter();
  const {
    items,
    clearCart,
    subtotalCents,
    selectedShipping,
    setSelectedShipping,
    appliedCoupon,
  } = useCart();

  // 1. Identificação do Cliente
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");

  // 2. Endereço de Entrega
  const [postalCode, setPostalCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // 3. Frete
  const [shippingQuotes, setShippingQuotes] = useState<ShippingOption[]>([]);
  const [isPendingShipping, startShippingTransition] = useTransition();

  // 4. Pagamento
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  // Dados do cartão ficam dentro do Card Payment Brick do Mercado Pago (D-006)
  const cardBrickRef = useRef<MercadoPagoCardBrickHandle>(null);

  // 5. Estado de Submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Máscaras de entrada
  function maskCpf(val: string) {
    return val
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function maskPhone(val: string) {
    return val
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2");
  }

  function maskCep(val: string) {
    return val
      .replace(/\D/g, "")
      .slice(0, 8)
      .replace(/(\d{5})(\d{3})$/, "$1-$2");
  }

  // Busca automática do CEP via ViaCEP
  async function handleCepLookup(cleanCep: string) {
    if (cleanCep.length !== 8) return;
    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || "");
          setNeighborhood(data.bairro || "");
          setCity(data.localidade || "");
          setState(data.uf || "SP");
        }
      }
    } catch {
      // Ignora erro de rede ViaCEP
    } finally {
      setIsLoadingCep(false);
    }

    // Calcula opções de frete para o CEP informado
    if (items.length > 0) {
      startShippingTransition(async () => {
        const shippingItems = items.map((i) => ({
          weightGrams: i.weightGrams,
          packageHeightCm: i.packageHeightCm,
          packageWidthCm: i.packageWidthCm,
          packageDepthCm: i.packageDepthCm,
          priceCents: i.priceCents,
          quantity: i.quantity,
        }));

        const res = await getShippingQuotesAction(cleanCep, shippingItems);
        if (res.success && res.quotes) {
          const mapped: ShippingOption[] = res.quotes.map((q) => ({
            id: q.id,
            name: q.name,
            company: q.company,
            priceCents: q.priceCents,
            originalPriceCents: q.originalPriceCents,
            carrierDays: q.carrierDays,
            productionDays: q.productionDays,
            totalDays: q.totalDays,
            isFree: q.isFree,
          }));
          setShippingQuotes(mapped);
          if (!selectedShipping || !mapped.some((m) => m.id === selectedShipping.id)) {
            setSelectedShipping(mapped[0] || null);
          }
        }
      });
    }
  }

  // Mesma regra do servidor: preço cheio da transportadora + frete grátis na opção mais barata
  const shippingCostCents = selectedShipping
    ? selectedShipping.originalPriceCents ?? selectedShipping.priceCents
    : 0;
  const cheapestShippingCents =
    shippingQuotes.length > 0
      ? Math.min(...shippingQuotes.map((q) => q.originalPriceCents ?? q.priceCents))
      : shippingCostCents;
  const totals = calculateCartTotals({
    items: items.map((i) => ({ priceCents: i.priceCents, quantity: i.quantity })),
    shippingPriceCents: shippingCostCents,
    cheapestShippingPriceCents: cheapestShippingCents,
    coupon: appliedCoupon,
  });

  const finalAmountToDisplay =
    paymentMethod === "PIX" ? totals.pixTotalCents : totals.totalCents;

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // Validações básicas no cliente antes do envio
    if (!customerName.trim() || !customerEmail.trim()) {
      setSubmitError("Informe seu nome completo e e-mail.");
      return;
    }
    if (customerCpf.replace(/\D/g, "").length !== 11) {
      setSubmitError("Digite um CPF válido com 11 números.");
      return;
    }
    if (postalCode.replace(/\D/g, "").length !== 8) {
      setSubmitError("Digite um CEP de entrega válido.");
      return;
    }
    if (!street.trim() || !number.trim()) {
      setSubmitError("Informe a rua e número do endereço de entrega.");
      return;
    }
    if (!selectedShipping) {
      setSubmitError("Selecione uma opção de frete para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      let cardData: Awaited<ReturnType<MercadoPagoCardBrickHandle["getCardData"]>> | undefined;
      if (paymentMethod === "CREDIT_CARD") {
        try {
          const brick = cardBrickRef.current;
          if (!brick) throw new Error("Formulário do cartão indisponível.");
          cardData = await brick.getCardData();
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : "Confira os dados do cartão.");
          return;
        }
      }

      const payload = {
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          cpf: customerCpf,
        },
        shippingAddress: {
          postalCode: postalCode.replace(/\D/g, ""),
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
        },
        shippingOptionId: selectedShipping.id,
        paymentMethod,
        cardData,
        items: items.map((i) => ({ variantId: i.id, quantity: i.quantity })),
        couponCode: appliedCoupon?.code || null,
      };

      const res = await createOrderAction(payload);

      if (res.success && res.orderId) {
        // Limpa o carrinho após a criação bem-sucedida do pedido
        clearCart();
        // Redireciona para a tela de confirmação / sucesso
        router.push(`/checkout/sucesso/${res.orderId}`);
      } else {
        setSubmitError(res.error || "Não foi possível finalizar o pedido.");
      }
    } catch {
      setSubmitError("Ocorreu um erro inesperado ao processar o checkout.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold font-display text-ink">
          Seu carrinho está vazio
        </h2>
        <p className="text-xs text-text-muted">
          Adicione itens ao seu carrinho antes de prosseguir para o checkout.
        </p>
        <Link
          href="/produtos"
          className="inline-block py-2.5 px-6 rounded-full bg-ink text-white text-xs font-semibold"
        >
          Explorar Peças de Design
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div aria-label="Etapas da compra" className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
        {[
          { number: "1", label: "Identificação" },
          { number: "2", label: "Entrega" },
          { number: "3", label: "Pagamento" },
        ].map((step, index) => (
          <div key={step.number} className="relative flex min-w-0 flex-col items-start gap-1.5 border-b-2 border-border pb-3 sm:flex-row sm:items-center sm:gap-3">
            {index === 0 && <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-magenta" />}
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-ink text-white" : "bg-surface-alt text-text-muted"}`}>{step.number}</span>
            <span className={`text-[10px] leading-tight font-semibold sm:text-sm ${index === 0 ? "text-ink" : "text-text-muted"}`}>{step.label}</span>
          </div>
        ))}
      </div>

      <details className="mb-6 rounded-card border border-border bg-surface p-4 shadow-xs lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-semibold text-ink">Resumo da compra · {items.length} {items.length === 1 ? "item" : "itens"}</span>
            <span className="mt-1 block text-xs text-text-muted">Toque para revisar os produtos e valores</span>
          </span>
          <span className="flex items-center gap-2">
            <strong className="font-display text-base text-ink">{formatCents(finalAmountToDisplay)}</strong>
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </span>
        </summary>
        <div className="mt-4 space-y-3 border-t border-border pt-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-text">{item.productName} · {item.quantity} un.</span>
              <span className="shrink-0 font-medium text-ink">{formatCents(item.priceCents * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3 text-xs text-text-muted">
            <span>Subtotal</span><span>{formatCents(subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>Frete</span><span>{selectedShipping ? (selectedShipping.isFree ? "Grátis" : formatCents(selectedShipping.priceCents)) : "A calcular"}</span>
          </div>
          {paymentMethod === "PIX" && (
            <div className="flex justify-between text-xs font-medium text-verde">
              <span>Desconto Pix</span><span>−{formatCents(totals.pixDiscountAmountCents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold text-ink">
            <span>Total</span><span>{formatCents(finalAmountToDisplay)}</span>
          </div>
        </div>
      </details>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Coluna Esquerda (7 Colunas): Etapas do Formulário */}
        <div className="lg:col-span-7 lg:order-1 space-y-6">
          {/* Mensagem de Erro de Submissão */}
          {submitError && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Etapa 1: Dados Pessoais */}
          <div className="bg-surface rounded-card border border-border p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <User className="w-4 h-4 text-magenta" />
              <h2 className="text-base font-bold font-display text-ink">
                1. Identificação
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-text-muted font-medium mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome e Sobrenome"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  autoComplete="tel"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">
                  CPF *
                </label>
                <input
                  type="text"
                  required
                  value={customerCpf}
                  onChange={(e) => setCustomerCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink font-mono"
                />
              </div>
            </div>
          </div>

          {/* Etapa 2: Endereço de Entrega */}
          <div className="bg-surface rounded-card border border-border p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <MapPin className="w-4 h-4 text-laranja" />
              <h2 className="text-base font-bold font-display text-ink">
                2. Endereço de Entrega
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
              <div className="sm:col-span-3">
                <label className="block text-text-muted font-medium mb-1">
                  CEP *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => {
                      const formatted = maskCep(e.target.value);
                      setPostalCode(formatted);
                      const clean = formatted.replace(/\D/g, "");
                      if (clean.length === 8) {
                        handleCepLookup(clean);
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink font-mono"
                  />
                  {isLoadingCep && (
                    <Loader2 className="w-4 h-4 text-text-muted animate-spin absolute right-3 top-3" />
                  )}
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-text-muted font-medium mb-1">
                  Rua / Logradouro *
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Ex: Av. Paulista"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-text-muted font-medium mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="123"
                  inputMode="numeric"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-text-muted font-medium mb-1">
                  Complemento (Opcional)
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto 42, Bloco B"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-text-muted font-medium mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-text-muted font-medium mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-text-muted font-medium mb-1">
                  Estado (UF) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="w-full min-h-11 px-3 rounded-input border border-border text-base md:text-sm focus:outline-none focus:border-ink uppercase font-mono"
                />
              </div>
            </div>

            {/* Opções de Envio Selecionadas */}
            {isPendingShipping && (
              <div className="pt-2 flex items-center gap-2 text-xs text-text-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-laranja" />
                <span>Calculando opções de frete...</span>
              </div>
            )}

            {shippingQuotes.length > 0 && (
              <div className="pt-3 border-t border-border space-y-2">
                <label className="block text-xs font-semibold text-text uppercase tracking-wider font-mono">
                  Opções de Envio Disponíveis
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {shippingQuotes.map((quote) => {
                    const isSelected = selectedShipping?.id === quote.id;
                    return (
                      <button
                        key={quote.id}
                        type="button"
                        onClick={() => setSelectedShipping(quote)}
                        className={`text-left p-3 rounded-lg border text-xs transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? "border-ink bg-surface-alt font-semibold shadow-xs"
                            : "border-border hover:border-border/80 bg-surface"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-ink">{quote.name}</span>
                            {quote.isFree && (
                              <span className="text-[10px] font-bold text-verde bg-verde/10 px-1.5 py-0.2 rounded-full uppercase">
                                Grátis
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Produção (3d) + Entrega ({quote.carrierDays}d) = <strong>{quote.totalDays} dias úteis</strong>
                          </p>
                        </div>
                        <span className="font-bold text-xs font-mono shrink-0">
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
              </div>
            )}
          </div>

          {/* Etapa 3: Forma de Pagamento */}
          <div className="bg-surface rounded-card border border-border p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <CreditCard className="w-4 h-4 text-verde" />
              <h2 className="text-base font-bold font-display text-ink">
                3. Forma de Pagamento
              </h2>
            </div>

            {/* Alternador de Método: Pix vs Cartão */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("PIX")}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  paymentMethod === "PIX"
                    ? "border-verde bg-verde/5 text-ink ring-1 ring-verde shadow-xs"
                    : "border-border bg-surface hover:border-border/80 text-text-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-verde" />
                    <span className="text-sm font-bold text-ink">Pix</span>
                  </div>
                  <span className="text-[11px] font-bold text-white bg-verde px-2 py-0.5 rounded-full uppercase tracking-wider">
                    5% OFF
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Aprovação imediata e desconto de 5% sobre as peças
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CREDIT_CARD")}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  paymentMethod === "CREDIT_CARD"
                    ? "border-ink bg-surface-alt text-ink ring-1 ring-ink shadow-xs"
                    : "border-border bg-surface hover:border-border/80 text-text-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-ink" />
                    <span className="text-sm font-bold text-ink">Cartão</span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted font-mono">
                    Até 3x sem juros
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Visa, Mastercard, Elo e Amex
                </p>
              </button>
            </div>

            {/* Detalhes do Método Selecionado */}
            {paymentMethod === "PIX" ? (
              <div className="p-4 rounded-lg bg-verde/5 border border-verde/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-verde font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Desconto de 5% aplicado no Pix!</span>
                </div>
                <p className="text-text-muted leading-relaxed">
                  O QR Code e o código Pix Copia-e-Cola serão gerados na próxima tela. O pagamento é confirmado automaticamente em poucos segundos.
                </p>
              </div>
            ) : (
              <div className="pt-2">
                <MercadoPagoCardBrick
                  ref={cardBrickRef}
                  amountCents={totals.totalCents}
                  payerEmail={customerEmail || undefined}
                />
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita (5 Colunas): Resumo do Pedido Fixo */}
        <div className="hidden lg:col-span-5 lg:block lg:order-2 space-y-4 lg:sticky lg:top-24">
          <div className="bg-surface rounded-card border border-border p-6 space-y-5 shadow-xs">
            <h3 className="text-base font-bold font-display text-ink border-b border-border pb-3">
              Resumo da Compra
            </h3>

            {/* Lista dos Itens do Carrinho */}
            <div className="max-h-60 overflow-y-auto divide-y divide-border pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center gap-3 text-xs">
                  <div className="relative w-12 h-14 rounded bg-surface-alt shrink-0 overflow-hidden border border-border">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{item.productName}</p>
                    <p className="text-[11px] text-text-muted">
                      {item.variantName} · Qtd: {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono font-medium text-text">
                    {formatCents(item.priceCents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Linhas de Valores Financeiros */}
            <div className="space-y-2 pt-2 border-t border-border text-xs text-text">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal dos produtos</span>
                <span className="font-mono">{formatCents(subtotalCents)}</span>
              </div>

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
                <span className="text-text-muted">Frete ({selectedShipping?.name || "A calcular"})</span>
                <span className="font-mono font-medium">
                  {selectedShipping ? (
                    selectedShipping.isFree ? (
                      <span className="text-verde font-semibold">Grátis</span>
                    ) : (
                      formatCents(selectedShipping.priceCents)
                    )
                  ) : (
                    <span className="text-text-muted text-[11px]">Digite o CEP</span>
                  )}
                </span>
              </div>

              {/* Destaque Pix */}
              {paymentMethod === "PIX" && (
                <div className="flex justify-between text-verde font-medium pt-1">
                  <span>Desconto Pix (5% OFF)</span>
                  <span className="font-mono font-semibold">
                    -{formatCents(totals.pixDiscountAmountCents)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-ink">Total a Pagar</span>
                  {paymentMethod === "PIX" && (
                    <p className="text-[10px] text-verde font-semibold">
                      Com 5% de desconto no Pix
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-ink font-mono font-display">
                    {formatCents(finalAmountToDisplay)}
                  </span>
                  {paymentMethod === "CREDIT_CARD" && (
                    <p className="text-[11px] text-text-muted">
                      ou até {totals.formatted.installments}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botão de Finalização com Proteção de Envio */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full gap-2 text-sm font-semibold shadow-md py-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando pedido...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirmar e Pagar ({formatCents(finalAmountToDisplay)})</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </Button>

              <p className="text-[11px] text-center text-text-muted flex items-center justify-center gap-1.5 pt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-verde" />
                <span>Ambiente Seguro com Criptografia SSL</span>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
