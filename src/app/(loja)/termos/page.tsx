import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Uso e Condições de Compra | Markah Brasil",
  description:
    "Confira os Termos e Condições Gerais de Uso e Compra da loja virtual Markah Brasil, especializada em iluminação e design em impressão 3D autoral.",
};

export default function TermosPage() {
  return (
    <div className="space-y-12 md:space-y-16 pb-20">
      {/* 1. Hero */}
      <section className="bg-surface-alt/70 border-b border-border py-14 md:py-18">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violeta/10 text-violeta text-xs font-semibold uppercase tracking-wider font-mono">
              <FileText className="w-3.5 h-3.5" />
              <span>Condições Contratuais</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight leading-[1.15]">
              Termos de Uso & Condições de Compra
            </h1>

            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              Bem-vindo à Markah Brasil. Ao acessar nosso site ou efetuar pedidos em nossa loja virtual, você concorda expressamente com os presentes Termos e Condições.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Conteúdo Formal */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-10 text-sm leading-relaxed text-text">
          {/* 1. Natureza dos Produtos */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              1. Natureza dos Produtos em Impressão 3D
            </h2>
            <p className="text-text-muted">
              Todas as peças comercializadas pela Markah Brasil são produzidas por processo de manufatura aditiva (impressão 3D FDM) sob encomenda. O cliente declara ciência de que:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-text-muted">
              <li>
                A textura com linhas horizontais e microestrias sutis é uma característica intrínseca e autoral da tecnologia de deposição de filamento, não constituindo defeito de fabricação.
              </li>
              <li>
                Pequenas variações de tonalidade entre lotes de polímeros (PLA ou PETG) e tolerâncias dimensionais de até ±0,8mm são naturais da manufatura sob demanda.
              </li>
              <li>
                As luminárias são projetadas para uso exclusivo com fontes de luz fria (lâmpadas LED). O uso de lâmpadas incandescentes ou de alta emissão térmica anula a garantia contra deformação.
              </li>
            </ul>
          </div>

          {/* 2. Pedidos e Prazos de Produção */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              2. Confirmação do Pedido e Prazos de Produção
            </h2>
            <p className="text-text-muted">
              A produção da peça tem início imediatamente após a confirmação da liquidação do pagamento pelo intermediador financeiro. O prazo de produção informado na página do produto (habitualmente de 3 dias úteis) antecede o prazo de transporte dos Correios ou da transportadora contratada.
            </p>
          </div>

          {/* 3. Preços, Cupons e Pagamentos */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              3. Preços, Promoções e Cupons de Desconto
            </h2>
            <p className="text-text-muted">
              Os preços são expressos em moeda corrente nacional (Real - R$) e incluem os tributos aplicáveis. Cupons promocionais possuem regras de elegibilidade específicas (valor mínimo, validade e limite de utilizações) e não são cumulativos entre si, salvo expressa indicação em campanhas comerciais.
            </p>
          </div>

          {/* 4. Propriedade Intelectual */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              4. Propriedade Intelectual e Direitos Autorais
            </h2>
            <p className="text-text-muted">
              Todo o conteúdo deste site — incluindo projetos 3D, modelos tridimensionais, fotografias autorais, logotipos, elementos gráficos e textos — é de titularidade exclusiva da Markah Brasil ou licenciado para o seu uso. É expressamente vedada a reprodução, cópia, engenharia reversa de arquivos 3D ou exploração comercial desautorizada sob as penas da Lei de Direitos Autorais (Lei 9.610/98) e da Lei de Propriedade Industrial (Lei 9.279/96).
            </p>
          </div>

          {/* 5. Foro e Legislação Aplicável */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              5. Legislação Aplicável e Foro
            </h2>
            <p className="text-text-muted">
              Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial o Código de Defesa do Consumidor (Lei 8.078/90) e o Marco Civil da Internet (Lei 12.965/14). Para dirimir eventuais controvérsias decorrentes deste contrato, as partes elegem o Foro da Comarca de São Paulo/SP, ressalvada a faculdade do consumidor de optar pelo foro de seu domicílio.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
