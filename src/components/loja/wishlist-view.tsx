"use client";

import Link from "next/link";
import { Heart, ArrowRight, Trash2, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { type SeedProduct } from "@/lib/data/catalog-seed";
import { ProductCard } from "@/components/loja/product-card";
import { Button } from "@/components/ui/button";

interface WishlistViewProps {
  products?: SeedProduct[];
}

export function WishlistView({ products = [] }: WishlistViewProps) {
  const { favorites, clearFavorites } = useWishlist();

  const favoritedProducts = products.filter((product) =>
    favorites.includes(product.slug)
  );

  return (
    <div className="py-8 md:py-12">
      {/* Cabeçalho da Lista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
              Meus Favoritos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-magenta/10 text-magenta font-mono text-xs font-bold">
              {favorites.length} {favorites.length === 1 ? "item" : "itens"}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Peças autorais salvas para você acompanhar novidades e finalizar com calma.
          </p>
        </div>

        {favorites.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Tem certeza que deseja remover todos os itens dos favoritos?"
                )
              ) {
                clearFavorites();
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-red-500 transition-colors self-start sm:self-auto py-2 px-3 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar lista</span>
          </button>
        )}
      </div>

      {/* Conteúdo: Lista ou Estado Vazio */}
      {favoritedProducts.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-magenta/10 flex items-center justify-center text-magenta">
            <Heart className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-ink">
              Sua lista de favoritos está vazia
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Explore nosso catálogo autoral de iluminação e decoração em impressão 3D sustentável e clique no coração para salvar suas peças favoritas.
            </p>
          </div>
          <div>
            <Link href="/produtos">
              <Button variant="primary" size="lg" className="gap-2">
                <span>Explorar Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {favoritedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-surface-alt/70 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-verde/15 flex items-center justify-center text-verde shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Pronto para transformar seu ambiente?
                </h3>
                <p className="text-xs text-text-muted">
                  Aproveite 5% de desconto no Pix e parcelamento em até 6x sem juros.
                </p>
              </div>
            </div>
            <Link href="/produtos">
              <Button variant="secondary" size="sm" className="whitespace-nowrap">
                Ver mais peças
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
