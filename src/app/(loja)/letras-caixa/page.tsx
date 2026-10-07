import type { Metadata } from "next";
import { MessageCircle, Lightbulb, Ruler, Palette } from "lucide-react";
import { whatsappLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Letras-caixa sob medida | Markah Brasil",
  description:
    "Letras-caixa impressas em 3D, com ou sem LED, para fachadas, eventos, quartos e lojas. Peça seu orçamento.",
};

/**
 * Página provisória da seção Letras-caixa (PRD §6).
 * O formulário de orçamento com gestão no admin é a Fase 9 (v1.1.0).
 * Enquanto isso, o pedido de orçamento segue pelo WhatsApp e o link do menu não leva a um 404.
 */
export default function LetrasCaixaPage() {
  const quoteLink = whatsappLink(
    "Olá! Gostaria de um orçamento de letras-caixa. Texto: ___ | Altura das letras: ___ cm | Com LED? ___ | Uso interno ou externo? ___"
  );

  return (
    <div className="pb-20">
      <section className="bg-ink text-white py-16 md:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl space-y-6">
          <span className="inline-block px-3 py-1 rounded-full bg-violeta text-white text-xs font-semibold uppercase tracking-wider">
            Sob medida
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-bold leading-tight">
            Letras-caixa com a sua palavra, do seu tamanho.
          </h1>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed">
            Impressas em 3D, com ou sem LED, para fachadas, eventos, quartos e lojas. Conte o que você
            precisa e respondemos com o orçamento.
          </p>
          <a
            href={quoteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-ink font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Pedir orçamento pelo WhatsApp
          </a>
        </div>
      </section>

      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl font-display font-semibold text-ink mb-8">O que informar no orçamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Ruler,
              title: "Texto e tamanho",
              text: "A palavra ou frase e a altura desejada das letras, em centímetros.",
            },
            {
              icon: Palette,
              title: "Cor e fonte",
              text: "A cor da peça e o estilo de letra. Mostramos as opções de fonte disponíveis.",
            },
            {
              icon: Lightbulb,
              title: "Iluminação e uso",
              text: "Com ou sem LED, e se a peça fica em ambiente interno ou externo.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="p-6 rounded-card bg-surface border border-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violeta/10 text-violeta flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-display font-semibold text-ink">{title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
