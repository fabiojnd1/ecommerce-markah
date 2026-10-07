"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { SeedProduct, SeedVariant } from "@/lib/data/catalog-seed";

interface VariantSelectorProps {
  product: SeedProduct;
  selectedVariant: SeedVariant;
  onVariantChange: (variant: SeedVariant) => void;
}

export function VariantSelector({
  product,
  selectedVariant,
  onVariantChange,
}: VariantSelectorProps) {
  // Mapeia quais optionValueIds estão ativos na variação atual
  const activeValueIds = useMemo(
    () => new Set(selectedVariant.selectedOptionValueIds),
    [selectedVariant]
  );

  function isOptionValueAvailable(optionId: string, valueId: string): boolean {
    if (activeValueIds.has(valueId)) return true;

    // IDs dos valores selecionados nas OUTRAS opções
    const otherSelectedIds = product.options
      .filter((opt) => opt.id !== optionId)
      .map((opt) => opt.values.find((val) => activeValueIds.has(val.id))?.id)
      .filter(Boolean) as string[];

    // 1. Há variante ativa que combina esse valor com as outras escolhas atuais?
    const exactOtherMatch = product.variants.some(
      (v) =>
        v.active &&
        v.selectedOptionValueIds.includes(valueId) &&
        otherSelectedIds.every((otherId) => v.selectedOptionValueIds.includes(otherId))
    );
    if (exactOtherMatch) return true;

    // 2. Há pelo menos uma variante ativa contendo este valor?
    return product.variants.some(
      (v) => v.active && v.selectedOptionValueIds.includes(valueId)
    );
  }

  function handleOptionValueClick(optionId: string, valueId: string) {
    if (!isOptionValueAvailable(optionId, valueId)) {
      return;
    }

    const targetValues = new Set(activeValueIds);
    const option = product.options.find((o) => o.id === optionId);
    if (option) {
      option.values.forEach((v) => targetValues.delete(v.id));
    }
    targetValues.add(valueId);

    // 1. Tenta correspondência exata ativa
    const exactMatch = product.variants.find(
      (v) =>
        v.active &&
        v.selectedOptionValueIds.length === targetValues.size &&
        v.selectedOptionValueIds.every((id) => targetValues.has(id))
    );

    if (exactMatch) {
      onVariantChange(exactMatch);
      return;
    }

    // 2. Se não houver exato, busca a variante ativa que mais preserva as escolhas anteriores
    const candidateVariants = product.variants.filter(
      (v) => v.active && v.selectedOptionValueIds.includes(valueId)
    );

    if (candidateVariants.length > 0) {
      candidateVariants.sort((a, b) => {
        const aOverlap = a.selectedOptionValueIds.filter((id) =>
          activeValueIds.has(id)
        ).length;
        const bOverlap = b.selectedOptionValueIds.filter((id) =>
          activeValueIds.has(id)
        ).length;
        return bOverlap - aOverlap;
      });
      onVariantChange(candidateVariants[0]);
    }
  }

  return (
    <div className="space-y-6">
      {product.options.map((option) => {
        const isColorOption =
          option.name.toLowerCase().includes("cor") ||
          option.name.toLowerCase().includes("base") ||
          option.name.toLowerCase().includes("cúpula") ||
          option.name.toLowerCase().includes("cupula") ||
          option.values.some((v) => Boolean(v.colorHex));

        const selectedValue = option.values.find((v) => activeValueIds.has(v.id));

        return (
          <div key={option.id} className="space-y-2.5">
            {/* Rótulo da Opção e Valor Ativo */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-text">
                {option.name}:{" "}
                <span className="font-normal text-text-muted">
                  {selectedValue?.name || "Selecione"}
                </span>
              </span>
            </div>

            {/* Opções em Bolinhas de Cor */}
            {isColorOption ? (
              <div className="flex flex-wrap items-center gap-3">
                {option.values.map((val) => {
                  const isSelected = activeValueIds.has(val.id);
                  const isAvailable = isOptionValueAvailable(option.id, val.id);

                  return (
                    <button
                      key={val.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleOptionValueClick(option.id, val.id)}
                      aria-label={`${option.name}: ${val.name}${
                        !isAvailable ? " (indisponível)" : ""
                      }`}
                      title={
                        isAvailable
                          ? val.name
                          : `${val.name} (indisponível nesta combinação)`
                      }
                      className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 ${
                        isSelected
                          ? "ring-2 ring-ink ring-offset-2 scale-110 shadow-sm cursor-default"
                          : isAvailable
                          ? "border border-black/20 hover:scale-105 cursor-pointer"
                          : "opacity-35 border border-dashed border-black/40 grayscale cursor-not-allowed"
                      }`}
                      style={{ backgroundColor: val.colorHex || "#CCCCCC" }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-4 h-4 ${
                            val.colorHex === "#FFFFFF" || val.colorHex === "#FAF8F5"
                              ? "text-black"
                              : "text-white"
                          }`}
                        />
                      )}
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-0.5 bg-neutral-600 rotate-45 transform" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Opções em Pílulas (Tamanho, Textura, etc.) */
              <div className="flex flex-wrap items-center gap-2.5">
                {option.values.map((val) => {
                  const isSelected = activeValueIds.has(val.id);
                  const isAvailable = isOptionValueAvailable(option.id, val.id);

                  return (
                    <button
                      key={val.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleOptionValueClick(option.id, val.id)}
                      aria-label={`${option.name}: ${val.name}${
                        !isAvailable ? " (indisponível)" : ""
                      }`}
                      title={
                        isAvailable
                          ? val.name
                          : `${val.name} (indisponível nesta combinação)`
                      }
                      className={`min-h-11 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta ${
                        isSelected
                          ? "bg-ink text-white shadow-subtle cursor-default"
                          : isAvailable
                          ? "border border-border bg-surface text-text hover:bg-surface-alt cursor-pointer"
                          : "border border-dashed border-border/80 bg-surface-alt/50 text-text-muted/60 opacity-50 cursor-not-allowed line-through"
                      }`}
                    >
                      {val.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* SKU da variação ativa */}
      <div className="text-[11px] text-text-muted font-mono pt-1">
        SKU: <span className="text-text font-semibold">{selectedVariant.sku}</span>
      </div>
    </div>
  );
}
