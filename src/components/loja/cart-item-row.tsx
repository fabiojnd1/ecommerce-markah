"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Minus, Trash2 } from "lucide-react";
import { formatCents } from "@/lib/pricing";
import type { CartItem } from "@/lib/cart-context";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
  onItemClick?: () => void;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  onItemClick,
}: CartItemRowProps) {
  return (
    <div className="flex gap-3.5 py-4 border-b border-border last:border-b-0 items-start">
      {/* Miniatura 4:5 */}
      <Link
        href={`/produtos/${item.productSlug}`}
        onClick={onItemClick}
        className="relative w-16 h-20 rounded-lg overflow-hidden bg-surface-alt shrink-0 border border-border"
      >
        <Image
          src={item.imageUrl}
          alt={item.productName}
          fill
          sizes="64px"
          className="object-cover"
        />
      </Link>

      {/* Detalhes do Item */}
      <div className="flex-1 min-w-0 space-y-1">
        <Link
          href={`/produtos/${item.productSlug}`}
          onClick={onItemClick}
          className="text-xs sm:text-sm font-semibold text-ink hover:text-magenta transition-colors line-clamp-1"
        >
          {item.productName}
        </Link>

        {/* Variação e Cor */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          {item.colors && item.colors.length > 1 ? (
            <div
              className="flex items-center -space-x-1 shrink-0"
              title={item.colors.map((c) => `${c.label || "Cor"}: ${c.name}`).join(" / ")}
            >
              {item.colors.map((c, idx) => (
                <span
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs"
                  style={{ backgroundColor: c.hex || "#CCCCCC" }}
                />
              ))}
            </div>
          ) : item.colorHex ? (
            <span
              className="w-3 h-3 rounded-full border border-black/15 shrink-0"
              style={{ backgroundColor: item.colorHex }}
            />
          ) : null}
          <span className="truncate" title={item.variantName}>{item.variantName}</span>
        </div>

        {/* Preço Unitário */}
        <div className="text-xs font-bold text-text pt-0.5">
          {formatCents(item.priceCents)}
        </div>

        {/* Controles de Quantidade e Excluir */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center border border-border rounded-full bg-surface">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              aria-label="Diminuir quantidade"
              className="flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt hover:text-ink transition-colors disabled:opacity-30"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-semibold px-2 min-w-[20px] text-center font-mono">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              aria-label="Aumentar quantidade"
              className="flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt hover:text-ink transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remover ${item.productName} do carrinho`}
            className="flex h-11 w-11 items-center justify-center text-text-muted hover:text-red-600 transition-colors rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
