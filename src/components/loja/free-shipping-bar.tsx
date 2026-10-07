"use client";

import { CheckCircle2, Truck } from "lucide-react";
import { formatCents } from "@/lib/pricing";

interface FreeShippingBarProps {
  subtotalCents: number;
  thresholdCents?: number; // Padrão: 20000 (R$ 200,00)
}

export function FreeShippingBar({
  subtotalCents,
  thresholdCents = 20000,
}: FreeShippingBarProps) {
  const isFree = subtotalCents >= thresholdCents;
  const remainingCents = Math.max(0, thresholdCents - subtotalCents);
  const progressPercent = Math.min(
    100,
    thresholdCents > 0
      ? Math.round((subtotalCents / thresholdCents) * 100)
      : 100
  );

  return (
    <div className="bg-surface p-3.5 rounded-lg border border-border space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold">
        {isFree ? (
          <span className="text-verde flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Parabéns! Você ganhou Frete Grátis</span>
          </span>
        ) : (
          <span className="text-text flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-laranja shrink-0" />
            <span>
              Faltam <strong className="text-laranja font-bold">{formatCents(remainingCents)}</strong> para frete grátis
            </span>
          </span>
        )}
        <span className="text-[11px] font-mono text-text-muted">
          {progressPercent}%
        </span>
      </div>

      {/* Barra de Progresso com o Gradiente da Marca */}
      <div className="w-full h-2 rounded-full bg-surface-alt overflow-hidden">
        <div
          className="h-full bg-brand-gradient transition-all duration-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
