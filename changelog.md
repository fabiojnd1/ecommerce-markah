# changelog.md — Histórico de alterações

> "O que mudou?" Registre toda entrega ao final da tarefa. Entradas mais recentes no topo. Nunca apague entradas antigas.

## Padrão de versão — MMP (Major.Minor.Patch)

- **Major (X.0.0)**: mudança que quebra compatibilidade ou marco de produto. `1.0.0` = loja lançada em produção. Depois disso, só em mudanças estruturais grandes (ex.: troca de gateway, nova modelagem de pedidos).
- **Minor (0.X.0)**: nova funcionalidade ou fase concluída, compatível com o que existe.
- **Patch (0.0.X)**: correção de bug, ajuste visual, texto, refatoração sem mudança de comportamento.
- Antes do `1.0.0`, cada fase do roadmap (PRD §10) fecha uma versão Minor.

## Categorias de cada entrada

- **Adicionado** — novas funções
- **Alterado** — mudanças em funções existentes
- **Corrigido** — correções de bugs
- **Estrutura** — banco, migrações, pastas, dependências, configurações, deploy
- **Removido** — funções ou arquivos retirados
- **Documentação** — mudanças nos arquivos de controle

Modelo:
```
## [0.0.0] — AAAA-MM-DD
### Adicionado
- ...
### Corrigido
- ...
```

---

## [Não lançado]
- **Atenção:** a versão 1.0.0 fechou as fases 0–8 em desenvolvimento local, mas a loja **ainda não está pronta para produção**. A auditoria de 26/09/2026 corrigiu falhas críticas (ver 1.0.1) e encontrou lacunas de persistência listadas no PRD §10, **Fase 8.5**.
- Próximo passo: **Fase 8.5 — Prontidão real para produção** (PRD §10), antes da Fase 9.

## [1.0.6] — 2026-10-07
### Alterado
- **Banner Hero da Página Inicial com Imagem Real Otimizada:**
  - Substituição da ilustração vetorial estática pela foto de estúdio com iluminação real de ambiente e anotações visuais da luminária de mesa Markah.
  - Conversão e otimização para formato WebP (`/hero-banner.webp`) com redução de **60%** no peso do arquivo (de 158 KB para apenas **64 KB**), acelerando o carregamento da vitrine e mantendo alta fidelidade visual.
  - Ajuste de proporção no container da hero (`aspect-[1024/764]`) em [src/app/(loja)/page.tsx](file:///c:/Dev/Ecommerce%20Markah/src/app/%28loja%29/page.tsx) para garantir exibição nítida e sem cortes de texto em mobile e desktop.

## [1.0.5] — 2026-10-07
### Corrigido
- **Compatibilidade CSS e avisos do validador (Problems):**
  - Adicionada a propriedade padrão `background-clip: text;` junto a `-webkit-background-clip: text;` na classe `.text-brand-gradient` em `src/app/globals.css`, resolvendo o aviso `css(vendorPrefix)`.
  - Configurado `.vscode/settings.json` com `"css.lint.unknownAtRules": "ignore"` para que o linter nativo do VS Code reconheça as diretivas `@tailwind` e `@apply` sem acusar falsos positivos `css(unknownAtRules)`.

## [1.0.4] — 2026-10-06
### Adicionado
- **Nova experiência de cadastro e gestão de fotos do produto (Vercel Blob, D-013, P-009):**
  - Componente `ProductPhotosManager` em `src/components/admin/product-photos-manager.tsx`, substituindo os campos de texto legados de URL por um painel visual completo.
  - Upload múltiplo com suporte a arrastar e soltar (drag & drop) e seleção de arquivos locais (PNG, JPG, JPEG).
  - Molduras 4:5 com o enquadramento padrão da vitrine da loja, indicador de progresso real por arquivo via `XMLHttpRequest`, tratamento de erros com ação de tentar novamente (retry).
  - Aviso visual com prévia de corte quando a proporção do arquivo enviado diferir do padrão 4:5 (~0.8), sem realizar cortes automáticos silenciosos.
  - Controles da galeria: definição de exatamente uma imagem principal (`isPrimary`) e no máximo uma imagem de hover (`isHover`), edição inline de texto alternativo (`alt`) por foto, e remoção com marcação diferida para exclusão do armazenamento.
  - Reordenação interativa acessível: suporte a arrastar cards e botões com foco de teclado, setas de navegação e área de clique de 44 × 44 px.
  - Bloqueio de salvamento do formulário enquanto houver uploads em andamento ou falhas não resolvidas.
- **Armazenamento e Segurança (Vercel Blob):**
  - Rota de autorização e upload `/api/admin/upload-blob` no App Router (`src/app/api/admin/upload-blob/route.ts`), exigindo privilégio `requireAdmin()` (P-007) antes de qualquer operação.
  - Validação estrita no servidor em `src/lib/blob-storage.ts`: verificação de assinatura binária real (magic bytes) para PNG (`89 50 4E 47`) e JPEG (`FF D8 FF`), validação de tipo MIME, extensões permitidas e dimensões suportadas (100 a 8000 px).
  - Limite configurável centralizado de 10 MB por arquivo (`src/lib/storage-config.ts`, P-009).
  - Mensagem de erro descritiva caso `BLOB_READ_WRITE_TOKEN` não esteja configurado no ambiente, sem simular sucesso.
  - Nomes de arquivo seguros gerados exclusivamente pelo servidor no padrão `products/prod_{timestamp}_{uuid}.{ext}`.
- **Configuração do Next.js:**
  - Criação de `next.config.ts` com `remotePatterns` para os domínios do Vercel Blob (`*.public.blob.vercel-storage.com` e `public.blob.vercel-storage.com`).
- **Testes automatizados:**
  - Nova suíte `tests/product-images-gallery.test.ts` cobrindo validação de magic bytes, limites de 10 MB, proteção de rotas admin, validações de integridade de galeria (`isPrimary`, `isHover`, `displayOrder`) e inicialização da `ProductGallery` da loja na imagem principal.

### Alterado
- **Ação de salvar produto (`src/server/admin-actions.ts`):** suporte a payload com galeria completa de imagens, validação de unicidade de imagem principal e hover, persistência transacional completa no Prisma (`tx.productImage`), sincronização em memória (`SEED_PRODUCTS`), e remoção segura de blobs órfãos após a confirmação no banco de dados.
- **Galeria da loja (`src/components/loja/product-gallery.tsx`):** inicialização dinâmica da imagem selecionada na foto marcada com `isPrimary` em vez de fixar no índice 0.
- **Card de produto (`src/components/loja/product-card.tsx`):** fallback resiliente para imagem primária e hover mesmo com catálogo vazio ou fotos pendentes.

## [1.0.3] — 2026-10-06
### Adicionado
- **Cadastro de cores por categoria (Admin → Novo Produto):**
  - Ao selecionar a categoria estável `luminarias-de-mesa`, o formulário exibe campos independentes para cores da Base e cores da Cúpula (nome e hex), com suporte para adicionar e remover cores (`src/components/admin/product-form.tsx`).
  - Para as demais categorias, o formulário exibe o campo padrão de cor única.
  - Alternar categorias no formulário atualiza os campos imediatamente sem perder os valores já digitados em nenhum dos modos.
  - Geração automática de opções `Cor da Base` e `Cor da Cúpula` no formato `SeedOption`, e variantes de todas as combinações válidas com SKUs únicos e `selectedOptionValueIds` consistentes.
  - Layout responsivo dos painéis de Base e Cúpula com grade fluida `auto-fit` (minmax 320px), reorganização automática de controles em duas linhas em larguras estreitas sem rolagem horizontal, coluna fixa e botões de lixeira acessíveis com área de clique de 44 × 44 px, foco de teclado visível e proteção contra remoção da última cor.
- **Testes de cobertura:** novos testes unitários e de integração em `tests/table-lamp-variants.test.ts` cobrindo criação de luminária bicolor, criação de produto de cor única e preservação de opções ao editar a `Luminária Coluna Duna` e a `Luminária Saturno`.

### Alterado
- **Ação de salvar produto (`src/server/admin-actions.ts`):** validação no servidor das opções e variantes por categoria; suporte a persistência relacional completa no Prisma (`ProductOption`, `ProductOptionValue`, `ProductVariant`, `ProductVariantOptionValue`) via transação quando `isDatabaseConfigured()` for verdadeiro; e sincronização pontual do repositório em memória `SEED_PRODUCTS`.
- **Consulta de produtos (`src/lib/catalog.ts`):** `getProductBySlug` agora consulta opções e variantes relacionais no Prisma quando o banco de dados estiver configurado, com fallback resiliente para memória.

### Documentação
- Esclarecimento da regra de produto para a `Luminária Coluna Duna`: peça monolítica categorizada como `luminarias-de-mesa` que preserva sua opção única `Cor` ao ser editada, enquanto novas criações na categoria utilizam o fluxo bicolor.
- Registro da limitação de persistência: sem `DATABASE_URL` configurada, o catálogo opera em memória (`SEED_PRODUCTS`), sendo reinicializado com o servidor conforme D-018 e PRD §10 Fase 8.5.

## [1.0.2] — 2026-09-26
### Alterado
- **Logo oficial da Markah** aplicado em todo o site (header, menu mobile, rodapé, checkout, login e barra lateral do admin), substituindo os SVGs provisórios criados na Fase 0.
- Novos arquivos em `public/brand/`: `markah-logo.png`, `markah-logo-branco.png` (fundos escuros), `markah-logo-preto.png`, `markah-simbolo.png`, ícones (`favicon-32`, `icon-192`, `icon-512`, `apple-touch-icon`), `/favicon.ico` e imagem de compartilhamento `markah-og.png` (1200×630).
- Metadados: favicon, ícone da tela inicial, Open Graph e logo do JSON-LD `Organization` apontam para os novos arquivos.
- Tamanhos do logo ajustados à proporção real (~2:1): header 56px, rodapé 64px.
### Corrigido
- Instagram no JSON-LD e na galeria de clientes apontava para `@markahbrasil`; corrigido para `@markah_br`.
### Removido
- `public/brand/*.svg` e `public/favicon.svg` (logos provisórios que não eram a marca oficial).
### Documentação
- `design.md` §1 e §2: logo oficial, tabela de arquivos e alturas de uso.

## [1.0.1] — 2026-09-26
### Corrigido
- **Segurança do painel admin (M-001, M-002, M-006):** sessões assinadas com HMAC (`src/lib/session.ts`); login por `ADMIN_EMAIL`/`ADMIN_PASSWORD`; senha fixa `markah2026` só em desenvolvimento; `src/middleware.ts` redireciona `/admin/*` para o login; todas as páginas do admin chamam `requireAdmin()`.
- **Área do cliente (M-005):** login por link mágico enviado ao e-mail (rota `/conta/entrar`), no lugar do acesso só com o e-mail digitado.
- **Pagamentos (M-003):** `mercadopago.ts` reescrito. Aceita credenciais `TEST-` e `APP_USR-`, não simula em produção, envia `external_reference` e expiração do Pix, traduz recusas do cartão.
- **Cartão (D-019):** campos próprios de número/CVV removidos; formulário seguro do Mercado Pago (Card Payment Brick) em `src/components/checkout/mercadopago-card-brick.tsx`.
- **Webhook (M-004):** validação de `x-signature`, busca do pedido por `external_reference`/`paymentId`, conferência de valor, transições de status controladas e idempotência por pagamento+status.
- **Checkout:** pedido salvo antes da cobrança (`attachPaymentToOrder`); número do pedido com 6 caracteres aleatórios (antes 5 dígitos, com risco de colisão); mensagens de erro sem detalhes internos; e-mail de pagamento confirmado para cartão aprovado na hora.
- **Frete grátis (M-007):** decidido pelo `pricing.ts` com subtotal após cupom e válido só para a opção mais barata (quem escolhe opção mais cara paga a diferença).
- **Avaliações (PRD §7.3):** entram como `PENDING` e só aparecem após aprovação; "compra verificada" apenas para cliente logado com pedido pago do produto.
- **Build (M-008):** `/admin` e `/conta` voltaram a ser dinâmicas (antes eram pré-geradas no build).
- **E-mails:** texto digitado pelo cliente (nome, endereço) é escapado antes de entrar no HTML.
- **Links:** menu "Letras-caixa" não leva mais a 404 (página provisória com orçamento pelo WhatsApp); número do WhatsApp centralizado em `NEXT_PUBLIC_WHATSAPP_NUMBER` (`src/lib/site-config.ts`).
### Estrutura
- `src/lib/runtime.ts` (D-018): em produção, falha de banco, frete ou pagamento vira erro; dados em memória só em desenvolvimento ou com `ALLOW_DEMO_DATA=true`.
- `prisma/schema.prisma`: índices em `Order.paymentId` e `Order.customerEmail`.
- `.env.example`: `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, `ALLOW_DEMO_DATA`.
- Testes: 93 passando em 12 suítes (novos: `tests/auth-security.test.ts`, webhook reescrito, frete grátis com cupom). `tsc`, `next lint` e `next build` sem erros.
### Documentação
- `decisoes.md`: D-017 (substitui D-005), D-018, D-019. `mistakes.md`: M-001 a M-008. `PRD.md` §10: Fase 8.5. `CLAUDE.md`: novos arquivos no mapa e regra de "sem simulação em produção".

## [1.0.0] — 2026-09-23
### Adicionado
- **Lançamento Oficial da Loja Virtual Markah Brasil**:
  - Atingimento do marco oficial de lançamento (v1.0.0) com todas as 9 fases fundamentais do e-commerce concluídas.
- **Páginas Institucionais e de Conformidade Legal**:
  - `/sobre`: Manifesto de design paramétrico autoral, manufatura consciente sem estoques e valorização da produção 100% brasileira.
  - `/materiais`: Ficha técnica profunda sobre o PLA (biopolímero vegetal) e o PETG (alta resistência mecânica e térmica), além de guia de conservação com lâmpadas LED.
  - `/tecnologia-3d`: Etapas de criação da modelagem paramétrica ao fatiamento de 0.20mm, acabamento manual e vantagens do método aditivo.
  - `/contato`: Central de atendimento omnicanal com WhatsApp direto, e-mail comercial, formulário de mensagem com validação e seção de FAQ.
  - `/envio`: Transparência total no cálculo de prazo (3 dias úteis de manufatura sob demanda + tempo de transporte dos Correios/Jadlog/Loggi) e frete grátis a partir de R$ 200.
  - `/trocas`: Política de trocas e devoluções em estrita conformidade com o Código de Defesa do Consumidor (Art. 49 do CDC com 7 dias de arrependimento e logística reversa gratuita) e 90 dias de garantia contra defeitos de fabricação.
  - `/privacidade`: Política de Privacidade e Proteção de Dados alinhada com a LGPD (Lei 13.709/2018), detalhando finalidade, segurança, compartilhamento estrito com operadores logísticos e canal do DPO (`privacidade@markah.com.br`).
  - `/termos`: Termos de uso e condições contratuais de compra para manufatura aditiva sob encomenda.
- **Compliance LGPD (Consentimento de Cookies)**:
  - Componente não intrusivo `CookieConsentBanner` (`src/components/loja/cookie-consent-banner.tsx`) com persistência em cookie e `localStorage`, permitindo aceitar todos ou apenas essenciais.
- **SEO Técnico Completo**:
  - Geração dinâmica de sitemap XML (`src/app/sitemap.ts`) incluindo páginas estáticas, institucionais, categorias ativas e todos os produtos do catálogo com prioridades adequadas.
  - Configuração do `robots.txt` (`src/app/robots.ts`) liberando rotas públicas e bloqueando indexação de áreas administrativas (`/admin/*`) e privadas (`/conta/*`, `/checkout/*`, `/api/*`).
  - Dados estruturados Schema.org JSON-LD injetados em `<head>`:
    - `Organization` e `WebSite` no layout raiz (`src/app/layout.tsx`).
    - `Product`, `Offer` (BRL, InStock) e `AggregateRating` na PDP (`src/app/(loja)/produtos/[slug]/page.tsx`).
- **Suíte de Testes e Prontidão de Produção**:
  - Nova suíte `tests/launch-readiness.test.ts` com 7 testes dedicados validando sitemap, robots, schemas JSON-LD e invariantes de centavos inteiros (D-011 / P-002).
  - Total do projeto expandido para 82 testes automatizados passando (100% de sucesso em 11 suítes), 0 erros no TypeScript (`tsc --noEmit`), 0 avisos no linter (`next lint`) e 32 rotas de produção geradas com sucesso.

## [0.8.0] — 2026-09-23
### Adicionado
- **Sistema de Favoritos (Wishlist)**:
  - Contexto global reativo `WishlistProvider` (`src/lib/wishlist-context.tsx`) com persistência dupla (`localStorage` + cookie `markah_wishlist`) para renderização instantânea e suporte SSR.
  - Indicador e contador animado no Header da loja (`src/components/loja/header.tsx`) no desktop e no menu drawer mobile com badge magenta.
  - Botão de coração interativo com feedback visual instantâneo nos cards de produto (`ProductCard`) e na página do produto (`ProductDetailsClient`).
  - Página dedicada de favoritos (`/favoritos` e `src/components/loja/wishlist-view.tsx`) com grid de produtos salvos, ação para limpar lista com confirmação, banner informativo de condições de pagamento e empty state amigável direcionando para o catálogo.
- **Sistema de Avaliações de Produtos (Social Proof & PDP)**:
  - Modelagem Prisma com modelo `Review` (`prisma/schema.prisma`) suportando notas de 1 a 5 estrelas, status de moderação (`PENDING`, `APPROVED`, `REJECTED`), selo de compra verificada e comentários detalhados.
  - Seção interativa de avaliações na PDP (`ProductReviewsSection` em `src/components/loja/product-reviews-section.tsx`), exibindo média ponderada, percentual de recomendação dos compradores, barras de distribuição por estrelas e lista de avaliações com selo "Compra Verificada".
  - Formulário retrátil com seletor interativo de 5 estrelas, rótulos contextuais, validação de campos obrigatórios e submissão em tempo real via Server Action (`submitProductReviewAction`).
- **Moderação Administrativa de Avaliações (`/admin/avaliacoes`)**:
  - Painel administrativo em `src/components/admin/reviews-moderation-view.tsx` e `src/app/admin/avaliacoes/page.tsx`, com filtros por status (Todas, Pendentes, Aprovadas, Rejeitadas), busca textual rápida e botões contextuais para aprovar, rejeitar ou excluir avaliações.
  - Novo item de navegação "Avaliações" adicionado à barra lateral do painel admin ([AdminSidebar](file:///c:/Dev/Ecommerce%20Markah/src/components/admin/admin-sidebar.tsx)) com ícone `Star`.
  - Server Actions em `src/server/social-proof-actions.ts` com proteção obrigatória no servidor via `requireAdmin()` (Regra P-007).
- **Galeria de Clientes "Markah em Casa"**:
  - Modelagem Prisma `GalleryPost` para fotos ambientadas reais compartilhadas por compradores.
  - Vitrine visual autoral em `src/components/loja/customer-gallery-section.tsx` integrada à Home (`/`), destacando o perfil do Instagram (`@`), depoimento do cliente e botão "Ver Peça" com link direto para o produto.
- **Testes & Qualidade**:
  - Nova suíte de testes `tests/social-proof.test.ts` com 13 testes cobrindo validações de submissão, cálculos de distribuição estatística, moderação administrativa, regra P-007 e galeria de clientes.
  - Total do projeto expandido para 75 testes automatizados passando (100% de sucesso em 10 suítes), 0 erros no TypeScript (`tsc --noEmit`), 0 avisos no linter (`next lint`) e 22 rotas compiladas no build de produção.
### Adicionado
- Gestão de Promoções e Cupons Dinâmicos no painel administrativo (`/admin/promocoes`):
  - Modelagem estendida em `prisma/schema.prisma` com modelo `Coupon` e enum `CouponDiscountType` (`PERCENTAGE`, `FIXED`, `FREE_SHIPPING`).
  - Repositório de promoções resiliente em `src/lib/promotions-repository.ts` com persistência Prisma e fallback em memória pré-carregado com cupons oficiais (`BEMVINDO10`, `MARKAH20`, `FRETEGRATIS`, `PRIMEIRACOMPRA`).
  - Painel administrativo interativo em `src/components/admin/promotions-management-view.tsx` e `src/app/admin/promocoes/page.tsx`, permitindo criar cupons em modal, editar regras, pausar/ativar com um clique, excluir e visualizar resumos de parâmetros comerciais (Desconto Pix 5%, Parcelamento 3x, Frete Grátis R$ 200).
  - Novo item de navegação "Promoções" adicionado à barra lateral [AdminSidebar](file:///c:/Dev/Ecommerce%20Markah/src/components/admin/admin-sidebar.tsx) com ícone `Tag`.
  - Server Actions administrativas em `src/server/promotions-actions.ts` (`getAdminCouponsAction`, `saveCouponAction`, `toggleCouponAction`, `deleteCouponAction`) com proteção obrigatória no servidor via `requireAdmin()` (Regra P-007).
  - Validação dinâmica integrada ao carrinho e checkout (`src/server/cart-actions.ts`), conferindo status ativo, data inicial/final de vigência, limite máximo de utilizações e subtotal mínimo em centavos (D-011).
  - Incremento automático do contador de uso do cupom ao confirmar pedido no checkout (`incrementCouponUsage` em `src/server/checkout-actions.ts`).
  - Destaque visual de "Kit Exclusivo" e badges de desconto percentual ("-X% OFF") com preço cheio riscado nos cards de produto da loja ([product-card.tsx](file:///c:/Dev/Ecommerce%20Markah/src/components/loja/product-card.tsx)).
  - Suíte de testes automatizados `tests/promotions.test.ts` com 14 testes dedicados. Total do projeto expandido para 62 testes passando em 9 suítes com 0 erros de lint e build Next.js 15 limpo (20 rotas geradas).

## [0.6.0] — 2026-09-23
### Adicionado
- Gestão completa de pedidos no painel administrativo (`/admin/pedidos` e `/admin/pedidos/[id]`):
  - Modelagem estendida em `prisma/schema.prisma` com `trackingCode`, `internalNotes`, `shippedAt` e `deliveredAt`.
  - Tabela densificada com filtros de status (`AGUARDANDO_PAGAMENTO`, `PAGO`, `EM_PRODUCAO`, `PRONTO_PARA_ENVIO`, `ENVIADO`, `ENTREGUE`, `CANCELADO`), contadores rápidos e busca textual dinâmica por pedido, comprador, CPF ou código de rastreamento (`src/components/admin/orders-table.tsx`).
  - Cores oficiais de status padronizadas em `src/components/admin/order-status-badge.tsx` conforme `design.md` §7 (Aguardando Pagamento: amarelo, Pago: verde, Em Produção: ciano, Enviado: violeta, Entregue: verde escuro, Cancelado/Reembolsado: cinza).
  - Tela detalhada do pedido (`order-detail-view.tsx`) com stepper do ciclo de vida da manufatura 3D, botões de avanço contextual, inclusão/edição de código de rastreamento com validação obrigatória no envio, editor de anotações internas para oficina de impressão e cancelamento/reembolso com histórico.
- Server Actions administrativas em `src/server/admin-order-actions.ts`:
  - `getAdminOrdersAction`, `getAdminOrderDetailsAction`, `updateOrderStatusAction`, `updateOrderTrackingAction`, `saveInternalNotesAction`, `refundOrderAction` e `getAdminMetricsAction`.
  - Proteção obrigatória no servidor em todas as ações via `requireAdmin()` (Regra P-007).
  - Disparo automático de e-mail com código de rastreamento via Resend ao despachar o pedido (`sendOrderShippedEmail`).
- Painel Geral (`/admin`):
  - Integração com dados reais do repositório de pedidos (`getOrderMetrics()`), exibindo faturamento total aprovado, itens em impressão 3D ativa, itens em trânsito e lista dos pedidos mais recentes com link direto para o gerenciamento.
- Rastreamento público com proteção de privacidade (`/rastreio`):
  - Consulta aberta em `src/app/(loja)/rastreio/page.tsx` e `src/components/loja/tracking-view.tsx` com parâmetro `?codigo=MKB-...`.
  - Validação estrita por e-mail ou CPF do comprador para resguardo de privacidade (`trackOrderPublicAction`).
  - Linha do tempo visual de 6 etapas destacando a manufatura sob demanda (até 3 dias úteis), código de rastreio com botão copia-e-cola, link direto para a transportadora e segunda via de pagamento Pix se ainda pendente.
- Portal do cliente (`/conta` e `/conta/pedidos`):
  - Login simplificado sem senha por e-mail (`customerLoginAction`), exibindo histórico de compras, status em tempo real, miniatura das peças e atalhos rápidos de rastreamento.
- Suíte de testes automatizados:
  - 13 novos testes cobrindo todo o ciclo em `tests/order-management.test.ts` (validação P-007, transição de status, obrigatoriedade de rastreio para despacho, notas internas, reembolso, privacidade em rastreamento e métricas de faturamento). Total de 48 testes passando em 8 suítes com 0 erros e 0 warnings no lint/build.

## [0.5.0] — 2026-09-23
### Adicionado
- Modelagem completa de pedidos, itens, endereços e eventos em `prisma/schema.prisma`:
  - Modelos `Address`, `Order`, `OrderItem` e `WebhookEvent` com valores monetários estritamente em centavos inteiros (D-011).
  - Repositório resiliente em `src/lib/orders-repository.ts` (`saveOrder`, `getOrderById`, `getOrderByNumber`, `updateOrderStatus`, `isWebhookEventProcessed`) com suporte a Prisma e fallback em memória.
- Integração oficial com Mercado Pago em `src/lib/payments/mercadopago.ts`:
  - `createPixPayment`: geração de QR Code copia-e-cola e imagem Base64 com expiração de 30 minutos e 5% de desconto exclusivo sobre os produtos (PRD §5.1 / §5.4).
  - `createCardPayment`: criação de cobrança com cartão e parcelamento em até 3x sem juros (PRD §5.1).
  - `getPaymentDetails`: consulta direta à API do Mercado Pago para auditoria e prevenção de fraudes.
- Webhook do Mercado Pago com garantia de idempotência em `src/app/api/webhooks/mercadopago/route.ts`:
  - Validação de IDs de eventos duplicados evitando reprocessamento de status (P-003).
  - Consulta do status real do pagamento diretamente na API do Mercado Pago, nunca confiando cegamente no body da requisição (P-004).
  - Transição segura de status de pedido (`AGUARDANDO_PAGAMENTO` -> `PAGO`, `PAGAMENTO_RECUSADO`, `REEMBOLSADO`).
- Disparo de e-mails transacionais via Resend em `src/lib/email/resend.ts` (D-013):
  - `sendOrderCreatedEmail`: e-mail detalhado com dados da entrega, prazos de fabricação sob demanda e QR Code / código Pix copia-e-cola.
  - `sendPaymentConfirmedEmail`: aviso imediato de início da produção 3D no ateliê da Markah Brasil (3 dias úteis).
- Autenticação e gestão de sessões de clientes em `src/lib/auth.ts`:
  - Suporte ao papel `CUSTOMER`, login/cadastro transparente no checkout (`authenticateCustomer`, `getCustomerUser`, `logoutCustomer`).
- Fluxo de Checkout em `src/components/checkout/` e `src/app/checkout/`:
  - Header minimalista e sem distrações em `checkout-header.tsx` (`design.md` §7).
  - Layout focado em conversão em `checkout-layout.tsx` e `checkout-page.tsx`.
  - Formulário em 3 etapas progressivas em `checkout-form.tsx`:
    1. Identificação com máscaras de CPF e telefone.
    2. Endereço com autopreenchimento por CEP (ViaCEP) e opções de envio (Melhor Envio) somando 3 dias úteis de produção.
    3. Pagamento com alternância Pix (5% OFF destacado em verde) e Cartão de Crédito (até 3x sem juros).
    4. Resumo fixo com cálculo em tempo real e proteção contra envios múltiplos.
- Tela de confirmação e pagamento em `src/app/checkout/sucesso/[orderId]/`:
  - Exibição de QR Code Pix em alta definição e botão "Copiar código Pix" de 1 clique com feedback imediato.
  - Contador regressivo dinâmico de expiração (30 min).
  - Polling reativo em segundo plano a cada 5 segundos para atualização instantânea do status para "Pagamento Aprovado" sem exigir recarregamento da página (PRD §5.4).
  - Cronograma visual e transparente de prazos (3 dias de produção 3D + prazo da transportadora).
  - Atalho com mensagem pré-preenchida no WhatsApp para suporte pós-venda.
- Server Actions do checkout em `src/server/checkout-actions.ts`:
  - `createOrderAction`: recálculo financeiro estrito no servidor de produtos, cupons e frete (P-001).
  - `getOrderStatusAction`: consulta em tempo real de status para a página de confirmação Pix.
- Suíte completa de testes unitários:
  - `tests/checkout.test.ts`: testes de validação de dados, recálculo de preço no servidor e desconto Pix isolado de frete.
  - `tests/webhook.test.ts`: testes de idempotência e transição de status para `PAGO`.

## [0.4.0] — 2026-09-23
### Adicionado
- Estado global do carrinho em `src/lib/cart-context.tsx` (`CartProvider` e `useCart`):
  - Suporte a itens adicionados, remoção individual, ajuste dinâmico de quantidades e limpeza do carrinho.
  - Persistência automática em `localStorage` e sincronização via cookies `markah_cart` para visitantes e sessões autenticadas.
  - Gestão de cupons de desconto (`appliedCoupon`, `applyCoupon`, `removeCoupon`, feedback de erro/sucesso).
- Regras de cálculo no servidor em `src/lib/pricing.ts` (`calculateCartTotals`, P-001 e D-011):
  - Subtotal bruto e líquido de produtos em centavos inteiros (`Int`).
  - Ordem estrita de descontos (PRD §5.1): produtos -> cupom -> desconto Pix de 5% aplicado exclusivamente sobre o valor líquido dos produtos (nunca sobre o frete).
  - Suporte a cupons do tipo `PERCENTAGE`, `FIXED` e `FREE_SHIPPING`.
  - Avaliação da meta de frete grátis (≥ R$ 200,00) baseada no subtotal líquido de produtos (PRD §5.2).
  - Cálculo de parcelamento em até 3x sem juros e formatação monetária em Real (BRL).
- Integração de frete e prazos em `src/lib/shipping/melhor-envio.ts` e `src/server/shipping-actions.ts`:
  - Cotação de frete via API do Melhor Envio (PAC e SEDEX) com fallback simulado para desenvolvimento e testes.
  - Consolidação de volumes e pesos mínimos conforme regras dos Correios (`consolidatePackage`).
  - Cálculo transparente de prazos (PRD §5.3): soma de 3 dias úteis de produção sob demanda ao prazo de trânsito da transportadora ("Produção (3 dias úteis) + Entrega (X dias úteis) = Y dias úteis").
  - Frete grátis ativado na opção mais econômica para compras qualificadas.
- Server Actions em `src/server/cart-actions.ts`:
  - `validateCouponAction`: validação de cupons no servidor com suporte a cupons de lançamento (`BEMVINDO10`, `MARKAH20`, `FRETEGRATIS`) e exigência de pedido mínimo.
  - `calculateServerCartTotalsAction`: recálculo financeiro consolidado no servidor.
- Componentes visuais do carrinho:
  - `FreeShippingBar`: barra de progresso visual com o gradiente da marca (`design.md` §3) indicando o valor faltante para atingir frete grátis ou aviso de conquista.
  - `CartDrawer`: gaveta lateral deslizante com travamento de scroll, miniaturas 4:5, seletor de quantidade, exclusão, simulador de frete com prazos e opções, seção recolhível de cupom e resumo com destaque Pix.
  - `CartItemRow`: linha de produto no carrinho com foto 4:5, amostra de cor, nome, preço unitário e controles acessíveis.
  - `CartPageClient` e rota `/carrinho`: página completa de revisão de compra com visualização em 2 colunas, simulador de frete, aplicação de cupom, resumo financeiro e garantias de segurança.
- Ajuste de posicionamento em `src/components/loja/whatsapp-button.tsx` (`bottom-20 sm:bottom-6`), evitando sobreposição com a barra de compra fixa no mobile da página de produto (`design.md` §7).
- Suíte completa de testes unitários:
  - `tests/pricing.test.ts`: testes de cálculo de carrinho, cupons percentuais/fixos/frete grátis, incidência do Pix e arredondamentos.
  - `tests/shipping.test.ts`: testes de consolidação de pacotes, cálculo de prazos com produção sob demanda e threshold de frete grátis.
  - `tests/cart.test.ts`: testes de Server Actions para cupons e recálculo seguro.

## [0.3.0] — 2026-09-23
### Adicionado
- Autenticação e autorização em `src/lib/auth.ts`: papel `ADMIN`, guarda obrigatória no servidor via `requireAdmin()` (P-007) e sessão administrativa segura.
- Tela de login administrativo profissional em `src/app/admin/login/page.tsx` com credenciais padrão para ambiente de desenvolvimento/preview.
- Layout do painel administrativo em `src/app/admin/layout.tsx` seguindo `design.md` §7: interface densa e funcional sobre fundo neutro `--surface-alt` (`#F1EEE9`), barra lateral fixa (`AdminSidebar`) e barra superior (`AdminHeader`) com atalho direto para a loja virtual.
- Dashboard Administrativo em `src/app/admin/page.tsx`: métricas em tempo real de produtos ativos, categorias, parâmetros de desconto Pix e prazo de fabricação, além de atalhos rápidos de gestão.
- Tabela de Gestão de Produtos em `src/app/admin/produtos/page.tsx`: fotos 4:5, categorias, preços base, status e ações individuais de editar, duplicar, excluir e visualizar na loja.
- Formulário de Produto completo em `src/components/admin/product-form.tsx` e rotas `/admin/produtos/novo` e `/admin/produtos/[id]`:
  - Informações gerais: nome, slug automático, categoria, descrição.
  - Preço e variações em centavos inteiros (D-011): preço de venda, preço "De" riscado, cor com código hex.
  - Ficha técnica completa: dimensões (A × L × P), peso da peça, soquete, potência LED, lâmpada inclusa, comprimento do cabo e vedação para água.
  - Parâmetros obrigatórios de frete (P-006): altura, largura, profundidade da embalagem e peso de envio.
  - Imagens 4:5: foto principal e foto iluminada/ambientada para hover.
- Gestão de Categorias (`/admin/categorias`) com controle de ordem no menu e descrição para SEO.
- Gestão de Coleções (`/admin/colecoes`) para organização de vitrines editoriais.
- Configurações da Loja (`/admin/configuracoes`): canais de atendimento (WhatsApp e Instagram), CEP de origem para Melhor Envio, desconto no Pix (5%), parcelas sem juros (3x), limite de frete grátis (R$ 200,00) e prazo de produção 3D (3 dias).
- Server Actions protegidas em `src/server/admin-actions.ts` com validação de privilégios de administrador e revalidação sob demanda de cache.
- Testes unitários em `tests/admin.test.ts` cobrindo proteção no servidor (P-007), exigência de parâmetros de frete (P-006) e duplicação de peças.

## [0.2.0] — 2026-09-23
### Adicionado
- Modelagem completa do catálogo em `prisma/schema.prisma`: `Category`, `Collection`, `Product`, `ProductImage`, `ProductOption`, `ProductOptionValue`, `ProductVariant`, `ProductCollection` e `ProductVariantOptionValue`.
- Central de regras de preço em `src/lib/pricing.ts` (CLAUDE.md §4 e D-011): valores estritamente em centavos inteiros (`Int`), cálculo do desconto Pix de 5%, parcelamento sem juros em até 3x, cálculo de percentual de desconto e formatação BRL.
- Testes unitários para regras de preço em `tests/pricing.test.ts` (100% aprovados via Vitest).
- Repositório de dados resiliente em `src/lib/catalog.ts` com suporte a filtros (categoria, coleção, busca, material, faixa de preço, ordenação) e fallback automático para seed em memória.
- Conjunto de dados estruturados com ~10 produtos em `src/lib/data/catalog-seed.ts` e script `prisma/seed.ts` para popular Neon.
- Fotos vetoriais ilustradas em proporção 4:5 em `public/products/` para luminárias (estados aceso e apagado), vasos, cachepôs, plantários e organizadores.
- Componentes de vitrine em `src/components/loja/`:
  - `ProductCard`: proporção 4:5, troca suave de foto no hover para o estado iluminado/ambientado, selos de Lançamento e desconto, amostras de cor em bolinhas (16px) e bloco de preço com destaque Pix.
  - `ProductGrid`: grade responsiva para 2 colunas no mobile, 3 no tablet e 4 no desktop.
  - `ProductFilters`: barra de filtros com categorias, materiais (Eco PLA e PETG), ordenação e contagem dinâmica.
  - `VariantSelector`: seletor interativo de cores com bolinhas e tamanhos em pílulas com feedback em tempo real.
  - `ProductGallery`: galeria 4:5 com miniaturas e alternância entre produto isolado e aceso.
  - `ProductDetailsClient`: tela de produto com simulação de prazo de produção (3 dias úteis) e frete, garantias e botão de WhatsApp pré-preenchido com nome e SKU do produto.
- Novas páginas e rotas:
  - `/produtos`: catálogo geral com busca e filtros.
  - `/[categoria]`: rotas dinâmicas para categorias e coleções.
  - `/produtos/[slug]`: página detalhada do produto com ficha técnica estruturada, dimensões, material e vitrine de relacionados.
  - Atualização da Home (`/`) com vitrines ativas de Lançamentos e Mais Vendidos.

## [0.1.0] — 2026-09-23
### Adicionado
- Inicialização do projeto com Next.js 15 (App Router), React 19 e TypeScript estrito (`@/*` alias).
- Configuração do Tailwind CSS com os tokens e paleta oficial de `design.md` (neutros `--bg`, `--surface`, `--surface-alt`, `--border`, `--text`, `--text-muted`, `--ink` e acentos `--magenta`, `--laranja`, `--amarelo`, `--verde`, `--ciano`, `--violeta`, além do gradiente de marca).
- Tipografia configurada com `next/font/google`: títulos em `Sora` (600/700) e interface/corpo em `Inter` (400/500/600).
- Ativos vetoriais SVG da identidade visual Markah Brasil criados em `public/brand/`: `markah-simbolo.svg`, `markah-logo.svg`, `markah-logo-preto.svg`, `markah-logo-branco.svg` e `favicon.svg`.
- Layout base da loja em `src/app/(loja)`:
  - `BenefitBar`: barra superior de benefícios ("5% OFF no Pix", "3x sem juros", "Frete grátis ≥ R$ 200"), rotativa no mobile.
  - `Header`: barra fixa com logotipo oficial, busca expansível, links de categorias e destaque especial em violeta para Letras-caixa, gaveta de menu mobile e carrinho com badge.
  - `Footer`: faixa de garantias e confiança, logotipo branco sobre fundo escuro (`--ink`), links institucionais, políticas e selos de pagamento.
  - `WhatsAppButton`: botão flutuante oficial (56px) posicionado no canto inferior direito.
  - `Button`: componente base em formato de pílula (`rounded-full`) com variantes, estados de foco, hover e loading.
  - Página inicial demonstrativa com apresentação conceitual, preview de categorias e manifesto de materiais (PLA & PETG).
- Configuração do Prisma ORM para PostgreSQL/Neon em `prisma/schema.prisma` e singleton `src/lib/db.ts`.
- Configuração do Vitest com jsdom e testes automatizados de fundação em `tests/foundation.test.ts`.
- Arquivos de configuração `.env.example`, `.gitignore`, `tsconfig.json` e `eslint.config.mjs`.

### Estrutura
- Repositório Git inicializado.
- Dependências instaladas e configuradas.
- Validações completas: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passando com 0 erros.

## [0.0.1] — 2026-09-23
### Documentação
- Criados os arquivos de controle: `CLAUDE.md`, `PRD.md`, `decisoes.md` (D-001 a D-014), `mistakes.md` (armadilhas P-001 a P-010), `design.md` e `changelog.md`.
- Definidos escopo, regras de negócio, arquitetura e roadmap em 10 fases.

