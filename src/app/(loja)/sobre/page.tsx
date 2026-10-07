import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Layers, Leaf, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sobre a Markah | Design Autoral & Impressão 3D",
  description:
    "Conheça a história da Markah Brasil. Nascida da paixão pela fusão entre geometria, luz e manufatura aditiva consciente.",
};

export default function SobrePage() {
  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* 1. Hero Institucional */}
      <section className="relative overflow-hidden bg-surface-alt/70 border-b border-border py-16 md:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-magenta/10 text-magenta text-xs font-semibold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manifesto & Origens</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-ink tracking-tight leading-[1.15]">
              Redefinindo o design de interiores através da luz e da tecnologia.
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed">
              A Markah Brasil nasceu do desejo de unir a precisão da manufatura aditiva 3D à poética do design escultural contemporâneo. Cada peça é concebida não como um objeto em massa, mas como uma escultura luminosa funcional feita sob demanda.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Pilares de Criação */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-xl bg-magenta/10 text-magenta flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-ink">
              Design Paramétrico Autoral
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Exploramos curvas orgânicas, sombras facetadas e padrões biomiméticos que seriam impossíveis de alcançar através de moldes tradicionais de injeção.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-xl bg-verde/10 text-verde flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-ink">
              Manufatura Consciente
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Trabalhamos exclusivamente sob demanda: sua peça começa a ser impressa quando você faz o pedido. Zero estoque parado, zero desperdício de matéria-prima.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface border border-border shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violeta/10 text-violeta flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-ink">
              100% Feito no Brasil
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Valorizamos o talento técnico e criativo nacional. Todas as etapas de modelagem, impressão 3D, fiação e acabamento artesanal são executadas em nossa oficina em São Paulo.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Narrativa da Marca */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 md:p-14 rounded-3xl bg-surface-alt/70 border border-border space-y-8">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-text-muted font-mono">
              Nossa Trajetória
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink">
              De um protótipo em laboratório a ambientes transformados por todo o país.
            </h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              O que começou como um experimento com filamentos termoplásticos vegetais e luz difusa rapidamente chamou a atenção de arquitetos, designers de interiores e entusiastas de decoração contemporânea.
            </p>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              Hoje, centenas de residências, cafés autorais, escritórios e estúdios de design iluminam seus espaços com a atmosfera acolhedora e única que apenas as camadas de alta precisão da Markah conseguem proporcionar.
            </p>
          </div>

          {/* Números de Impacto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-border">
            <div>
              <span className="text-3xl sm:text-4xl font-display font-extrabold text-ink">
                +1.200
              </span>
              <p className="text-xs text-text-muted mt-1">Peças autorais impressas</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-display font-extrabold text-verde">
                100%
              </span>
              <p className="text-xs text-text-muted mt-1">Polímeros de base vegetal e PETG</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-display font-extrabold text-magenta">
                4.9 ★
              </span>
              <p className="text-xs text-text-muted mt-1">Satisfação média dos clientes</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-display font-extrabold text-violeta">
                3 dias
              </span>
              <p className="text-xs text-text-muted mt-1">Tempo médio de manufatura ágil</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA Final */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            Pronto para transformar a atmosfera do seu ambiente?
          </h2>
          <p className="text-sm text-text-muted">
            Explore nossa coleção completa de luminárias, vasos e objetos esculturais.
          </p>
          <div>
            <Link href="/produtos">
              <Button variant="primary" size="lg" className="gap-2">
                <span>Ver Catálogo Completo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
