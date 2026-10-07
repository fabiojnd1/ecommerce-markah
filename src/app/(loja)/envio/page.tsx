import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Clock, PackageCheck, Box, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Envio e Prazos de Produção | Markah Brasil",
  description:
    "Saiba como calculamos os prazos de produção sob demanda em impressão 3D e as condições de frete para todo o Brasil na Markah.",
};

export default function EnvioPage() {
  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* 1. Hero */}
      <section className="bg-surface-alt/70 border-b border-border py-16 md:py-20">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amarelo/15 text-neutral-800 text-xs font-semibold uppercase tracking-wider font-mono">
              <Truck className="w-3.5 h-3.5 text-amarelo" />
              <span>Logística & Prazos</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight leading-[1.15]">
              Envio e Prazos de Produção
            </h1>

            <p className="text-base text-text-muted leading-relaxed">
              Trabalhamos com transparência total. Como nossas peças são fabricadas sob demanda com impressão 3D de alta precisão, o prazo total que você vê no carrinho é a soma exata de <strong>Produção + Transporte</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Como Funciona o Prazo Total */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-surface border border-border shadow-card space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-display font-bold text-ink">
              Entenda o Prazo Total de Entrega
            </h2>
            <p className="text-xs text-text-muted">
              Fórmula clara para você acompanhar cada etapa do seu pedido com tranquilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Etapa 1 */}
            <div className="p-6 rounded-2xl bg-surface-alt/80 border border-border space-y-3 text-center md:text-left">
              <div className="w-10 h-10 rounded-xl bg-magenta/10 text-magenta flex items-center justify-center mx-auto md:mx-0">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold text-ink">
                1. Produção 3D Sob Demanda
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Até <strong>3 dias úteis</strong> para calibração, impressão das camadas, instalação elétrica e controle de qualidade individual.
              </p>
            </div>

            {/* Sinal de Mais */}
            <div className="text-center font-display font-bold text-2xl text-text-muted hidden md:block">
              +
            </div>

            {/* Etapa 2 */}
            <div className="p-6 rounded-2xl bg-surface-alt/80 border border-border space-y-3 text-center md:text-left">
              <div className="w-10 h-10 rounded-xl bg-verde/10 text-verde flex items-center justify-center mx-auto md:mx-0">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold text-ink">
                2. Transporte e Logística
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                De <strong>2 a 7 dias úteis</strong> dependendo da sua localidade e da modalidade escolhida (Sedex, PAC, Jadlog ou Loggi).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Frete Grátis e Transportadoras */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Frete Grátis */}
          <div className="p-8 rounded-3xl bg-surface border border-border shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-verde/10 text-verde flex items-center justify-center">
              <PackageCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-ink">
              Frete Grátis a partir de R$ 200
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Pedidos com subtotal a partir de <strong>R$ 200,00</strong> qualificam-se automaticamente para a modalidade de frete gratuito na finalização da compra.
            </p>
            <p className="text-xs text-text-muted">
              * O benefício é aplicado diretamente no carrinho e no checkout sem a necessidade de código de cupom.
            </p>
          </div>

          {/* Card Embalagem Segura */}
          <div className="p-8 rounded-3xl bg-surface border border-border shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violeta/10 text-violeta flex items-center justify-center">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-ink">
              Embalagem Especial e Reforçada
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Cada peça é acomodada em caixas duplas de papelão kraft reciclável com calços de proteção sob medida, garantindo que chegue impecável ao seu destino.
            </p>
            <p className="text-xs text-text-muted">
              * Caso ocorra qualquer avaria comprovada no transporte, substituímos o produto imediatamente sem custos.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Rastreamento */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-alt/70 border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-display font-bold text-ink">
              Deseja rastrear um pedido em andamento?
            </h3>
            <p className="text-xs sm:text-sm text-text-muted">
              Você pode consultar a linha do tempo da manufatura e o código de rastreamento com seu e-mail e número do pedido.
            </p>
          </div>
          <Link href="/rastreio">
            <Button variant="primary" size="lg" className="gap-2 whitespace-nowrap">
              <span>Rastrear Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
