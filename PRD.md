# PRD — Ecommerce Markah

> "O que estamos construindo?" Versão do documento: 1.0 — 23/09/2026

## 1. Visão

Loja online da **Markah Brasil** para vender peças decorativas impressas em 3D — luminárias, vasos, cachepôs, plantários, organizadores e letras-caixa — diretamente ao consumidor, a arquitetos/decoradores e a lojistas. A loja é nova e seu desempenho vai definir a profissionalização do negócio (CNPJ, escala de produção), então o objetivo é **lançar rápido, com custo baixo e sem retrabalho** quando o negócio crescer.

Referência de estrutura e experiência: ettoredecor.com.br (vitrine por tipo de produto, barra de benefícios, galeria de clientes, páginas institucionais sobre material e tecnologia 3D, WhatsApp).

## 2. Objetivos do lançamento

- Catálogo com ~50 produtos e suas variações (tamanho, cor, textura).
- Compra completa sem intervenção manual: carrinho → frete → pagamento (Pix/cartão) → pedido no painel.
- Painel admin para o dono cadastrar produtos e gerenciar pedidos sozinho.
- Canal de conversão a partir do Instagram (@markah_br), com foco em celular.

**Fora do escopo do lançamento:** configurador 3D no site, fotos geradas por IA, marketplace, app mobile, emissão automática de nota fiscal (ver §9).

## 3. Públicos

| Público | Necessidade | Como o site atende |
|---|---|---|
| Consumidor final | Comprar peça bonita com segurança | Vitrine, fotos, avaliações, Pix com desconto, parcelamento |
| Arquiteto / decorador | Especificar peças para projetos | Fichas técnicas (dimensões, material, soquete, potência), contato via WhatsApp |
| Lojista | Comprar em quantidade | Contato comercial via WhatsApp/formulário (tabela de atacado: fase futura) |

## 4. Catálogo

### 4.1 Categorias do lançamento
- Luminárias de mesa
- Pendentes
- Vasos
- Cachepôs
- Plantários
- Organizadores
- **Letras-caixa** — seção separada (ver §6)

Categorias são cadastráveis pelo admin (nome, slug, imagem, ordem, ativa/inativa). Um produto pode ter uma categoria principal e aparecer em **coleções** (ex.: Lançamentos, Mais vendidos, Kits).

### 4.2 Produto
- Nome, slug, descrição, categoria, coleções, fotos (várias, ordenáveis, com texto alternativo), vídeo opcional.
- Ficha técnica: dimensões (A × L × P em cm), peso, material (PLA/PETG), para luminárias: tipo de soquete (ex.: E27), potência máxima recomendada, lâmpada inclusa ou não, comprimento do cabo; para vasos: se é vedado para água / tem reservatório.
- Flag "material reciclado/sustentável" (destaque secundário, não principal).
- Status: rascunho, ativo, arquivado.
- SEO: título, descrição, imagem de compartilhamento.

### 4.3 Variações
- Cada produto tem **opções** (ex.: Tamanho, Cor, Textura, Cor do cabo, Lâmpada inclusa) e cada combinação válida é uma **variação** com preço próprio, SKU, peso/dimensões de envio e foto opcional.
- O preço pode mudar por variação.
- Combinações podem ser desativadas individualmente (ex.: textura X não existe no tamanho P).
- Cores são exibidas como amostras (bolinhas) com nome.

### 4.4 Produção sob demanda
- Não há controle de estoque físico no lançamento: toda peça é produzida após o pedido.
- **Prazo de produção padrão: 3 dias úteis**, configurável globalmente e por produto.
- Prazo exibido ao cliente = produção + prazo da transportadora (ver §5.3).
- O admin pode pausar um produto/variação ("indisponível no momento").

## 5. Regras de negócio

### 5.1 Preço e promoções
- Valores em centavos, calculados sempre no servidor (`pricing.ts`).
- **Desconto no Pix**: percentual global configurável no admin (padrão sugerido: 5%), aplicado sobre os produtos (não sobre o frete), mostrado na página do produto ("R$ X no Pix").
- **Parcelamento no cartão**: número máximo de parcelas sem juros configurável (padrão sugerido: 3x); acima disso, juros do Mercado Pago repassados ao cliente.
- **Cupons**: código, tipo (percentual / valor fixo / frete grátis), valor, pedido mínimo, validade (início/fim), limite total de usos, limite por cliente, restrição opcional por categoria ou produto, ativo/inativo.
- **Kits**: produto composto por outros produtos/variações com preço próprio (ex.: "Dupla de pendentes"), exibindo o preço cheio riscado e a economia.
- **Preço promocional** por variação (preço "de/por") com data de fim opcional.
- Ordem de aplicação: preço da variação → preço promocional → kit → cupom → desconto Pix. Cupom e desconto Pix são **cumulativos** por padrão; o admin pode marcar um cupom como "não cumulativo com Pix".

### 5.2 Frete
- Cálculo via **Melhor Envio** (Correios PAC/SEDEX e transportadoras habilitadas), usando CEP de origem, CEP do cliente, peso e dimensões das variações no carrinho.
- Calculadora de frete na página do produto e no carrinho.
- **Frete grátis a partir de R$ 200,00** em produtos (após descontos, antes do frete), válido para a opção mais barata; o valor mínimo é configurável no admin.
- Barra de progresso no carrinho: "Faltam R$ X para frete grátis".
- Retirada em mãos: desativada no lançamento (configurável depois).

### 5.3 Prazo
- Prazo exibido = prazo de produção (3 dias úteis) + prazo da transportadora.
- Texto padrão: "Produzido em até 3 dias úteis + entrega em X dias úteis".

### 5.4 Pagamento (Mercado Pago)
- Métodos: **Pix** e **cartão de crédito** (boleto opcional, desativado no lançamento).
- Checkout transparente no próprio site (Payment Brick), para que o desconto Pix seja aplicado quando o cliente escolhe Pix.
- Pix: QR Code e copia-e-cola na página de confirmação, com expiração (padrão 30 min) e atualização automática do status.
- Confirmação de pagamento **somente via webhook** validado.

### 5.5 Ciclo de vida do pedido
`AGUARDANDO_PAGAMENTO → PAGO → EM_PRODUCAO → PRONTO_PARA_ENVIO → ENVIADO → ENTREGUE`
Estados laterais: `CANCELADO`, `PAGAMENTO_RECUSADO`, `REEMBOLSADO`.
- Pedido não pago expira após o prazo do Pix (cancelamento automático).
- Cada mudança de status gera registro no histórico do pedido e, quando relevante, e-mail ao cliente.
- Ao marcar ENVIADO, o código de rastreio é registrado (manual ou via etiqueta do Melhor Envio).

### 5.6 Trocas e devoluções
- Direito de arrependimento de 7 dias após o recebimento (CDC, compra online).
- Política de troca por defeito publicada em página própria.
- Reembolso feito pelo admin, com estorno via Mercado Pago.

## 6. Letras-caixa (seção separada)

- Fica **fora do menu de decoração**, com entrada própria (item de destaque no menu e rota `/letras-caixa`) e página de apresentação própria (usos: fachadas, eventos, quartos, lojas; fotos de aplicações; FAQ de tamanhos e iluminação).
- Por ser um produto personalizado (texto, fonte, tamanho, cor, com/sem LED), o lançamento usa **pedido por orçamento**: formulário (texto, altura das letras, fonte entre opções, cor, LED sim/não, uso interno/externo, prazo desejado, contato) que cria uma solicitação no admin e oferece continuar pelo WhatsApp.
- O admin responde com valor; venda direta com cálculo automático de preço fica para fase futura.
- Pode haver produtos prontos de letras-caixa (ex.: palavras populares) vendidos normalmente dentro desta seção.

## 7. Funcionalidades

### 7.1 Loja (público)
- **Home**: barra de benefícios no topo (desconto Pix, parcelamento, frete grátis acima de R$ 200), banner principal, "Explore as categorias", vitrines de coleções (Lançamentos, Mais vendidos, Kits), bloco de institucional (material, tecnologia 3D, sobre a Markah), galeria de clientes, faixa de garantias (frete grátis, troca fácil, parcelamento, compra segura), rodapé.
- **Listagem de categoria/coleção**: grade de produtos, filtros (categoria, cor, tamanho, faixa de preço, material), ordenação (relevância, menor/maior preço, novidades), paginação ou carregamento progressivo.
- **Busca** por nome/descrição.
- **Página de produto**: galeria de fotos com zoom, seleção de variações, preço (cheio, promocional, Pix, parcelas), calculadora de frete e prazo, ficha técnica, avaliações, produtos relacionados, botão favoritar, botão "Dúvidas? Fale no WhatsApp" com mensagem pré-preenchida com o nome do produto.
- **Carrinho** (gaveta lateral + página): alterar quantidade, remover, cupom, frete, barra de frete grátis. Carrinho persiste para visitante (cookie) e é mesclado ao fazer login.
- **Checkout**: identificação (login ou cadastro rápido), endereço (preenchimento por CEP), escolha de frete, pagamento (Pix/cartão), revisão, confirmação.
- **Páginas institucionais**: Sobre a Markah, Materiais (PLA/PETG), Tecnologia 3D, Rastreio de pedido, Política de envio, Trocas e devoluções, Privacidade (LGPD), Termos de uso, Contato.
- **Galeria de clientes** ("Markah em casa"): fotos/vídeos de clientes aprovados pelo admin, com @ do Instagram e link para o produto.
- **Botão flutuante de WhatsApp** em todas as páginas públicas.
- Banner de consentimento de cookies (LGPD).

### 7.2 Conta do cliente
- Cadastro/login com e-mail (link mágico) e Google.
- Meus pedidos (status, histórico, rastreio, segunda via do Pix), endereços salvos, dados pessoais, favoritos.
- Avaliar produtos de pedidos entregues.

### 7.3 Avaliações
- Nota de 1 a 5, texto, fotos opcionais; somente de clientes que compraram e receberam o produto.
- Publicação após aprovação do admin.
- Média e contagem exibidas no card e na página do produto.

### 7.4 Rastreio
- Página pública de rastreio (número do pedido + e-mail) e dentro da conta.
- Status atualizados pelo webhook/API do Melhor Envio quando disponível.

### 7.5 Painel admin (`/admin`)
- **Dashboard**: pedidos do dia/semana, faturamento, pedidos por status, produtos mais vendidos.
- **Produtos**: CRUD, opções e variações (gerador de combinações), upload e ordenação de fotos, ficha técnica, SEO, status, duplicar produto.
- **Categorias e coleções**: CRUD e ordenação.
- **Pedidos**: lista com filtros, detalhe, mudança de status, rastreio, notas internas, reembolso, geração de etiqueta Melhor Envio (fase posterior).
- **Clientes**: lista e histórico de pedidos.
- **Promoções**: cupons, kits, preço promocional, desconto Pix, parcelas sem juros, valor de frete grátis.
- **Avaliações e galeria**: moderação.
- **Letras-caixa**: solicitações de orçamento (status: nova, respondida, convertida, perdida).
- **Configurações**: dados da loja, WhatsApp, redes sociais, CEP de origem, prazo de produção, textos da barra de benefícios, banners da home.

### 7.6 E-mails transacionais
Pedido recebido (com Pix), pagamento aprovado, pedido em produção, pedido enviado (com rastreio), pedido entregue (convite para avaliar), pedido cancelado, link de login.

## 8. Arquitetura (visão geral)

- **App**: Next.js (App Router) + TypeScript, renderização no servidor para SEO, Server Actions para mutações.
- **UI**: Tailwind CSS + componentes próprios em `src/components/ui` (padrões em `design.md`).
- **Banco**: PostgreSQL gerenciado (Neon, via integração da Vercel) com Prisma ORM.
- **Autenticação**: Auth.js — e-mail (link mágico) e Google; papéis `CUSTOMER` e `ADMIN`.
- **Imagens**: Vercel Blob + `next/image`.
- **Pagamentos**: Mercado Pago (Payment Brick + API de pagamentos + webhooks).
- **Frete**: Melhor Envio (cotação, e depois etiquetas e rastreio).
- **E-mail**: Resend.
- **Hospedagem**: Vercel (produção + previews por branch).
- **Analytics**: Vercel Analytics; Meta Pixel e Google Analytics 4 com consentimento.

### 8.1 Modelo de dados (entidades principais)
`User`, `Address`, `Category`, `Collection`, `Product`, `ProductImage`, `ProductOption`, `ProductOptionValue`, `ProductVariant`, `Kit` / `KitItem`, `Cart` / `CartItem`, `Order` / `OrderItem` / `OrderStatusHistory`, `Payment`, `Shipment`, `Coupon` / `CouponRedemption`, `Review` / `ReviewImage`, `Favorite`, `GalleryPost`, `LetterQuoteRequest`, `StoreSettings`.

Regras de modelagem:
- `OrderItem` guarda **cópia** de nome, variação, SKU e preço no momento da compra (não depende do produto continuar existindo).
- Valores monetários em `Int` (centavos).
- Soft delete (arquivar) para produtos com pedidos.

### 8.2 Requisitos não funcionais
- Mobile first; Core Web Vitals "bom" nas páginas de home, categoria e produto.
- SEO: URLs amigáveis (`/luminarias-de-mesa/nome-do-produto`), metadados, sitemap, dados estruturados de Produto (preço, disponibilidade, avaliações), Open Graph para compartilhar no Instagram/WhatsApp.
- Acessibilidade: contraste AA, navegação por teclado, textos alternativos.
- Segurança: validação de entrada (Zod), proteção das rotas `/admin`, webhooks assinados, rate limit em login e formulários.
- LGPD: política de privacidade, consentimento de cookies, exclusão de conta a pedido.

## 9. Pendências e riscos

- **Sem CNPJ no lançamento**: Mercado Pago e Melhor Envio funcionam com CPF; envio com declaração de conteúdo. Emissão de nota fiscal fica para quando houver CNPJ/MEI (integração com emissor em fase futura). Revisar limites de faturamento como pessoa física.
- Percentual de desconto Pix e parcelas sem juros: valores padrão sugeridos, a confirmar pelo dono.
- Tabela de atacado para lojistas: fora do lançamento.
- Letras-caixa com preço automático: fora do lançamento.
- Newsletter: não solicitada; pode entrar depois.

## 10. Roadmap por fases

Alimente o Antigravity **uma fase por vez**. Cada fase termina com deploy de preview funcionando e entrada no `changelog.md`.

| Fase | Entrega | Versão alvo |
|---|---|---|
| **0 — Fundação** | Projeto Next.js + TS + Tailwind, lint/format/testes, Prisma + Neon, `.env.example`, deploy na Vercel, layout base (header, rodapé, WhatsApp flutuante) seguindo `design.md` | 0.1.0 |
| **1 — Catálogo** | Modelos de categoria/produto/variação/imagem, seed com produtos de exemplo, home, listagem com filtros, busca, página de produto com seleção de variação | 0.2.0 |
| **2 — Admin de catálogo** | Auth.js com papel ADMIN, painel `/admin` com CRUD de produtos, variações, fotos (Vercel Blob), categorias, coleções e configurações da loja | 0.3.0 |
| **3 — Carrinho e frete** | Carrinho (visitante + logado), `pricing.ts` com testes, cotação Melhor Envio, frete grátis ≥ R$ 200, prazo com produção | 0.4.0 |
| **4 — Checkout e pagamento** | Conta do cliente (e-mail + Google), endereços, checkout, Mercado Pago (Pix com desconto + cartão parcelado), webhook idempotente, pedidos, e-mails transacionais | 0.5.0 |
| **5 — Gestão de pedidos** | Pedidos no admin, ciclo de status, rastreio, reembolso, área "Meus pedidos", página pública de rastreio | 0.6.0 |
| **6 — Promoções** | Cupons, kits, preço promocional, configuração de desconto Pix e parcelas | 0.7.0 |
| **7 — Prova social** | Favoritos, avaliações com moderação, galeria "Markah em casa" | 0.8.0 |
| **8 — Lançamento** | Páginas institucionais e legais, LGPD/cookies, SEO (sitemap, dados estruturados, OG), analytics, revisão de performance e acessibilidade, testes e2e do checkout, credenciais de produção, domínio | **1.0.0** |
| **8.5 — Prontidão real para produção** | Itens abertos na auditoria de 26/09/2026 (lista abaixo) | 1.0.x |
| **9 — Letras-caixa** | Seção `/letras-caixa`, landing, formulário de orçamento, gestão de solicitações no admin | 1.1.0 |
| Futuro | Etiquetas Melhor Envio pelo admin, nota fiscal, atacado, newsletter, preço automático de letras-caixa | — |

> Para lançar mais rápido, as fases 6 e 7 podem ir para depois do 1.0.0 — basta mover as linhas e registrar em `decisoes.md`.

### Fase 8.5 — Prontidão real para produção (auditoria 26/09/2026)

A versão 1.0.0 foi fechada em desenvolvimento local. Estes itens precisam estar prontos **antes de colocar a loja no ar**:

**Bloqueadores (sem eles a loja não opera):**
1. **Catálogo no banco.** Hoje `catalog.ts`, o checkout e o admin usam o array `SEED_PRODUCTS` em memória: produtos, categorias e coleções criados ou editados no admin somem quando o servidor reinicia e o checkout não enxerga o que está no banco. Migrar leitura (`getProducts`, `getProductBySlug`, busca e filtros), escrita (admin) e a busca de variação do checkout para o Prisma.
2. **Variações completas no admin (§4.3).** O formulário cria só uma variação com uma cor. Precisa de opções (Tamanho, Cor, Textura, Cor do cabo, Lâmpada inclusa), gerador de combinações, preço/SKU/peso/dimensões por variação e desativar combinações.
3. **Upload de fotos (Vercel Blob, D-013).** Hoje o admin aceita só URL de imagem. Upload múltiplo, ordenação, texto alternativo e limite de tamanho (P-009).
4. **Configurações da loja aplicadas.** `/admin/configuracoes` grava `StoreSettings`, mas desconto Pix, parcelas, frete grátis, prazo de produção, CEP de origem e WhatsApp continuam fixos no código. Ler as configurações no `pricing.ts`, frete e rodapé (e a tela deve carregar os valores salvos).
5. **Migrações Prisma.** Não existe `prisma/migrations/`. Rodar `prisma migrate dev --name inicial`, versionar e usar `prisma migrate deploy` na Vercel. Rodar o `seed.ts` no Neon.
6. **Expiração do Pix.** Pedidos Pix não pagos em 30 min devem ir para `CANCELADO` (Vercel Cron chamando uma rota protegida).
7. **Credenciais de produção** na Vercel: `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_URL`/`DIRECT_URL`, `MERCADO_PAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, `MERCADO_PAGO_WEBHOOK_SECRET`, `MELHOR_ENVIO_TOKEN`, `ORIGIN_POSTAL_CODE`, `RESEND_API_KEY` (domínio verificado), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Configurar parcelamento sem juros (3x) no painel do Mercado Pago.
8. **Fotos reais** dos produtos no lugar das ilustrações SVG de exemplo.

**Importantes (logo após o lançamento):**
- Kits como produto composto (§5.1) — hoje há só o selo visual.
- Limite de uso de cupom por cliente e cupom "não cumulativo com Pix" (§5.1).
- Moderação da galeria "Markah em casa" no admin (§7.5).
- E-mails "pedido em produção", "pedido entregue (convite para avaliar)" e "pedido cancelado" (§7.6).
- Área do cliente: endereços salvos e dados pessoais (§7.2); login com Google (D-017).
- Rate limit no login do admin, no link mágico e nos formulários (§8.2).
- Testes e2e do checkout (Pix e cartão no sandbox do Mercado Pago).
