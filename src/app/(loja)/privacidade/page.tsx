import type { Metadata } from "next";
import { ShieldCheck, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade & LGPD | Markah Brasil",
  description:
    "Conheça a Política de Privacidade e Proteção de Dados Pessoais da Markah Brasil em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).",
};

export default function PrivacidadePage() {
  return (
    <div className="space-y-12 md:space-y-16 pb-20">
      {/* 1. Hero */}
      <section className="bg-surface-alt/70 border-b border-border py-14 md:py-18">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-verde/10 text-verde text-xs font-semibold uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conformidade Legal (Lei 13.709/2018)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight leading-[1.15]">
              Política de Privacidade & LGPD
            </h1>

            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              Última atualização: 23 de setembro de 2026. A <strong>Markah Brasil</strong> tem o compromisso inegociável de zelar pela privacidade, sigilo e segurança dos dados pessoais de seus clientes e usuários.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Conteúdo Formal */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-10 text-sm leading-relaxed text-text">
          {/* Seção 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              1. Identificação do Controlador
            </h2>
            <p className="text-text-muted">
              O controlador responsável pelo tratamento de dados pessoais no âmbito da loja virtual Markah Brasil é a empresa desenvolvedora e operadora da marca no Brasil, com sede em São Paulo/SP, canal de atendimento pelo e-mail <strong>privacidade@markah.com.br</strong>.
            </p>
          </div>

          {/* Seção 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              2. Dados Coletados e Finalidades
            </h2>
            <p className="text-text-muted">
              Coletamos apenas as informações estritamente indispensáveis para o cumprimento das obrigações de compra e venda:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-text-muted">
              <li>
                <strong>Dados Cadastrais e de Identificação:</strong> Nome completo, CPF, e-mail e telefone de contato. Finalidade: identificação do comprador, emissão de declarações de transporte e comunicação sobre o pedido.
              </li>
              <li>
                <strong>Dados de Endereço e Entrega:</strong> Logradouro, número, complemento, bairro, cidade, estado e CEP. Finalidade: expedição do pacote físico através do parceiro logístico (Melhor Envio, Correios ou transportadoras privadas).
              </li>
              <li>
                <strong>Dados de Pagamento:</strong> Processados em ambiente criptografado e seguro diretamente pelo gateway <strong>Mercado Pago</strong> (certificado PCI-DSS). A Markah <em>não armazena</em> dados de cartão de crédito em seus servidores.
              </li>
              <li>
                <strong>Dados de Navegação e Cookies:</strong> Preferências de favoritos, itens no carrinho e métricas anonimizadas de audiência para aprimorar a experiência de compra.
              </li>
            </ul>
          </div>

          {/* Seção 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              3. Compartilhamento Seguro de Dados
            </h2>
            <p className="text-text-muted">
              A Markah Brasil <strong>não comercializa, aluga ou compartilha</strong> seus dados com terceiros para fins de marketing ou publicidade indiscriminada. O compartilhamento ocorre exclusivamente com os operadores técnicos essenciais à entrega da compra:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-text-muted">
              <li>Transportadoras e plataformas logísticas (Melhor Envio, Correios, Jadlog, Loggi) para realização da entrega;</li>
              <li>Processadores de pagamento autorizados (Mercado Pago) para autenticação das transações financeiras;</li>
              <li>Provedores de infraestrutura de computação em nuvem com conformidade de segurança e criptografia TLS 1.3.</li>
            </ul>
          </div>

          {/* Seção 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              4. Direitos do Titular de Dados (Art. 18 da LGPD)
            </h2>
            <p className="text-text-muted">
              A qualquer momento, o titular dos dados pode solicitar gratuitamente à Markah Brasil:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-text-muted">
              <li>Confirmação da existência de tratamento de seus dados;</li>
              <li>Acesso aos dados pessoais armazenados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Eliminação dos dados pessoais tratados mediante consentimento (salvo prazos de guarda obrigatórios exigidos por lei para fins fiscais e contábeis);</li>
              <li>Revogação do consentimento concedido para cookies e notificações.</li>
            </ul>
          </div>

          {/* Seção 5 */}
          <div className="space-y-3">
            <h2 className="text-lg font-display font-bold text-ink">
              5. Segurança da Informação
            </h2>
            <p className="text-text-muted">
              Adotamos práticas técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não autorizados, destruição acidental, perda ou qualquer forma de tratamento ilícito. Toda a transmissão de dados no site é criptografada via protocolo HTTPS/SSL.
            </p>
          </div>

          {/* Seção 6 */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-subtle space-y-3">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Mail className="w-4 h-4 text-magenta" />
              <span>Canal do Encarregado de Dados (DPO)</span>
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Para exercer seus direitos de titular ou esclarecer qualquer dúvida sobre o tratamento de dados pessoais na Markah Brasil, envie uma mensagem diretamente ao nosso Encarregado pelo e-mail:
            </p>
            <p className="text-sm font-mono font-bold text-magenta">
              privacidade@markah.com.br
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
