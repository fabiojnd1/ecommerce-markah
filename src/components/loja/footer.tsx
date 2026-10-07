import { WHATSAPP_NUMBER } from "@/lib/site-config";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Truck, RefreshCw, CreditCard, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-ink text-white border-t border-white/10 mt-16 lg:mt-24">
      {/* Faixa de Garantias e Confiança */}
      <div className="border-b border-white/10 py-10 bg-black/25">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-amarelo">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Frete Grátis</h4>
                <p className="text-xs text-white/60">Em compras a partir de R$ 200</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-verde">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">5% OFF no Pix</h4>
                <p className="text-xs text-white/60">Ou até 3x sem juros no cartão</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-ciano">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Troca Garantida</h4>
                <p className="text-xs text-white/60">7 dias para troca ou devolução</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-magenta">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Compra 100% Segura</h4>
                <p className="text-xs text-white/60">Processada pelo Mercado Pago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal do Rodapé */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-5">
          {/* Apresentação da Marca */}
          <div className="col-span-2 space-y-4 lg:col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="/brand/markah-logo-branco.png"
                alt="Markah Brasil"
                width={129}
                height={64}
                className="h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-white/70 max-w-sm leading-relaxed">
              Design autoral e objetos decorativos impressos em 3D de alta precisão.
              Luminárias, vasos e peças exclusivas produzidas com responsabilidade e cuidado no Brasil.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com/markah_br"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @markah_br"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-magenta hover:text-white flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4 fill-none stroke-current stroke-2"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fale conosco no WhatsApp"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-verde hover:text-white flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categorias */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-4 font-mono">
              Catálogo
            </h3>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <Link href="/luminarias-de-mesa" className="hover:text-white transition-colors">
                  Luminárias de mesa
                </Link>
              </li>
              <li>
                <Link href="/pendentes" className="hover:text-white transition-colors">
                  Pendentes
                </Link>
              </li>
              <li>
                <Link href="/vasos" className="hover:text-white transition-colors">
                  Vasos e Cachepôs
                </Link>
              </li>
              <li>
                <Link href="/organizadores" className="hover:text-white transition-colors">
                  Organizadores
                </Link>
              </li>
              <li>
                <Link href="/letras-caixa" className="text-violeta font-semibold hover:brightness-125 transition-colors">
                  Letras-caixa (Sob medida)
                </Link>
              </li>
            </ul>
          </div>

          {/* Institucional e Tecnologia */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-4 font-mono">
              Sobre a Marca
            </h3>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <Link href="/sobre" className="hover:text-white transition-colors">
                  Sobre a Markah
                </Link>
              </li>
              <li>
                <Link href="/materiais" className="hover:text-white transition-colors">
                  Materiais (PLA & PETG)
                </Link>
              </li>
              <li>
                <Link href="/tecnologia-3d" className="hover:text-white transition-colors">
                  Tecnologia de Impressão 3D
                </Link>
              </li>
              <li>
                <Link href="/rastreio" className="hover:text-white transition-colors">
                  Rastrear meu Pedido
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-white transition-colors">
                  Fale Conosco
                </Link>
              </li>
            </ul>
          </div>

          {/* Políticas e Ajuda */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-4 font-mono">
              Políticas & Termos
            </h3>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <Link href="/envio" className="hover:text-white transition-colors">
                  Política de Envio e Prazo
                </Link>
              </li>
              <li>
                <Link href="/trocas" className="hover:text-white transition-colors">
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-white transition-colors">
                  Privacidade (LGPD)
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha Divisória */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-xs text-white/50">
          <div>
            <p>© {new Date().getFullYear()} Markah Brasil. Todos os direitos reservados.</p>
            <p className="mt-1">
              Peças artesanais e decorativas impressas em 3D. Produzido com orgulho no Brasil.
            </p>
          </div>

          {/* Formas de Pagamento Aceitas */}
          <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="font-semibold text-white/70">Pagamento:</span>
            <div className="flex flex-wrap items-center gap-2 text-white/80">
              <span className="px-2 py-1 bg-white/10 rounded font-semibold text-verde text-[11px]">PIX</span>
              <span className="px-2 py-1 bg-white/10 rounded text-[11px]">Cartão até 3x</span>
              <span className="px-2 py-1 bg-white/10 rounded text-[11px]">Mercado Pago</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
