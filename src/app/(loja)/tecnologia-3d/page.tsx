import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tecnologia de Impressão 3D | Manufatura Aditiva | Markah Brasil",
  description:
    "Descubra como a tecnologia aditiva 3D da Markah transforma código geométrico em esculturas luminosas palpáveis e exclusivas.",
};

export default function Tecnologia3DPage() {
  const steps = [
    {
      number: "01",
      title: "Modelagem Paramétrica Digital",
      description:
        "Projetamos cada modelo em software 3D avançado com algoritmos matemáticos que calculam a dispersão da luz e a resistência mecânica de cada nervura.",
    },
    {
      number: "02",
      title: "Fatiamento de Micrométricas Camadas",
      description:
        "O modelo digital é dividido em centenas de camadas de 0.20mm. Definimos densidades de preenchimento internas que maximizam a difusão da luminosidade sem projetar sombras escuras.",
    },
    {
      number: "03",
      title: "Extrusão Térmica de Alta Precisão",
      description:
        "Nossas impressoras de última geração operam em ambiente controlado, depositando o polímero vegetal aquecido a 210°C com repetibilidade milimétrica.",
    },
    {
      number: "04",
      title: "Inspeção e Acabamento Manual",
      description:
        "Cada peça é retirada e inspecionada sob luz rasante por nossos artesãos técnicos. Fios elétricos certificados e soquetes padrão E27 ou G9 são instalados e testados individualmente.",
    },
  ];

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* 1. Hero */}
      <section className="bg-surface-alt/70 border-b border-border py-16 md:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violeta/10 text-violeta text-xs font-semibold uppercase tracking-wider font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>Inovação Aditiva</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight leading-[1.15]">
              O encontro da geometria computacional com a arte tátil da luz.
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed">
              A manufatura aditiva nos liberta das limitações do maquinário convencional. Criamos geometrias impossíveis de desmoldar, com texturas táteis que brincam com o feixe luminoso de forma poética.
            </p>
          </div>
        </div>
      </section>

      {/* 2. O Processo Passo a Passo */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-magenta font-mono">
            Do Código ao Objeto
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            O ciclo de criação de uma peça Markah
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-4 shadow-subtle hover:border-violeta/40 transition-colors"
            >
              <span className="text-3xl font-display font-extrabold text-violeta font-mono">
                {step.number}
              </span>
              <h3 className="text-base font-display font-bold text-ink">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Vantagens da Manufatura Aditiva */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-surface-alt/70 border border-border">
          <div className="max-w-3xl space-y-6">
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-ink">
              Por que a impressão 3D é o futuro do design de objetos?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-verde" />
                  <span>Personalização e Exclusividade</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Permite variações infinitas de cores, alturas e diâmetros sem a necessidade de novos moldes caros e poluentes.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-verde" />
                  <span>Zero Desperdício de Sobras</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Ao contrário da usinagem que remove material até esculpir a peça, a impressão 3D adiciona somente a quantidade exata de matéria-prima necessária.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-verde" />
                  <span>Textura de Camada Única</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  As microestrias formadas pela deposição do filamento funcionam como prismas microscópicos que quebram a luz de forma agradável e aveludada.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-verde" />
                  <span>Evolução Contínua dos Modelos</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Atualizamos parâmetros de resistência e espessura a cada feedback de cliente sem interromper a cadeia de manufatura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Link href="/produtos">
          <Button variant="primary" size="lg" className="gap-2">
            <span>Conheça Nossos Modelos</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
