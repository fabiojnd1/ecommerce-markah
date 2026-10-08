"use client";

import { useStoreSettings } from "@/lib/store-settings-context";
import { WHATSAPP_NUMBER } from "@/lib/site-config";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  Clock,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Loader2,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { ProductGallery } from "./product-gallery";
import { VariantSelector } from "./variant-selector";
import { Button } from "@/components/ui/button";
import { getProductPricing } from "@/lib/pricing";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { getShippingQuotesAction } from "@/server/shipping-actions";
import type { ShippingQuote } from "@/lib/shipping/melhor-envio";
import type { SeedProduct, SeedVariant } from "@/lib/data/catalog-seed";

interface ProductDetailsClientProps {
  product: SeedProduct;
}

export function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const isFavorited = isFavorite(product.slug);
  const [selectedVariant, setSelectedVariant] = useState<SeedVariant>(
    product.variants[0]
  );
  const [cep, setCep] = useState("");
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isPendingShipping, startShippingTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const storeSettings = useStoreSettings();
  const activeWhatsapp = storeSettings.whatsappNumber || WHATSAPP_NUMBER;

  const pricing = getProductPricing({
    priceCents: selectedVariant.priceCents,
    compareAtPriceCents: selectedVariant.compareAtPriceCents,
    pixDiscountPercent: storeSettings.pixDiscountPercent,
    maxInstallments: storeSettings.maxInstallmentsFree,
  });

  const whatsappMessage = `OlÃ¡! Gostaria de tirar uma dÃºvida sobre o produto *${product.name}* (SKU: ${selectedVariant.sku}).`;

  function handleAddToCart() {
    setIsAdding(true);
    addItem(product, selectedVariant, 1);
    setIsAdding(false);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  }

  function handleCalculateShipping(e: React.FormEvent) {
    e.preventDefault();
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setShippingError("Digite um CEP vÃ¡lido com 8 nÃºmeros.");
      return;
    }

    setShippingError(null);
    startShippingTransition(async () => {
      const res = await getShippingQuotesAction(cleanCep, [
        {
          weightGrams: selectedVariant.weightGrams,
          packageHeightCm: selectedVariant.packageHeightCm,
          packageWidthCm: selectedVariant.packageWidthCm,
          packageDepthCm: selectedVariant.packageDepthCm,
          priceCents: selectedVariant.priceCents,
          quantity: 1,
        },
      ]);

      if (res.success && res.quotes) {
        setShippingQuotes(res.quotes);
      } else {
        setShippingError(res.error || "NÃ£o foi possÃ­vel cotar o frete para este CEP.");
      }
    });
  }

  return (
    <div className="space-y-12">
      {/* Grade Principal: Galeria (60%) e InformaÃ§Ãµes (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pb-20 lg:pb-0">
        {/* Lado Esquerdo: Galeria de Fotos */}
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Lado Direito: InformaÃ§Ãµes e Compra */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          {/* Categoria e Selos */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${product.categorySlug}`}
              className="text-xs uppercase tracking-wider font-semibold text-text-muted hover:text-magenta transition-colors font-mono"
            >
              {product.categorySlug.replace(/-/g, " ")}
            </Link>
            {pricing.hasDiscount && (
              <span className="px-2.5 py-0.5 rounded-full bg-laranja text-white text-[11px] font-bold uppercase tracking-wider">
                -{pricing.discountPercentage}% OFF
              </span>
            )}
            {product.isSustainable && (
              <span className="px-2.5 py-0.5 rounded-full bg-verde text-white text-[11px] font-bold uppercase tracking-wider">
                PLA SustentÃ¡vel
              </span>
            )}
          </div>

          {/* TÃ­tulo do Produto */}
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-display leading-tight">
            {product.name}
          </h1>

          {/* Bloco de PreÃ§os em Destaque */}
          <div className="p-4 sm:p-5 rounded-xl bg-surface-alt/70 border border-border space-y-2.5">
            {pricing.hasDiscount && (
              <span className="text-sm text-text-muted line-through block">
                {pricing.formatted.compareAtPrice}
              </span>
            )}

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-[34px] font-bold text-ink font-display">
                {pricing.formatted.pixPrice}
              </span>
              <span className="text-xs sm:text-sm font-bold text-verde bg-verde/10 px-2.5 py-1 rounded-full">
                Pix Â· 5% OFF
              </span>
            </div>

            <div className="text-xs sm:text-sm text-text-muted">
              <span>Ou </span>
              <strong className="text-text">{pricing.formatted.price}</strong>
              <span> {pricing.formatted.installments}</span>
            </div>
          </div>

          {/* Seletor de VariaÃ§Ãµes */}
          <VariantSelector
            product={product}
            selectedVariant={selectedVariant}
            onVariantChange={setSelectedVariant}
          />

          {/* BotÃµes de AÃ§Ã£o */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                isLoading={isAdding}
                className="flex-1 gap-2 text-base font-semibold shadow-md hover:shadow-lg"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {addedSuccess
                    ? "Item adicionado ao carrinho!"
                    : "Adicionar ao Carrinho"}
                </span>
              </Button>

              <button
                type="button"
                onClick={() => toggleFavorite(product.slug)}
                aria-label={
                  isFavorited
                    ? `Remover ${product.name} dos favoritos`
                    : `Salvar ${product.name} nos favoritos`
                }
                title={isFavorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
                className={`p-3.5 rounded-lg border transition-all duration-200 flex items-center justify-center shrink-0 ${
                  isFavorited
                    ? "border-magenta/40 bg-magenta/10 text-magenta shadow-subtle"
                    : "border-border bg-surface hover:bg-surface-alt text-text hover:text-magenta"
                }`}
              >
                <Heart
                  className={`w-6 h-6 transition-transform duration-150 active:scale-90 ${
                    isFavorited ? "fill-magenta text-magenta" : ""
                  }`}
                />
              </button>
            </div>

            {/* DÃºvidas no WhatsApp */}
            <a
              href={`https://wa.me/${activeWhatsapp}?text=${encodeURIComponent(
                whatsappMessage
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                size="default"
                className="w-full gap-2 border-verde/30 text-verde hover:bg-verde/5"
              >
                <MessageCircle className="w-4 h-4 fill-verde stroke-none" />
                <span>DÃºvidas? Fale conosco no WhatsApp</span>
              </Button>
            </a>
          </div>

          {/* SimulaÃ§Ã£o de Frete e Prazo de ProduÃ§Ã£o */}
          <div className="p-4 rounded-card border border-border bg-surface space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-text uppercase tracking-wider font-mono">
              <Truck className="w-4 h-4 text-text-muted" />
              <span>Calcular Frete e Prazo</span>
            </div>

            <form onSubmit={handleCalculateShipping} className="flex gap-2">
              <label htmlFor="product-shipping-cep" className="sr-only">CEP para calcular frete e prazo</label>
              <input
                id="product-shipping-cep"
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
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
                className="min-h-11 shrink-0"
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

            {shippingQuotes.length > 0 ? (
              <div className="pt-2 text-xs space-y-2 border-t border-border animate-in fade-in duration-200">
                {shippingQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-2.5 rounded bg-surface-alt"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-ink">
                        <span>{quote.name}</span>
                        {quote.isFree && (
                          <span className="text-[10px] font-bold text-verde bg-verde/10 px-1.5 py-0.2 rounded-full uppercase">
                            Frete GrÃ¡tis
                          </span>
                        )}
                      </div>
                      <span className="text-text-muted text-[11px] block mt-0.5">
                        ProduÃ§Ã£o ({quote.productionDays}d) + Entrega ({quote.carrierDays}d) ={" "}
                        <strong className="text-text font-bold">
                          {quote.totalDays} dias Ãºteis
                        </strong>
                      </span>
                    </div>
                    <span className="font-bold text-text font-mono">
                      {quote.formatted.price}
                    </span>
                  </div>
                ))}
                <p className="text-[11px] text-verde font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Frete grÃ¡tis disponÃ­vel para compras a partir de R$ 200,00!</span>
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Clock className="w-3.5 h-3.5 text-amarelo shrink-0" />
                <span>
                  Produzido sob encomenda em atÃ© <strong>3 dias Ãºteis</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Garantias rÃ¡pidas */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-verde" />
              <span>Garantia de 7 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-magenta" />
              <span>ImpressÃ£o 3D de alta precisÃ£o</span>
            </div>
          </div>
        </div>
      </div>

      {/* SeÃ§Ã£o Inferior: Abas de DescriÃ§Ã£o, Ficha TÃ©cnica e Cuidados */}
      <div className="bg-surface rounded-card border border-border p-6 sm:p-8 lg:p-10 space-y-8">
        {/* DescriÃ§Ã£o Detalhada */}
        <div>
          <h2 className="text-xl font-bold text-ink font-display mb-3">
            Sobre a PeÃ§a
          </h2>
          <p className="text-text leading-relaxed max-w-4xl text-base">
            {product.description}
          </p>
        </div>

        {/* Ficha TÃ©cnica Estruturada */}
        <div className="pt-6 border-t border-border">
          <h2 className="text-xl font-bold text-ink font-display mb-4">
            Ficha TÃ©cnica
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3.5 rounded-lg bg-surface-alt/70">
              <span className="text-xs text-text-muted block">DimensÃµes (A Ã— L Ã— P)</span>
              <strong className="text-text">{product.dimensions}</strong>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-alt/70">
              <span className="text-xs text-text-muted block">Material</span>
              <strong className="text-text">
                {product.material === "PLA"
                  ? "PLA BotÃ¢nico BiodegradÃ¡vel"
                  : "PETG de Alta ResistÃªncia"}
              </strong>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-alt/70">
              <span className="text-xs text-text-muted block">Peso da PeÃ§a</span>
              <strong className="text-text">{product.weightGrams}g</strong>
            </div>

            {product.socketType && (
              <div className="p-3.5 rounded-lg bg-surface-alt/70">
                <span className="text-xs text-text-muted block">Soquete / Base</span>
                <strong className="text-text">{product.socketType}</strong>
              </div>
            )}

            {product.maxWattage && (
              <div className="p-3.5 rounded-lg bg-surface-alt/70">
                <span className="text-xs text-text-muted block">PotÃªncia Recomendada</span>
                <strong className="text-text">AtÃ© {product.maxWattage}W LED</strong>
              </div>
            )}

            {product.cordLengthCm && (
              <div className="p-3.5 rounded-lg bg-surface-alt/70">
                <span className="text-xs text-text-muted block">Comprimento do Cabo</span>
                <strong className="text-text">{product.cordLengthCm} cm</strong>
              </div>
            )}

            {product.waterproof !== undefined && (
              <div className="p-3.5 rounded-lg bg-surface-alt/70">
                <span className="text-xs text-text-muted block">VedaÃ§Ã£o para Ãgua</span>
                <strong className="text-text">
                  {product.waterproof ? "Vedado / ReservatÃ³rio interno" : "Uso para plantas secas"}
                </strong>
              </div>
            )}

            <div className="p-3.5 rounded-lg bg-surface-alt/70">
              <span className="text-xs text-text-muted block">Prazo de ProduÃ§Ã£o</span>
              <strong className="text-text">{product.productionDays} dias Ãºteis</strong>
            </div>
          </div>
        </div>

        {/* Cuidados e PreservaÃ§Ã£o */}
        <div className="pt-6 border-t border-border">
          <h2 className="text-xl font-bold text-ink font-display mb-3">
            Cuidados com sua PeÃ§a 3D
          </h2>
          <ul className="list-disc list-inside text-sm text-text-muted space-y-1.5 leading-relaxed">
            <li>Limpar apenas com pano macio levemente umedecido em Ã¡gua.</li>
            <li>NÃ£o utilizar produtos quÃ­micos abrasivos ou solventes (Ã¡lcool, acetona).</li>
            <li>Evitar exposiÃ§Ã£o solar direta prolongada ou temperaturas acima de 55Â°C.</li>
            <li>Para luminÃ¡rias, utilizar exclusivamente lÃ¢mpadas LED (nÃ£o usar lÃ¢mpadas incandescentes que geram calor excessivo).</li>
          </ul>
        </div>
      </div>

      {/* BotÃ£o Fixo no Mobile para Compra RÃ¡pida (conforme design.md) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl backdrop-blur-md">
        <div>
          <span className="text-xs text-text-muted block leading-none">PreÃ§o Ã  vista</span>
          <span className="text-lg font-bold text-ink font-display">
            {pricing.formatted.pixPrice}
          </span>
        </div>
        <Button
          variant="primary"
          size="default"
          onClick={handleAddToCart}
          className="flex-1 max-w-[200px]"
        >
          {addedSuccess ? "Adicionado!" : "Comprar"}
        </Button>
      </div>
    </div>
  );
}
