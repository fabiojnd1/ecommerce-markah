"use client";

import { WHATSAPP_NUMBER } from "@/lib/site-config";

import { useState } from "react";
import { MessageCircle, Mail, MapPin, Clock, Send, CheckCircle2, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContatoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    }, 1500);
  }

  const faqs = [
    {
      q: "Qual é o prazo de entrega dos pedidos?",
      a: "Nossas peças são produzidas sob demanda em até 3 dias úteis. A este prazo soma-se o tempo da transportadora (Sedex, PAC ou Jadlog), informado no momento do cálculo de frete.",
    },
    {
      q: "As luminárias já acompanham lâmpada?",
      a: "A maioria das peças possui soquete universal padrão E27 ou G9, permitindo que você escolha sua temperatura de cor preferida (recomendamos luz quente 2700K ou 3000K). As especificações exatas constam na página de cada produto.",
    },
    {
      q: "Posso solicitar uma cor ou tamanho personalizado?",
      a: "Sim! Trabalhamos com encomendas especiais e personalizações para projetos de arquitetura e interiores. Fale diretamente com nossa equipe técnica pelo WhatsApp.",
    },
    {
      q: "Como funciona a garantia e a política de trocas?",
      a: "Oferecemos 7 dias corridos para devolução por arrependimento com logística reversa sem custos para você, além de 90 dias de garantia contra qualquer defeito de fabricação.",
    },
  ];

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* 1. Hero */}
      <section className="bg-surface-alt/70 border-b border-border py-16 md:py-20">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-magenta/10 text-magenta text-xs font-semibold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Atendimento Exclusivo</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight leading-[1.15]">
              Fale Conosco
            </h1>

            <p className="text-base text-text-muted leading-relaxed">
              Dúvidas sobre uma peça, prazos, especificações técnicas para seu projeto ou personalizações sob medida? Nossa equipe de designers está pronta para atendê-lo.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Canais Diretos + Formulário de Mensagem */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Coluna da Esquerda: Canais Rápidos */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xl font-display font-bold text-ink">
              Canais Oficiais de Atendimento
            </h2>

            <div className="space-y-4">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20o%20atendimento%20da%20Markah%20Brasil.`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl bg-surface border border-border shadow-subtle hover:border-verde/40 transition-colors flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-verde/10 text-verde flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">WhatsApp Oficial</h4>
                  <p className="text-xs text-text-muted mt-0.5 font-mono">+55 (11) 99999-9999</p>
                  <p className="text-[11px] text-verde font-semibold mt-1">Resposta rápida em horário comercial</p>
                </div>
              </a>

              <a
                href="mailto:contato@markah.com.br"
                className="p-5 rounded-2xl bg-surface border border-border shadow-subtle hover:border-magenta/40 transition-colors flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-magenta/10 text-magenta flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">E-mail Comercial & Suporte</h4>
                  <p className="text-xs text-text-muted mt-0.5 font-mono">contato@markah.com.br</p>
                  <p className="text-[11px] text-text-muted mt-1">Retorno em até 24 horas úteis</p>
                </div>
              </a>

              <div className="p-5 rounded-2xl bg-surface border border-border shadow-subtle flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amarelo/10 text-amarelo flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">Horário de Operação</h4>
                  <p className="text-xs text-text-muted mt-0.5">Segunda a Sexta-feira</p>
                  <p className="text-xs text-text font-medium mt-0.5 font-mono">09:00 às 18:00 (Brasília)</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border shadow-subtle flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violeta/10 text-violeta flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">Oficina de Manufatura</h4>
                  <p className="text-xs text-text-muted mt-0.5">São Paulo, SP — Brasil</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Produção sob encomenda com envio para todo o território nacional</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Formulário de Mensagem */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl bg-surface border border-border shadow-card">
              <h3 className="text-xl font-display font-bold text-ink mb-2">
                Envie uma Mensagem
              </h3>
              <p className="text-xs text-text-muted mb-6">
                Preencha o formulário abaixo que retornaremos em breve no seu e-mail ou WhatsApp.
              </p>

              {submitted ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-14 h-14 mx-auto rounded-full bg-verde/10 text-verde flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-ink">
                    Mensagem Recebida com Sucesso!
                  </h4>
                  <p className="text-sm text-text-muted max-w-sm mx-auto">
                    Obrigado pelo contato! Nossa equipe técnica responderá sua solicitação em até 24 horas úteis.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubmitted(false)}
                    className="mt-4"
                  >
                    Enviar outra mensagem
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                        Seu Nome *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Lucas Medeiros"
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-sm focus:outline-none focus:border-ink bg-surface"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="lucas@exemplo.com"
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-sm focus:outline-none focus:border-ink bg-surface"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                        WhatsApp / Celular
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-sm focus:outline-none focus:border-ink bg-surface font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                        Assunto *
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Ex: Dúvida sobre Luminária Saturno"
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-sm focus:outline-none focus:border-ink bg-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                      Sua Mensagem *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Conte para nós como podemos te ajudar..."
                      className="w-full p-3.5 rounded-xl border border-border text-sm focus:outline-none focus:border-ink bg-surface resize-none"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="lg" className="w-full gap-2">
                    <Send className="w-4 h-4" />
                    <span>Enviar Mensagem</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dúvidas Frequentes (FAQ Rápido) */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-alt/70 border border-border space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-magenta/10 text-magenta flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-ink">
                Perguntas Frequentes
              </h3>
              <p className="text-xs text-text-muted">
                Respostas rápidas para as dúvidas mais comuns de nossos clientes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                <h4 className="text-sm font-bold text-ink">{faq.q}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
