# mistakes.md — Erros e correções

> Objetivo: **não cometer o mesmo erro duas vezes**. Consulte antes de mexer em pagamento, frete, autenticação, banco e deploy. Sempre que corrigir um erro não trivial, registre aqui. Nunca apague entradas.

Formato:
```
## M-000 — Título curto do erro
- Data:
- Fase / área: (ex.: Fase 4 — Pagamento)
- Sintoma: o que aconteceu / mensagem de erro
- Causa raiz: por que aconteceu
- Correção: o que foi feito (arquivos alterados)
- Como evitar: regra para as próximas sessões
```

---

## Armadilhas conhecidas (preventivas)

Não são erros que já aconteceram neste projeto, mas problemas comuns neste tipo de loja. Trate como regras.

### P-001 — Preço vindo do navegador
- Risco: cliente altera o valor no navegador e paga menos.
- Regra: todo total (itens, cupom, Pix, frete) é recalculado no servidor em `pricing.ts` antes de criar o pagamento.

### P-002 — Ponto flutuante em dinheiro
- Risco: `0.1 + 0.2` gera centavos errados em descontos e parcelas.
- Regra: centavos inteiros (D-011). Arredondamento de percentuais com `Math.round` num único lugar.

### P-003 — Webhook processado duas vezes
- Risco: o Mercado Pago reenvia notificações; o pedido muda de status duas vezes ou envia e-mail repetido.
- Regra: registrar o ID do evento/pagamento processado e ignorar repetidos; sempre consultar o pagamento na API do MP em vez de confiar no corpo do webhook; validar assinatura.

### P-004 — Confirmar pedido pelo retorno do navegador
- Risco: a página de "obrigado" marca o pedido como pago sem o pagamento ter sido aprovado.
- Regra: status `PAGO` só via webhook confirmado.

### P-005 — Credenciais de produção em preview
- Risco: testes cobram cartões reais ou geram etiquetas pagas.
- Regra: credenciais de produção só no ambiente `production` da Vercel; conferir o ambiente antes de testar pagamento.

### P-006 — Variação sem peso/dimensões
- Risco: cotação do Melhor Envio falha e o checkout trava.
- Regra: peso e dimensões de embalagem obrigatórios no cadastro da variação; se faltar, bloquear publicação do produto no admin.

### P-007 — Rota admin protegida só no front
- Risco: Server Action ou API do admin acessível sem login.
- Regra: checar papel `ADMIN` no servidor em toda action/rota de `/admin`, não só no layout.

### P-008 — Editar migração já aplicada
- Risco: banco de produção fica divergente do schema.
- Regra: nunca editar arquivos em `prisma/migrations/`; criar nova migração.

### P-009 — Imagens pesadas
- Risco: página de produto lenta no celular (fotos originais de câmera com vários MB).
- Regra: sempre `next/image` com `sizes`; limitar tamanho no upload do admin.

### P-010 — Fuso horário
- Risco: validade de cupom e prazos calculados em UTC viram "ontem/amanhã".
- Regra: armazenar em UTC, calcular e exibir em America/Sao_Paulo; dias úteis consideram fins de semana (feriados: fase futura).

---

## Registro de erros do projeto

## M-001 — Cookie de sessão sem assinatura permitia virar administrador
- Data: 26/09/2026
- Fase / área: Fases 2 e 4 — Autenticação
- Sintoma: Qualquer pessoa que criasse o cookie `markah_admin_session=x:ADMIN:x` no navegador entrava no painel e podia alterar pedidos, cupons e produtos.
- Causa raiz: A sessão era o texto `id:papel:email` em claro; o servidor confiava no conteúdo sem verificar origem.
- Correção: `src/lib/session.ts` (tokens assinados com HMAC-SHA256 e expiração), `src/lib/auth.ts` reescrito. Testes em `tests/auth-security.test.ts`.
- Como evitar: Nenhum dado de identidade vindo do navegador é confiável sem assinatura verificada no servidor.

## M-002 — Senha de admin fixa no código e login de admin do banco sem senha
- Data: 26/09/2026
- Fase / área: Fase 2 — Autenticação
- Sintoma: `admin@markah.com.br` / `markah2026` funcionava em qualquer ambiente, inclusive produção; e um usuário ADMIN do banco entrava digitando só o e-mail, com qualquer senha.
- Causa raiz: Credenciais "de desenvolvimento" sem verificação de ambiente; senha nunca comparada para usuários do banco.
- Correção: Login por `ADMIN_EMAIL` / `ADMIN_PASSWORD` (variáveis de ambiente); credencial de desenvolvimento só fora de produção.
- Como evitar: Credenciais nunca no código. Todo atalho de desenvolvimento deve checar `NODE_ENV`.

## M-003 — Cartão aprovado sem cobrança real em produção
- Data: 26/09/2026
- Fase / área: Fase 4 — Pagamento
- Sintoma: Com o token de produção (`APP_USR-...`), qualquer compra no cartão era marcada como PAGA sem cobrar; se a API do MP falhasse, idem. O Pix em produção gerava QR Code falso.
- Causa raiz: O código só considerava "real" um token que começasse com `TEST-` e, em qualquer outro caso ou erro, caía numa simulação que aprovava o pagamento.
- Correção: `src/lib/payments/mercadopago.ts` reescrito — aceita `TEST-` e `APP_USR-`, devolve erro em qualquer falha e só simula em desenvolvimento sem credenciais.
- Como evitar: Regra D-018. Nunca transformar erro de pagamento em sucesso.

## M-004 — Webhook aceitava notificação falsa e marcava pedido como PAGO
- Data: 26/09/2026
- Fase / área: Fase 4 — Webhook
- Sintoma: `POST /api/webhooks/mercadopago?orderNumber=MKB-xxxxx` com qualquer ID aprovava o pedido. Webhooks reais nunca encontravam o pedido (buscava pelo ID do pedido em vez do ID do pagamento).
- Causa raiz: Sem validação de `x-signature`; consulta ao MP simulada sempre respondia "approved"; pedido localizado por parâmetros da própria requisição; sem conferência de valor.
- Correção: Webhook reescrito (assinatura obrigatória em produção, `external_reference`, `getOrderByPaymentId`, conferência de valor, transições de status controladas, idempotência por pagamento+status). Testes em `tests/webhook.test.ts`.
- Como evitar: O webhook só acredita na API do Mercado Pago e em requisições assinadas.

## M-005 — "Minha conta" abria os pedidos de qualquer e-mail digitado
- Data: 26/09/2026
- Fase / área: Fase 5 — Área do cliente
- Sintoma: Digitando o e-mail de outra pessoa em `/conta`, era possível ver nome, endereço e pedidos dela.
- Causa raiz: O login criava a sessão direto a partir do e-mail informado, sem provar que a pessoa é dona dele.
- Correção: Login por link mágico enviado ao e-mail (`customerLoginAction` + rota `/conta/entrar`).
- Como evitar: Dados pessoais só com prova de posse do e-mail (ou número do pedido + e-mail/CPF, como no rastreio).

## M-006 — Painel admin e pedidos acessíveis sem login
- Data: 26/09/2026
- Fase / área: Fases 2 e 5 — Admin
- Sintoma: `/admin` e `/admin/pedidos` exibiam faturamento, nomes, CPFs e endereços para visitantes não logados.
- Causa raiz: O layout do admin renderizava as páginas mesmo sem sessão (para permitir o `/admin/login`) e as páginas de servidor não chamavam `requireAdmin()`.
- Correção: `src/middleware.ts` redireciona `/admin/*` para o login; todas as páginas do admin chamam `requireAdmin()`; layout com `dynamic = "force-dynamic"`.
- Como evitar: P-007 vale também para páginas de servidor, não só para Server Actions.

## M-007 — Frete grátis concedido com base no subtotal sem cupom
- Data: 26/09/2026
- Fase / área: Fase 3 — Frete / Preço
- Sintoma: Carrinho de R$ 210 com cupom de R$ 20 (subtotal R$ 190) ganhava frete grátis; e o frete grátis valia também para o SEDEX, não só para a opção mais barata.
- Causa raiz: `melhor-envio.ts` zerava o frete olhando o subtotal bruto, e o checkout usava esse preço já zerado.
- Correção: O checkout passa o preço cheio da transportadora e o `pricing.ts` decide (`cheapestShippingPriceCents`). Testes em `tests/pricing.test.ts`.
- Como evitar: Regra de preço só em `pricing.ts` (CLAUDE.md §4.5).

## M-008 — `cookies()` dentro de try/catch deixava /admin e /conta estáticos
- Data: 26/09/2026
- Fase / área: Build / Next.js
- Sintoma: No `next build`, páginas do admin eram pré-geradas como estáticas e `/conta` era gerada sem usuário.
- Causa raiz: O Next sinaliza "página dinâmica" lançando uma exceção dentro de `cookies()`; o `try/catch` a engolia.
- Correção: `cookies()` chamado fora do `try` em `src/lib/auth.ts`.
- Como evitar: Nunca envolver `cookies()`, `headers()` ou `searchParams` em try/catch genérico.
