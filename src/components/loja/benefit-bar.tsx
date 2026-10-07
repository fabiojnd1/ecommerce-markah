"use client";

import { useState, useEffect } from "react";
import { Sparkles, Truck, CreditCard } from "lucide-react";

const benefits = [
  {
    icon: Sparkles,
    text: "5% OFF no Pix à vista",
    highlight: "5% OFF",
  },
  {
    icon: CreditCard,
    text: "Até 3x sem juros no cartão",
    highlight: "3x sem juros",
  },
  {
    icon: Truck,
    text: "Frete grátis em compras acima de R$ 200",
    highlight: "Frete grátis",
  },
];

export function BenefitBar() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % benefits.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="region"
      aria-label="Benefícios da loja"
      className="bg-ink text-white py-2 px-4 text-[12.5px] font-medium tracking-wide border-b border-white/10"
    >
      <div className="max-w-container mx-auto">
        {/* Visualização Desktop (todas as mensagens lado a lado) */}
        <div className="hidden md:flex items-center justify-center gap-8 lg:gap-12">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-amarelo shrink-0" />
                <span>{b.text}</span>
                {i < benefits.length - 1 && (
                  <span className="text-white/30 ml-8 lg:ml-12 select-none">·</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Visualização Mobile (rotativa) */}
        <div className="md:hidden flex items-center justify-center relative min-h-[22px]">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            const isActive = i === activeIndex;
            return (
              <div
                key={i}
                className={`flex items-center justify-center gap-2 transition-all duration-500 absolute inset-0 ${
                  isActive
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-amarelo shrink-0" />
                <span className="text-center">{b.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
