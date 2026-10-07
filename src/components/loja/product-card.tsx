"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { getProductPricing } from "@/lib/pricing";
import { useWishlist } from "@/lib/wishlist-context";
import type { SeedProduct } from "@/lib/data/catalog-seed";

interface ProductCardProps {
  product: SeedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isFavorite, toggleFavorite } = useWishlist();
  const favorited = isFavorite(product.slug);

  // Variação padrão para o card (primeira variação ativa)
  const defaultVariant = product.variants[0];
  const pricing = getProductPricing({
    priceCents: defaultVariant.priceCents,
    compareAtPriceCents: defaultVariant.compareAtPriceCents,
  });

  const primaryImage =
    product.images?.find((img) => img.isPrimary) ||
    product.images?.[0] || {
      id: "fallback_primary",
      url: "/products/luminaria-saturno-off.svg",
      alt: product.name,
      isPrimary: true,
      isHover: false,
    };
  const hoverImage =
    product.images?.find((img) => img.isHover) || product.images?.[1] || primaryImage;

  // Opções de cor (se houver)
  const colorOptions = product.options.filter(
    (o) =>
      o.name.toLowerCase().includes("cor") ||
      o.name.toLowerCase().includes("base") ||
      o.name.toLowerCase().includes("cúpula") ||
      o.name.toLowerCase().includes("cupula") ||
      o.values.some((v) => Boolean(v.colorHex))
  );
  const isMultiColorConfigurable = colorOptions.length > 1;
  const primaryColorOption = colorOptions[0];

  return (
    <article
      className="group relative flex flex-col bg-surface rounded-card transition-all duration-300 hover:shadow-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Mídia / Imagem 4:5 */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-card bg-surface-alt">
        <Link href={`/produtos/${product.slug}`} className="block w-full h-full">
          {/* Imagem Principal */}
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-opacity duration-500 ${
              isHovered && hoverImage !== primaryImage
                ? "opacity-0"
                : "opacity-100"
            }`}
          />

          {/* Imagem de Hover (Acesa ou Ambientada) */}
          {hoverImage !== primaryImage && (
            <Image
              src={hoverImage.url}
              alt={hoverImage.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-opacity duration-500 absolute inset-0 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </Link>

        {/* Selos no canto superior esquerdo */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 pointer-events-none">
          {product.tags?.includes("Lançamento") && (
            <span className="px-2.5 py-1 rounded-full bg-magenta text-white text-[11px] font-bold uppercase tracking-wider shadow-subtle">
              Lançamento
            </span>
          )}
          {pricing.hasDiscount && (
            <span className="px-2.5 py-1 rounded-full bg-laranja text-white text-[11px] font-bold uppercase tracking-wider shadow-subtle">
              -{pricing.discountPercentage}%
            </span>
          )}
          {!product.tags?.includes("Lançamento") && !pricing.hasDiscount && product.collectionSlugs?.includes("kits") && (
            <span className="px-2.5 py-1 rounded-full bg-violeta text-white text-[10px] font-bold uppercase tracking-wider shadow-subtle">
              Kit
            </span>
          )}
        </div>

        {/* Botão de Favoritar no canto superior direito */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.slug);
          }}
          aria-label={
            favorited
              ? `Remover ${product.name} dos favoritos`
              : `Adicionar ${product.name} aos favoritos`
          }
          className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 backdrop-blur-xs text-text hover:text-magenta hover:bg-surface shadow-subtle transition-transform duration-200 active:scale-90"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              favorited ? "fill-magenta text-magenta" : "text-text"
            }`}
          />
        </button>

        {/* Botão rápido "Ver opções" em hover (Desktop) */}
        <div className="absolute inset-x-3 bottom-3 hidden lg:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <Link
            href={`/produtos/${product.slug}`}
            className="w-full py-2.5 px-4 rounded-full bg-ink text-white text-xs font-semibold text-center shadow-lg hover:bg-neutral-800 transition-colors"
          >
            Ver opções
          </Link>
        </div>
      </div>

      {/* 2. Informações do Produto */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3 border-x border-b border-border rounded-b-card">
        <div>
          {/* Amostras de cores */}
          {isMultiColorConfigurable ? (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-alt border border-border text-[11px] font-medium text-text-muted">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-laranja via-magenta to-violeta shrink-0" />
                <span>Base e cúpula personalizáveis</span>
              </span>
              {product.isSustainable && (
                <span className="ml-auto text-[10px] uppercase tracking-wide text-verde font-semibold">Eco PLA</span>
              )}
            </div>
          ) : primaryColorOption && primaryColorOption.values.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 mb-2" title="Cores disponíveis">
              {primaryColorOption.values.map((val) => (
                <span
                  key={val.id}
                  className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                  style={{ backgroundColor: val.colorHex || "#CCCCCC" }}
                  title={val.name}
                />
              ))}
              <span className="text-[11px] text-text-muted ml-1">
                {primaryColorOption.values.length} cores
              </span>
              {product.isSustainable && (
                <span className="ml-auto text-[10px] uppercase tracking-wide text-verde font-semibold">Eco PLA</span>
              )}
            </div>
          ) : null}

          {colorOptions.length === 0 && product.isSustainable && (
            <span className="inline-flex mb-2 text-[10px] uppercase tracking-wide text-verde font-semibold">Eco PLA</span>
          )}

          {/* Nome do Produto */}
          <Link
            href={`/produtos/${product.slug}`}
            className="text-sm sm:text-base font-medium text-ink hover:text-magenta transition-colors line-clamp-2"
          >
            {product.name}
          </Link>

          {/* Avaliações (estrelas + contagem) */}
          <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
            <div className="flex items-center text-amarelo">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-semibold text-text">5.0</span>
            <span>(12)</span>
          </div>
        </div>

        {/* 3. Bloco de Preços */}
        <div className="pt-2 border-t border-border/60">
          {pricing.hasDiscount && (
            <span className="text-xs text-text-muted line-through block">
              {pricing.formatted.compareAtPrice}
            </span>
          )}

            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-base sm:text-lg font-bold text-ink font-display">
              {pricing.formatted.pixPrice}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-verde uppercase">no Pix</span>
          </div>

          <span className="text-xs text-text-muted block mt-0.5">
            {pricing.formatted.installments}
          </span>
        </div>
      </div>
    </article>
  );
}
