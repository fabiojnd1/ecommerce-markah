"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  BookmarkCheck,
  Tag,
  Star,
  Settings,
  Store,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    icon: ShoppingBag,
  },
  {
    label: "Produtos",
    href: "/admin/produtos",
    icon: Package,
  },
  {
    label: "Categorias",
    href: "/admin/categorias",
    icon: FolderTree,
  },
  {
    label: "Coleções",
    href: "/admin/colecoes",
    icon: BookmarkCheck,
  },
  {
    label: "Promoções",
    href: "/admin/promocoes",
    icon: Tag,
  },
  {
    label: "Avaliações",
    href: "/admin/avaliacoes",
    icon: Star,
  },
  {
    label: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      <div>
        {/* Topo da barra lateral com logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/brand/markah-logo.png"
              alt="Markah Brasil"
              width={73}
              height={36}
              className="h-9 w-auto object-contain"
            />
            <span className="text-[10px] font-bold bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
              Admin
            </span>
          </Link>
        </div>

        {/* Itens de navegação */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-ink text-white"
                    : "text-text-muted hover:text-text hover:bg-surface-alt"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Rodapé da Sidebar: Atalho para Loja */}
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-alt transition-colors"
        >
          <Store className="w-4 h-4 text-text-muted" />
          <span>Abrir Loja Virtual</span>
        </Link>
      </div>
    </aside>
  );
}
