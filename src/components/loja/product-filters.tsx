"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, RotateCcw, X } from "lucide-react";
import type { SeedCategory } from "@/lib/data/catalog-seed";

interface ProductFiltersProps {
  categories: SeedCategory[];
  totalCount: number;
}

export function ProductFilters({ categories, totalCount }: ProductFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("categoria") || "";
  const currentMaterial = searchParams.get("material") || "";
  const currentSort = searchParams.get("ordem") || "relevance";
  const activeFilterCount = Number(Boolean(currentCategory)) + Number(Boolean(currentMaterial));

  function updateQuery(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(param, value);
    } else {
      params.delete(param);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const hasActiveFilters = Boolean(currentCategory || currentMaterial);

  return (
    <div className="bg-surface rounded-card border border-border p-3.5 sm:p-4 md:p-5 mb-6 md:mb-8 space-y-3 md:space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        {/* Lado Esquerdo: Contagem e Indicador de Filtros */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-text uppercase tracking-wider font-mono">
            <SlidersHorizontal className="w-4 h-4 text-text-muted" />
            <span>Filtros</span>
          </div>
          <button
            type="button"
            aria-expanded={isFilterOpen}
            onClick={() => setIsFilterOpen((open) => !open)}
            className={`lg:hidden inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold ${activeFilterCount ? "border-magenta/40 bg-magenta/5 text-ink" : "border-border text-ink"}`}
          >
            {isFilterOpen ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            <span>{isFilterOpen ? "Fechar filtros" : activeFilterCount ? `Filtros (${activeFilterCount})` : "Filtrar"}</span>
          </button>
          <span className="text-sm text-text-muted">
            {totalCount} {totalCount === 1 ? "peça encontrada" : "peças encontradas"}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium text-magenta hover:underline sm:ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        {/* Lado Direito: Ordenação */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <label htmlFor="sort-select" className="text-xs font-medium text-text-muted">
            Ordenar por:
          </label>
          <select
            id="sort-select"
            value={currentSort}
            onChange={(e) => updateQuery("ordem", e.target.value)}
            className="min-h-11 px-3 text-xs sm:text-sm font-medium rounded-input border border-border bg-surface text-text focus:outline-none focus:border-ink transition-colors cursor-pointer max-w-[190px]"
          >
            <option value="relevance">Destaques da Markah</option>
            <option value="newest">Lançamentos recentes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </div>
      </div>

      {/* Linha de Botões de Filtro Rápido (Categorias e Materiais) */}
      <div className={`${isFilterOpen ? "flex" : "hidden"} lg:flex flex-wrap items-center gap-2 pt-3 border-t border-border/60`}>
        <button
          type="button"
          onClick={() => updateQuery("categoria", "")}
          className={`min-h-11 px-3.5 rounded-full text-xs font-medium transition-colors ${
            !currentCategory
              ? "bg-ink text-white font-semibold"
              : "bg-surface-alt text-text hover:bg-neutral-200"
          }`}
        >
          Todas as Categorias
        </button>

        {categories.map((cat) => {
          const isSelected = currentCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => updateQuery("categoria", isSelected ? "" : cat.slug)}
              className={`min-h-11 px-3.5 rounded-full text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-ink text-white font-semibold"
                  : "bg-surface-alt text-text hover:bg-neutral-200"
              }`}
            >
              {cat.name}
            </button>
          );
        })}

        {/* Divisor */}
        <div className="hidden sm:block w-px h-5 bg-border mx-1" />

        {/* Filtro de Material */}
        <button
          type="button"
          onClick={() =>
            updateQuery("material", currentMaterial === "PLA" ? "" : "PLA")
          }
          className={`min-h-11 px-3 rounded-full text-xs font-medium transition-colors ${
            currentMaterial === "PLA"
              ? "bg-verde text-white font-semibold"
              : "border border-verde/40 text-verde hover:bg-verde/10"
          }`}
        >
          Eco PLA
        </button>

        <button
          type="button"
          onClick={() =>
            updateQuery("material", currentMaterial === "PETG" ? "" : "PETG")
          }
          className={`min-h-11 px-3 rounded-full text-xs font-medium transition-colors ${
            currentMaterial === "PETG"
              ? "bg-ciano text-white font-semibold"
              : "border border-ciano/40 text-ciano hover:bg-ciano/10"
          }`}
        >
          PETG Premium
        </button>
      </div>
    </div>
  );
}
