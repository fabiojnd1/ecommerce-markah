import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, ShieldCheck, Thermometer, Droplets, Sun, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Materiais & Sustentabilidade | PLA e PETG | Markah Brasil",
  description:
    "Entenda os materiais utilizados nas peças Markah: PLA biodegradável de base vegetal e PETG de alta resistência mecânica e térmica.",
};

export default function MateriaisPage() {
  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* 1. Hero */}
      <section className="bg-surface-alt/70 border-b border-border py-16 md:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-verde/10 text-verde text-xs font-semibold uppercase tracking-wider font-mono">
              <Leaf className="w-3.5 h-3.5" />
              <span>Sustentabilidade & Matéria-Prima</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight leading-[1.15]">
              Materiais ecológicos selecionados para durabilidade e poesia visual.
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed">
              Na Markah, recusamos o plástico descartável e os métodos poluentes de fabricação em massa. Nossas peças utilizam filamentos nobres com parâmetros de pureza rigorosos, assegurando estabilidade dimensional e difusão de luz harmoniosa.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Comparativo dos Materiais */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card PLA */}
          <div className="p-8 sm:p-10 rounded-3xl bg-surface border-2 border-verde/20 shadow-card space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-verde text-white uppercase tracking-wider">
                Base Vegetal
              </span>
              <span className="text-xs text-text-muted font-mono">Uso interno ideal</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink">
              PLA (Ácido Polilático)
            </h2>

            <p className="text-sm text-text-muted leading-relaxed">
              O PLA é um biopolímero termoplástico derivado de fontes vegetais 100% renováveis, como o amido de milho e a cana-de-açúcar. É o material de assinatura de nossas luminárias e objetos decorativos.
            </p>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                Destaques do Material:
              </h4>
              <ul className="space-y-2.5 text-sm text-text">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-verde shrink-0" />
                  <span>Origem 100% renovável e biodegradável em usinas de compostagem</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-verde shrink-0" />
                  <span>Difusão de luz translúcida suave, sem pontos cegos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-verde shrink-0" />
                  <span>Atóxico e inodoro, seguro para quartos e ambientes fechados</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-verde shrink-0" />
                  <span>Acabamento acetinado mate de alto refinamento tátil</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card PETG */}
          <div className="p-8 sm:p-10 rounded-3xl bg-surface border-2 border-violeta/20 shadow-card space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-violeta text-white uppercase tracking-wider">
                Alta Resistência
              </span>
              <span className="text-xs text-text-muted font-mono">Uso interno e externo</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink">
              PETG (Polietileno Tereftalato Glicol)
            </h2>

            <p className="text-sm text-text-muted leading-relaxed">
              O PETG combina a tenacidade e resistência mecânica com a facilidade de reciclagem. Ideal para vasos que armazenam água, organizadores pesados e letreiros comerciais.
            </p>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                Destaques do Material:
              </h4>
              <ul className="space-y-2.5 text-sm text-text">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-violeta shrink-0" />
                  <span>Resistência superior a impactos e quedas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-violeta shrink-0" />
                  <span>Impermeabilidade natural para contato com água</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-violeta shrink-0" />
                  <span>Suporta temperaturas de até 75°C sem deformação</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-violeta shrink-0" />
                  <span>100% reciclável na cadeia padrão de plásticos</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Guia de Cuidados e Conservação */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-alt/70 border border-border space-y-8">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-magenta font-mono">
              Durabilidade Longa
            </span>
            <h3 className="text-2xl font-display font-bold text-ink mt-1">
              Como cuidar das suas peças Markah
            </h3>
            <p className="text-sm text-text-muted mt-1">
              Recomendações simples para manter sua peça perfeita por anos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2.5">
              <Thermometer className="w-6 h-6 text-amarelo" />
              <h4 className="text-sm font-bold text-ink">Utilize lâmpadas LED</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Recomendamos exclusivamente lâmpadas LED (frias). Nunca utilize lâmpadas incandescentes ou halógenas que aquecem excessivamente.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2.5">
              <Droplets className="w-6 h-6 text-ciano" />
              <h4 className="text-sm font-bold text-ink">Limpeza fácil</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Utilize apenas um pano macio levemente umedecido em água ou detergente neutro. Não utilize solventes, álcool 70% ou esponjas abrasivas.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2.5">
              <Sun className="w-6 h-6 text-laranja" />
              <h4 className="text-sm font-bold text-ink">Luz solar direta</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Peças em PLA devem ser preservadas da incidência direta de sol intenso prolongado para evitar amolecimento térmico acima de 55°C.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2.5">
              <ShieldCheck className="w-6 h-6 text-verde" />
              <h4 className="text-sm font-bold text-ink">Garantia Markah</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Garantimos a integridade de impressão de cada camada contra delaminação estrutural por 90 dias após o recebimento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Link href="/produtos">
          <Button variant="primary" size="lg" className="gap-2">
            <span>Explorar Peças em PLA & PETG</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
