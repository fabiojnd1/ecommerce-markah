"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Heart, User, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

const navigationItems = [
  { label: "Luminárias", href: "/luminarias-de-mesa" },
  { label: "Pendentes", href: "/pendentes" },
  { label: "Vasos", href: "/vasos" },
  { label: "Cachepôs", href: "/cachepos" },
  { label: "Plantários", href: "/plantarios" },
  { label: "Organização", href: "/organizadores" },
  { label: "Lançamentos", href: "/lancamentos", highlight: "magenta" },
  {
    label: "Letras-caixa",
    href: "/letras-caixa",
    isSpecial: true,
    highlight: "violeta",
  },
];

const desktopNavigationItems = navigationItems.filter((item) =>
  ["/luminarias-de-mesa", "/pendentes", "/vasos", "/organizadores", "/lancamentos", "/letras-caixa"].includes(item.href)
);

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalItems, openDrawer } = useCart();
  const { totalFavorites } = useWishlist();

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border transition-all duration-200">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 gap-1 sm:gap-3 lg:min-h-[72px]">
          {/* Botão Menu Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu de navegação"
            className="lg:hidden -ml-1 flex h-11 w-11 items-center justify-center text-text hover:text-ink transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-magenta"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo Markah Brasil */}
          <Link
            href="/"
            className="flex items-center shrink-0 group focus-visible:ring-2 focus-visible:ring-magenta rounded-md p-1"
          >
            <Image
              src="/brand/markah-logo.png"
              alt="Markah Brasil — Decoração em Impressão 3D"
              width={113}
              height={56}
              priority
              className="h-10 md:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Menu Principal (Desktop) */}
          <nav
            aria-label="Menu principal"
            className="hidden lg:flex flex-1 items-center justify-center gap-3 xl:gap-4 text-[13px] xl:text-sm font-medium text-text"
          >
            {desktopNavigationItems.map((item) => {
              if (item.isSpecial) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-white bg-violeta hover:brightness-110 shadow-subtle transition-all duration-200 focus-visible:ring-2 focus-visible:ring-magenta"
                  >
                    <span>{item.label}</span>
                    <span className="hidden 2xl:inline text-[9px] bg-white/25 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Sob medida
                    </span>
                  </Link>
                );
              }

              if (item.highlight === "magenta") {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative text-magenta font-semibold hover:opacity-85 transition-opacity"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-ink transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-text hover:after:w-full after:transition-all after:duration-200"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Ações do Topo: Busca, Favoritos, Conta, Carrinho */}
          <div className="flex items-center gap-0 sm:gap-2">
            {/* Campo/Botão de Busca */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Buscar produtos"
              className="flex h-11 w-11 items-center justify-center text-text hover:text-ink hover:bg-surface-alt transition-colors rounded-full focus-visible:ring-2 focus-visible:ring-magenta"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Favoritos */}
            <Link
              href="/favoritos"
              aria-label={`Meus favoritos${totalFavorites > 0 ? ` (${totalFavorites})` : ""}`}
              className="relative hidden sm:inline-flex h-11 w-11 items-center justify-center text-text hover:text-magenta hover:bg-surface-alt transition-colors rounded-full focus-visible:ring-2 focus-visible:ring-magenta"
            >
              <Heart className="w-5 h-5" />
              {totalFavorites > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4.5 h-4.5 px-1 bg-magenta text-white text-[11px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-surface font-mono animate-in zoom-in-75 duration-150">
                  {totalFavorites}
                </span>
              )}
            </Link>

            {/* Conta do Cliente */}
            <Link
              href="/conta"
              aria-label="Minha conta"
              className="flex h-11 w-11 items-center justify-center text-text hover:text-ink hover:bg-surface-alt transition-colors rounded-full focus-visible:ring-2 focus-visible:ring-magenta"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Carrinho de Compras */}
            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Carrinho de compras com ${totalItems} itens`}
              className="relative flex h-11 w-11 items-center justify-center text-text hover:text-ink hover:bg-surface-alt transition-colors rounded-full focus-visible:ring-2 focus-visible:ring-magenta"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4.5 h-4.5 px-1 bg-ink text-white text-[11px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-surface font-mono">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de Busca Expansível */}
        {searchOpen && (
          <div className="py-3 pb-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get("q") as string;
                if (query && query.trim()) {
                  window.location.href = `/produtos?busca=${encodeURIComponent(query.trim())}`;
                }
              }}
              className="relative max-w-xl mx-auto"
            >
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                name="q"
                placeholder="Buscar luminárias, vasos, cachepôs ou organizadores..."
                autoFocus
                className="w-full h-11 pl-12 pr-4 rounded-full bg-surface-alt border border-border text-text placeholder:text-text-muted text-sm focus:bg-surface focus:outline-none focus:border-ink transition-colors"
              />
            </form>
          </div>
        )}
      </div>

      {/* Menu Gaveta Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop escuro */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Painel lateral */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-surface shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Topo do painel */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <Image
                  src="/brand/markah-logo.png"
                  alt="Markah Brasil"
                  width={73}
                  height={36}
                  className="h-9 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-11 w-11 items-center justify-center text-text-muted hover:text-ink rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links de navegação mobile */}
              <nav className="flex flex-col space-y-1 font-medium text-base text-text">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-3 px-3 rounded-lg flex items-center justify-between transition-colors ${
                      item.isSpecial
                        ? "bg-violeta/10 text-violeta font-semibold"
                        : item.highlight === "magenta"
                        ? "text-magenta font-semibold"
                        : "hover:bg-surface-alt"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.isSpecial && (
                      <span className="text-[10px] bg-violeta text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Personalizado
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Rodapé da gaveta mobile */}
            <div className="pt-6 border-t border-border space-y-3 text-sm text-text-muted">
              <Link
                href="/favoritos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-alt text-text"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-magenta" />
                  <span>Meus Favoritos</span>
                </div>
                {totalFavorites > 0 && (
                  <span className="min-w-5 h-5 px-1.5 bg-magenta/10 text-magenta text-xs font-bold rounded-full flex items-center justify-center font-mono">
                    {totalFavorites}
                  </span>
                )}
              </Link>
              <Link
                href="/conta"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-alt text-text"
              >
                <User className="w-4 h-4 text-text" />
                <span>Minha Conta</span>
              </Link>
              <div className="text-xs pt-2 text-text-muted">
                Instagram:{" "}
                <a
                  href="https://instagram.com/markah_br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-magenta font-semibold hover:underline"
                >
                  @markah_br
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
