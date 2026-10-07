# decisoes.md — Registro de decisões

> "Por que estamos construindo dessa forma?" Decisões aqui registradas **não devem ser questionadas sem motivo concreto**. Para mudar uma decisão, crie uma nova entrada que a substitua (status `Substituída por D-XXX` na antiga) — nunca apague.

Formato:
```
## D-000 — Título
- Data:
- Status: Aceita | Substituída por D-XXX
- Contexto: por que precisamos decidir
- Decisão: o que foi escolhido
- Alternativas consideradas:
- Consequências: o que isso implica / o que evitar
```

---

## D-001 — Código próprio em vez de plataforma pronta
- Data: 23/09/2026
- Status: Aceita
- Contexto: Havia a opção de usar Shopify/Nuvemshop (como a loja de referência) ou construir do zero.
- Decisão: Código próprio, desenvolvido com o Antigravity.
- Alternativas: Shopify, Nuvemshop, híbrido (front próprio + checkout de plataforma).
- Consequências: Sem mensalidade de plataforma e controle total da experiência; em troca, pagamento, frete, admin e segurança são responsabilidade do projeto. Priorizar integrações oficiais e bem documentadas.

## D-002 — Next.js (App Router) + TypeScript
- Data: 23/09/2026
- Status: Aceita
- Contexto: A loja precisa de SEO forte (tráfego do Google e links compartilhados no Instagram/WhatsApp), hospedagem na Vercel e um painel admin no mesmo projeto.
- Decisão: Next.js com App Router, Server Components e Server Actions, em TypeScript estrito. Usar a versão estável mais recente no início do projeto.
- Alternativas: React + Vite (SPA, fraco em SEO), Remix, Astro.
- Consequências: Loja e admin no mesmo repositório; regras de negócio sempre no servidor.

## D-003 — Hospedagem na Vercel
- Data: 23/09/2026
- Status: Aceita
- Contexto: Escolha do dono; integração nativa com Next.js.
- Decisão: Vercel, com previews por branch e produção na branch `main`.
- Consequências: Variáveis de ambiente separadas por ambiente (development / preview / production); credenciais de produção só em production.

## D-004 — PostgreSQL (Neon) + Prisma
- Data: 23/09/2026
- Status: Aceita
- Contexto: Dados relacionais (produtos, variações, pedidos, cupons) e necessidade de migrações versionadas.
- Decisão: PostgreSQL gerenciado no Neon (integração da Vercel) com Prisma ORM.
- Alternativas: Supabase (banco + auth + storage), PlanetScale/MySQL, Drizzle ORM.
- Consequências: `prisma/schema.prisma` é a fonte da verdade do banco; migrações sempre por `prisma migrate`.

## D-005 — Autenticação com Auth.js
- Data: 23/09/2026
- Status: Substituída por D-017
- Contexto: Clientes precisam de conta (pedidos, favoritos, avaliações) e o dono precisa de acesso admin.
- Decisão: Auth.js com login por link mágico no e-mail e Google; papéis `CUSTOMER` e `ADMIN` na tabela de usuários.
- Alternativas: Clerk (pago em escala), Supabase Auth, senha própria.
- Consequências: Sem senhas para gerenciar; rotas `/admin` protegidas no servidor por papel.

## D-006 — Mercado Pago com checkout transparente (Payment Brick)
- Data: 23/09/2026
- Status: Aceita
- Contexto: O dono já tem conta no Mercado Pago. É necessário aplicar **desconto no Pix**, o que exige saber o método escolhido antes de criar a cobrança.
- Decisão: Payment Brick do Mercado Pago no próprio checkout + criação do pagamento via API no servidor + confirmação por webhook.
- Alternativas: Checkout Pro (redirecionamento; mais simples, mas o cliente escolhe o método fora do site, o que dificulta o desconto Pix), Stripe, Pagar.me.
- Consequências: Valor final calculado no servidor conforme o método; webhook idempotente com validação de assinatura.

## D-007 — Frete pelo Melhor Envio
- Data: 23/09/2026
- Status: Aceita
- Contexto: Envio pelos Correios e transportadoras, com cotação em tempo real.
- Decisão: API do Melhor Envio para cotação (lançamento), e depois etiquetas e rastreio.
- Alternativas: API direta dos Correios (contrato exigido), frete fixo por região.
- Consequências: Cada variação precisa de peso e dimensões de embalagem cadastrados; sem isso, a cotação falha.

## D-008 — Produção sob demanda, sem controle de estoque
- Data: 23/09/2026
- Status: Aceita
- Contexto: Peças são impressas após o pedido.
- Decisão: Sem estoque no lançamento; prazo de produção padrão de 3 dias úteis somado ao prazo do frete; o admin pode pausar produtos/variações.
- Consequências: Não implementar reserva/baixa de estoque. Se no futuro houver pronta-entrega, criar nova decisão.

## D-009 — Peças vendidas prontas, fotos enviadas pelo dono
- Data: 23/09/2026
- Status: Aceita
- Contexto: A personalização paramétrica já é feita pelo dono em outra ferramenta; as fotos serão reais.
- Decisão: Sem configurador 3D e sem geração de imagem por IA no site.
- Consequências: O foco do catálogo é boa fotografia, variações claras e ficha técnica completa.

## D-010 — Letras-caixa em seção separada, por orçamento
- Data: 23/09/2026
- Status: Aceita
- Contexto: O dono quer separar letras-caixa do restante do catálogo; o produto é personalizado por natureza.
- Decisão: Rota e landing próprias (`/letras-caixa`), pedido por formulário de orçamento que alimenta o admin e segue pelo WhatsApp. Entra depois do lançamento (fase 9).
- Consequências: Não misturar letras-caixa nas listagens de decoração. Preço automático fica para o futuro.

## D-011 — Valores monetários em centavos (inteiros)
- Data: 23/09/2026
- Status: Aceita
- Contexto: Erros de arredondamento em ponto flutuante afetam descontos e parcelas.
- Decisão: Todo valor em `Int` de centavos no banco e no código; formatação só na exibição (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`).
- Consequências: Toda regra de preço centralizada em `src/lib/pricing.ts` e coberta por testes.

## D-012 — Tailwind CSS + componentes próprios
- Data: 23/09/2026
- Status: Aceita
- Contexto: A identidade Markah é autoral (logo colorido e caligráfico) e precisa de visual próprio.
- Decisão: Tailwind com tokens definidos em `design.md`; componentes base em `src/components/ui`. Primitivas acessíveis (ex.: Radix) podem ser usadas por baixo.
- Consequências: Não usar temas prontos que deixem a loja com cara genérica.

## D-013 — Imagens no Vercel Blob e e-mails pelo Resend
- Data: 23/09/2026
- Status: Aceita
- Contexto: Upload de fotos pelo admin e envio de e-mails transacionais e de login.
- Decisão: Vercel Blob para arquivos; Resend para e-mails (com templates em React Email).
- Alternativas: Cloudinary, Supabase Storage, S3; SendGrid, Amazon SES.
- Consequências: Domínio de e-mail precisa ser verificado no Resend antes do lançamento.

## D-014 — Lançamento sem CNPJ
- Data: 23/09/2026
- Status: Aceita
- Contexto: A loja é nova; a formalização depende do desempenho.
- Decisão: Operar com CPF no Mercado Pago e no Melhor Envio, com declaração de conteúdo. Nota fiscal fica para fase futura.
- Consequências: Manter dados da loja (razão social, CNPJ) configuráveis no admin para quando houver formalização, sem exigir mudança de código.

## D-015 — Vitest para testes unitários e de integração
- Data: 23/09/2026
- Status: Aceita
- Contexto: Precisamos de testes unitários rápidos e compatíveis com TypeScript estrito, ESM e Next.js para regras de pricing, frete e cupons.
- Decisão: Vitest com ambiente jsdom e `@vitejs/plugin-react`.
- Alternativas consideradas: Jest (configuração mais pesada com transformadores ESM/TS).
- Consequências: Execução ultra-rápida via `npm test`, mesma API de expectativas do Jest.

## D-016 — Ponto de Pausa e Continuidade do Roadmap (v1.0.0 concluída)
- Data: 23/09/2026
- Status: Aceita
- Contexto: Pausa solicitada pelo usuário após a conclusão e validação integral de todas as fases de 0 a 8 do PRD.md §10 (atingindo a versão oficial v1.0.0).
- Decisão: O projeto encontra-se em estado estável e limpo (82 testes passando, 0 erros no typecheck, 0 warnings no ESLint e 32 rotas compiladas no build de produção). Na retomada solicitada pelo usuário, o trabalho deve iniciar imediatamente na fase seguinte do roadmap: **Fase 9 — Letras-caixa sob medida (v1.1.0)** (seção `/letras-caixa`, formulário de briefing/anexos e módulo de cotações no admin), ou atender a qualquer ajuste específico solicitado para fases anteriores.
- Consequências: Garantia de continuidade imediata e sem perda de contexto entre sessões.

## D-017 — Sessões próprias assinadas (HMAC) e login do cliente por link mágico
- Data: 26/09/2026
- Status: Aceita (substitui D-005)
- Contexto: O Auth.js previsto em D-005 nunca foi instalado. A implementação usava cookies em texto puro (`id:ADMIN:email`), que qualquer pessoa podia forjar, uma senha de admin fixa no código e um "login" de cliente que aceitava qualquer e-mail sem verificação (M-001, M-002, M-005).
- Decisão: Tokens próprios `payload.assinatura` assinados com HMAC-SHA256 (`src/lib/session.ts`, Web Crypto, funciona no middleware). Admin único com `ADMIN_EMAIL` / `ADMIN_PASSWORD` nas variáveis de ambiente. Cliente entra por link mágico enviado ao e-mail (válido por 20 min). `src/middleware.ts` bloqueia `/admin/*` sem sessão válida, e toda página/ação do admin chama `requireAdmin()`.
- Alternativas consideradas: Instalar Auth.js agora (mais dependências e adaptadores Prisma para um único admin); Clerk (pago).
- Consequências: `AUTH_SECRET` é obrigatória em produção. Login com Google fica para uma fase futura; se for necessário mais de um administrador ou login social, reavaliar Auth.js em nova decisão.

## D-018 — Nenhuma simulação ou dado em memória em produção
- Data: 26/09/2026
- Status: Aceita
- Contexto: Repositórios, pagamento e frete "caíam" silenciosamente para dados em memória ou simulação quando algo falhava. Em produção isso significava pedidos que sumiam, frete com preço inventado e cartões "aprovados" sem cobrança (M-003, M-004).
- Decisão: `src/lib/runtime.ts` centraliza a regra. Em produção: banco ausente ou com erro gera erro; frete sem Melhor Envio gera erro; pagamento sem credenciais gera erro. Simulações só em `npm run dev`. A variável `ALLOW_DEMO_DATA=true` permite rodar o build local sem banco com o catálogo de exemplo, mas nunca libera simulação de pagamento.
- Consequências: Todo `catch` que usa memória deve chamar `assertDevFallbackAllowed(err)`. Nunca definir `ALLOW_DEMO_DATA` na Vercel.

## D-019 — Cartão pelo Card Payment Brick e pedido salvo antes da cobrança
- Data: 26/09/2026
- Status: Aceita (complementa D-006)
- Contexto: O checkout pedia número, validade e CVV em campos próprios do site e enviava um token falso (`mock_card_token_...`). Além disso, o pedido só era salvo depois da cobrança: se o banco falhasse, o cliente pagava e o pedido não existia.
- Decisão: Card Payment Brick do Mercado Pago com o botão próprio oculto (`hidePaymentButton`) e `getFormData()` no clique de "Confirmar e Pagar" (`src/components/checkout/mercadopago-card-brick.tsx`). O pedido é salvo como `AGUARDANDO_PAGAMENTO` antes de chamar o Mercado Pago e a cobrança é anexada depois (`attachPaymentToOrder`). Toda cobrança leva `external_reference` = número do pedido. O webhook valida `x-signature`, confere o valor pago e só avança status permitidos.
- Consequências: `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` e `MERCADO_PAGO_WEBHOOK_SECRET` são obrigatórias em produção. O parcelamento sem juros (até 3x) precisa ser configurado no painel do Mercado Pago; o Brick exibe até 12x e o MP aplica juros acima do que estiver configurado.
