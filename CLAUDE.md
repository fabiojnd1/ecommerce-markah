# CLAUDE.md — Ecommerce Markah

> Leia este arquivo inteiro no início de toda sessão. Ele é o mapa do projeto e diz quando consultar os outros documentos.

## 1. O que é este projeto

Loja virtual própria da **Markah Brasil** para vender luminárias, vasos e objetos decorativos **impressos em 3D** (PLA e PETG). Código próprio, hospedado na Vercel, pagamentos pelo Mercado Pago e frete pelo Melhor Envio (Correios + transportadoras).

- Pasta local: `C:\Dev\Ecommerce Markah`
- Instagram da marca: @markah_br
- Idioma do site, do código de negócio e dos commits: **português (pt-BR)**. Nomes técnicos (variáveis, funções, tabelas) em inglês.
- Moeda: BRL. Fuso: America/Sao_Paulo.

## 2. Documentos de controle (raiz do repositório)

| Arquivo | Pergunta que responde | Quando consultar |
|---|---|---|
| `CLAUDE.md` | Como trabalhar aqui? | Sempre, no início da sessão |
| `PRD.md` | O que estamos construindo? | Antes de iniciar qualquer funcionalidade ou fase; ao ter dúvida de escopo ou regra de negócio |
| `decisoes.md` | Por que foi feito assim? | Antes de trocar biblioteca, serviço, padrão de pasta ou arquitetura. **Não contrarie uma decisão registrada sem motivo concreto e sem registrar a nova decisão** |
| `mistakes.md` | Que erro já cometemos? | Antes de mexer em pagamento, frete, autenticação, banco e deploy; sempre que um erro se repetir |
| `design.md` | Como deve parecer? | Antes de criar ou alterar qualquer tela ou componente visual |
| `changelog.md` | O que mudou? | Ao terminar cada tarefa (registrar) e ao retomar o projeto (entender o estado atual) |

## 3. Mapa de pastas (alvo)

```
/
├─ CLAUDE.md, PRD.md, decisoes.md, mistakes.md, design.md, changelog.md
├─ prisma/
│  ├─ schema.prisma          # modelo de dados (fonte da verdade do banco)
│  ├─ migrations/            # nunca editar migração já aplicada
│  └─ seed.ts                # categorias, produtos de exemplo, admin inicial
├─ public/
│  └─ brand/                 # logo Markah (svg/png), favicon, og-image
├─ src/
│  ├─ app/
│  │  ├─ (loja)/             # páginas públicas: home, categorias, produto, carrinho, checkout, institucionais
│  │  ├─ (conta)/            # área do cliente: pedidos, endereços, favoritos, dados
│  │  ├─ admin/              # painel administrativo (somente role ADMIN)
│  │  ├─ letras-caixa/       # seção separada de letras-caixa (ver PRD §6)
│  │  └─ api/
│  │     ├─ webhooks/mercadopago/   # notificações de pagamento
│  │     └─ webhooks/melhorenvio/   # atualizações de envio
│  ├─ components/
│  │  ├─ ui/                 # componentes base (botão, input, badge...) — seguir design.md
│  │  ├─ loja/               # componentes de vitrine (card de produto, galeria, seletor de variação)
│  │  └─ admin/              # componentes do painel
│  ├─ lib/
│  │  ├─ db.ts               # cliente Prisma
│  │  ├─ auth.ts             # login admin (env) e cliente (link mágico) — D-017
│  │  ├─ session.ts          # tokens assinados HMAC (cookies de sessão e links mágicos)
│  │  ├─ runtime.ts          # regra "sem simulação/memória em produção" — D-018
│  │  ├─ site-config.ts      # WhatsApp e Instagram vindos das variáveis de ambiente
│  │  ├─ pricing.ts          # TODO cálculo de preço: variação, cupom, kit, desconto Pix, frete grátis
│  │  ├─ shipping/           # integração Melhor Envio
│  │  ├─ payments/           # integração Mercado Pago
│  │  └─ email/              # templates e envio (Resend)
│  ├─ middleware.ts          # bloqueia /admin/* sem sessão válida
│  ├─ server/                # server actions e regras de negócio (nunca no client)
│  └─ types/
├─ tests/                    # testes unitários (pricing, frete, cupons) e e2e do checkout
└─ .env.example              # todas as variáveis necessárias, sem valores reais
```

Se a estrutura real divergir desta, atualize este mapa no mesmo commit.

## 4. Regras de trabalho

1. **Uma fase por vez.** O roadmap está no `PRD.md` §10. Não comece a fase seguinte sem a anterior estar funcionando e registrada no `changelog.md`.
2. **Antes de codar**, diga em poucas linhas o que vai fazer e quais arquivos vai tocar.
3. **Dinheiro é sempre inteiro em centavos** (`priceCents: Int`). Nunca `float` para valores. Formatação só na camada de exibição.
4. **O servidor é a única fonte de preço.** Carrinho, cupom, desconto Pix e frete são recalculados no servidor no checkout. Nunca confie em valor vindo do navegador.
5. **Toda regra de preço passa por `src/lib/pricing.ts`** e tem teste unitário.
6. **Webhooks são idempotentes** e validam assinatura. Status de pedido só muda por webhook confirmado ou ação do admin, nunca pelo retorno do navegador.
7. **Segredos só em variáveis de ambiente.** Mantenha `.env.example` atualizado. Nunca commite `.env`.
8. **Credenciais de teste x produção**: use sandbox do Mercado Pago e do Melhor Envio em desenvolvimento e preview. Produção só no ambiente `production` da Vercel.
9. **Acessibilidade e mobile primeiro.** A maioria do público chega pelo Instagram, no celular.
10. **Não invente dependências.** Antes de adicionar pacote novo, verifique se já existe algo no projeto e registre a escolha em `decisoes.md` se for estrutural.
11. **Sem simulação em produção (D-018).** Todo `catch` que usa dados em memória chama `assertDevFallbackAllowed(err)`. Pagamento, frete e banco nunca "fingem" sucesso em produção.
12. **Consulte a documentação oficial atual** (Next.js, Prisma, Auth.js, Mercado Pago, Melhor Envio) antes de implementar integrações; APIs mudam.

## 5. Ao terminar cada tarefa

1. Rode lint, typecheck e testes (`npm run lint && npm run typecheck && npm test`).
2. Registre a mudança no `changelog.md` com a versão correta (MMP, ver regras lá).
3. Se tomou decisão estrutural, registre em `decisoes.md`.
4. Se encontrou e corrigiu um erro não trivial, registre em `mistakes.md`.
5. Se criou padrão visual novo, registre em `design.md`.

## 6. O que não fazer

- Não mudar stack, banco, ORM, autenticação ou gateway sem nova entrada em `decisoes.md`.
- Não gerar imagens de produto por IA: as fotos são enviadas pelo dono da loja.
- Não criar configurador 3D / personalização paramétrica no site: as peças são vendidas prontas.
- Não misturar letras-caixa com o catálogo de decoração (ver PRD §6).
- Não apagar nem reescrever entradas antigas de `changelog.md`, `decisoes.md` e `mistakes.md`; apenas acrescente.
