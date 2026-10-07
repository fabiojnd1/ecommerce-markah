import { WHATSAPP_NUMBER } from "@/lib/site-config";
import type { Metadata } from "next";
import { RefreshCw, ShieldCheck, Clock, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Trocas e Devoluções | CDC | Markah Brasil",
  description:
    "Conheça seus direitos de troca e devolução na Markah Brasil. Respeito integral ao Código de Defesa do Consumidor com logística reversa sem custos.",
};

export default function TrocasPage() {
  const steps = [
    {
      num: "1",
      title: "Solicite em nossos canais",
      desc: "Envie uma mensagem no WhatsApp (+55 11 99999-9999) ou e-mail (contato@markah.com.br) informando o número do seu pedido e o motivo da troca ou devolução.",
    },
    {
      num: "2",
      title: "Receba a etiqueta de envio reverso",
      desc: "Nossa equipe emitirá uma autorização de postagem reversa dos Correios ou transportadora parceira sem nenhum custo para você.",
    },
    {
      num: "3",
      title: "Poste a peça embalada",
      desc: "Acomode o produto na embalagem original ou em caixa equivalente com proteção e leve à agência indicada.",
    },
    {
      num: "4",
      title: "Substituição ou Reembolso Integral",
      desc: "Assim que a peça for recebida em nossa oficina e passar pela conferência (até 2 dias úteis), efetuamos o envio de uma nova peça ou o reembolso integral imediato.",
    },
  ];

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* 1. Hero */}
      <section className="bg-surface-alt/70 border-b border-border py-16 md:py-20">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ciano/15 text-neutral-800 text-xs font-semibold uppercase tracking-wider font-mono">
              <RefreshCw className="w-3.5 h-3.5 text-ciano" />
              <span>Garantia de Satisfação</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight leading-[1.15]">
              Trocas e Devoluções
            </h1>

            <p className="text-base text-text-muted leading-relaxed">
              Compre com total segurança. A Markah Brasil atua em estrita conformidade com o <strong>Código de Defesa do Consumidor (CDC)</strong>. Se você não ficar 100% satisfeito, o processo de devolução é simples e descomplicado.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Direitos Principais */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Arrependimento */}
          <div className="p-8 sm:p-10 rounded-3xl bg-surface border border-border shadow-card space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-magenta/10 text-magenta flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-ink">
              Direito de Arrependimento (7 Dias)
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Conforme o <strong>Art. 49 do CDC</strong>, você tem até <strong>7 (sete) dias corridos</strong> a partir do recebimento físico do produto para solicitar a devolução e estorno integral do valor pago (incluindo o frete), sem qualquer ônus.
            </p>
            <div className="pt-2 text-xs text-text-muted space-y-1.5">
              <p className="flex items-center gap-2">
                <Check className="w-4 h-4 text-verde" /> O produto deve estar sem sinais de mau uso.
              </p>
              <p className="flex items-center gap-2">
                <Check className="w-4 h-4 text-verde" /> Logística reversa paga pela Markah.
              </p>
            </div>
          </div>

          {/* Card Garantia Legal */}
          <div className="p-8 sm:p-10 rounded-3xl bg-surface border border-border shadow-card space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-verde/10 text-verde flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-ink">
              Garantia de Manufatura (90 Dias)
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Todas as peças Markah possuem garantia legal de <strong>90 (noventa) dias</strong> contra vícios de fabricação, delaminação de camadas ou problemas elétricos em soquetes e fiações decorrentes do processo de montagem.
            </p>
            <div className="pt-2 text-xs text-text-muted space-y-1.5">
              <p className="flex items-center gap-2">
                <Check className="w-4 h-4 text-verde" /> Troca imediata por uma nova unidade.
              </p>
              <p className="flex items-center gap-2">
                <Check className="w-4 h-4 text-verde" /> Sem custos de frete adicionais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Passo a Passo */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-alt/70 border border-border space-y-8">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-magenta font-mono">
              Processo Transparente
            </span>
            <h3 className="text-2xl font-display font-bold text-ink mt-1">
              Como solicitar sua troca ou devolução
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st) => (
              <div key={st.num} className="p-5 rounded-2xl bg-surface border border-border space-y-2.5">
                <span className="w-8 h-8 rounded-full bg-ink text-white font-mono font-bold text-xs flex items-center justify-center">
                  {st.num}
                </span>
                <h4 className="text-sm font-bold text-ink">{st.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Canais para Iniciar */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-lg font-bold text-ink">Precisa de ajuda com uma devolução?</h3>
          <p className="text-xs text-text-muted">
            Fale diretamente com nosso setor de trocas no WhatsApp para receber sua etiqueta de postagem.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20uma%20troca%20ou%20devolu%C3%A7%C3%A3o.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button variant="primary" size="lg" className="gap-2">
              <MessageCircle className="w-5 h-5" />
              <span>Falar com Atendimento de Trocas</span>
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
