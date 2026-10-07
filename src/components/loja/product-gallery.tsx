"use client";

import { useState } from "react";
import Image from "next/image";
import type { SeedImage } from "@/lib/data/catalog-seed";

interface ProductGalleryProps {
  images: SeedImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const primaryIndex = images.findIndex((img) => img.isPrimary);
  const initialIndex = primaryIndex >= 0 ? primaryIndex : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const activeImage = images[selectedIndex] || images[initialIndex] || images[0];

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
      {/* Miniaturas (Desktop: coluna vertical; Mobile: linha horizontal) */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0 shrink-0">
        {images.map((img, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-18 h-22 sm:w-20 sm:h-25 rounded-lg overflow-hidden bg-surface-alt transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta shrink-0 ${
                isSelected
                  ? "ring-2 ring-ink ring-offset-2 scale-102"
                  : "border border-border opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={`${productName} miniatura ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          );
        })}
      </div>

      {/* Foto Principal Ampliada (Proporção 4:5) */}
      <div className="relative aspect-[4/5] w-full flex-1 rounded-card overflow-hidden bg-surface-alt border border-border shadow-subtle group">
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Indicador de estado aceso / apagado se for luminária */}
        {activeImage.isHover && (
          <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-xs text-amarelo text-xs font-semibold shadow-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amarelo animate-pulse" />
            <span>Visualização Iluminada</span>
          </span>
        )}
      </div>
    </div>
  );
}
