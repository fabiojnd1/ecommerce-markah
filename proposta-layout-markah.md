# Projeto de layout e melhoria visual — Markah Brasil

**Status:** primeira rodada implementada no workspace  
**Escopo:** experiência visual da loja, responsividade, hierarquia de conteúdo e comunicação com o cliente. O sistema e os fluxos de negócio existentes ficam como base.

## 1. Objetivo

Dar à loja uma aparência mais atual, autoral e acolhedora, ajudando cada pessoa a entender rapidamente o que a Markah vende, por que as peças são especiais e como escolher e comprar. O trabalho deve valorizar o design impresso em 3D e as fotografias, transmitir confiança e funcionar bem no celular.

## 2. Leitura do layout atual

### O que já funciona

- A identidade tem direção clara: fundo quente e neutro, tipografia moderna, logo colorido e acentos de marca usados com moderação.
- A home já conta a história de produção sob demanda, exibe lançamentos, mais vendidos, conteúdo de clientes, letras-caixa e benefícios.
- Os cards já apresentam avaliações, cores, preço no Pix e parcelamento.
- A página de produto concentra galeria, preço, variações, compra, WhatsApp e cálculo de frete.
- Há atenção a acessibilidade, estados de foco, movimento reduzido e componentes reutilizáveis.

### O que enfraquece a experiência

1. **A primeira dobra não mostra o produto.** Na captura de desktop, o hero é quase todo texto em uma coluna, seguido de bastante área vazia. A pessoa precisa rolar para ver as peças e ter uma noção concreta do estilo da marca.
2. **O menu some em larguras comuns de notebook.** A navegação principal só aparece em `xl`; numa janela de 1080 px, o topo fica com logo e ícones, sem categorias visíveis.
3. **Benefícios repetidos sem uma ordem de leitura.** Frete, Pix e parcelamento aparecem na barra superior e novamente no hero. O espaço pode ser usado para diferenciais que ajudem na escolha, como produção nacional, prazo de produção e personalização.
4. **As categorias não ajudam a imaginar o produto.** Na home, são caixas de texto sem imagens ou elementos visuais próprios.
5. **Os selos dos cards se acumulam.** Lançamento, desconto, kit e material sustentável aparecem como uma pilha de etiquetas, ocupando espaço da fotografia e disputando atenção.
6. **O catálogo mistura controles e resultados.** Filtros, chips e ordenação ficam dentro de um bloco alto; em telas médias os chips quebram linha e empurram a grade para baixo.
7. **A página de produto tem os elementos, mas falta hierarquia de decisão.** Preço, selos, opções, CTA, WhatsApp e frete aparecem em sequência densa. É possível organizar esses dados para deixar claro o que escolher, quanto custa e quando chega.
8. **Os visuais atuais limitam a sensação de marca editorial.** As peças aparecem isoladas em artes simples; as áreas de categoria e hero ganhariam muito com fotos reais de ambiente, escala e uso.

## 3. Direção proposta

Manter a base visual do `design.md` — galeria clara, off-white quente, Sora e Inter, logo oficial e cores de marca em detalhes — e elevar a apresentação com uma linguagem de **estúdio de design brasileiro**: mais fotografia de contexto, composições assimétricas leves, espaços bem ritmados e textos curtos que explicam o valor da peça.

Princípios de execução:

- Produto e ambiente em primeiro plano; texto entra para explicar e conduzir.
- Cada faixa da página responde a uma pergunta do cliente: “o que é?”, “como fica na minha casa?”, “qual escolho?”, “quanto custa e quando chega?”
- Uma mensagem principal e uma ação primária por bloco.
- Cor da marca como assinatura e orientação, sem colorir grandes áreas de conteúdo.
- A mesma experiência deve funcionar com toque, teclado e mouse.
- Não redesenhar o logo nem alterar regras de preço, estoque, frete, pagamento ou navegação funcional.

## 4. Proposta de home

### Primeira dobra

Transformar o hero em composição de duas colunas no desktop: mensagem e ações de um lado; fotografia editorial de uma luminária acesa ou composição de peças em um ambiente do outro. A imagem precisa mostrar textura, escala e luz real. No celular, manter a chamada, CTA e foto em sequência curta, sem uma área vazia extensa.

**Mensagem sugerida**

> Design autoral, feito camada por camada.  
> Peças impressas em 3D no Brasil para deixar sua casa com a sua cara.

CTA primário: **Explorar peças**. CTA secundário: **Conheça a Markah**. Abaixo, usar três garantias resumidas com ícones discretos: `Produzido no Brasil`, `Feito sob encomenda` e `Personalizável` (quando aplicável). Os benefícios de pagamento e frete ficam na barra superior e junto ao preço.

### Ordem de conteúdo

1. Barra de benefícios compacta e cabeçalho navegável.
2. Hero editorial com imagem de ambiente, proposta de valor e CTA.
3. Atalhos visuais para categorias prioritárias, com foto ou recorte de produto.
4. Lançamentos em destaque, com quatro cards limpos.
5. Faixa “Do seu jeito”: variações de cor, sob encomenda e letras-caixa, com CTA de orçamento.
6. Mais vendidos ou “Peças para iluminar seu espaço”, em uma vitrine única para reduzir repetição de produtos.
7. “Markah em Casa” com fotos de clientes e link para as peças mostradas.
8. Bloco curto “Como fazemos”: modelagem, impressão e acabamento em três etapas ilustradas.
9. Rodapé com atendimento, políticas e informações de compra.

### Esboço da primeira dobra

```text
┌ benefícios: Pix · parcelas · frete ───────────────────────────┐
│ logo      categorias principais                 busca ♡ conta 🛍 │
├───────────────────────────────────────────────────────────────┤
│ Design autoral, feito camada       [foto editorial do produto] │
│ por camada.                        [em um ambiente acolhedor]   │
│                                                               │
│ Peças impressas em 3D no Brasil     produção local · sob encom. │
│ para deixar sua casa com a sua cara.                           │
│ [Explorar peças] [Conheça a Markah]                            │
└───────────────────────────────────────────────────────────────┘
```

## 5. Propostas por tela

### Navegação e cabeçalho

- Fazer as categorias caberem já em larguras de notebook: reduzir a quantidade de links visíveis, agrupar em menu “Comprar por categoria” e manter “Letras-caixa” como destaque.
- Em tablet/celular, menu acessível por botão com categorias, busca, favoritos e conta agrupados.
- Manter barra de benefícios concisa; no celular, rotação sem movimento agressivo e respeitando movimento reduzido.
- Melhorar indicação da página atual e adicionar busca com rótulo acessível e sugestões visuais quando houver suporte.

### Catálogo e categorias

- Trocar o painel alto de filtros por uma barra enxuta: quantidade de peças, botão **Filtrar**, ordenação e chips ativos removíveis.
- No celular, abrir filtros em painel inferior ou lateral, com botão claro para aplicar e limpar.
- Usar selos com prioridade: mostrar no máximo dois na foto (ex.: `Lançamento` e `-14%`); material, kit e demais informações podem entrar como texto curto abaixo.
- Alinhar altura e informação dos cards. Garantir nome legível, preço principal, preço Pix e parcelamento sem excesso de separadores.
- Inserir imagem ou recorte de produto nos atalhos de categoria da home e nas páginas de categoria.

### Página de produto

- Manter galeria ampla e painel de compra organizado; deixar o painel preso ao rolar no desktop apenas se não prejudicar a altura disponível.
- Reordenar o painel: título e avaliação; preço e condição Pix/cartão; variações; prazo de produção; CTA; frete; ajuda e políticas resumidas.
- Exibir claramente a variação selecionada e orientar os estados indisponíveis.
- Levar prazo de fabricação e entrega para uma mensagem simples junto ao cálculo de CEP.
- No celular, adicionar barra fixa de compra somente após o cliente rolar além do CTA original, evitando cobrir WhatsApp ou campos.
- Dar mais espaço às imagens ambientadas e mostrar miniaturas/indicadores da galeria de forma evidente.

### Carrinho e checkout

- Carrinho: priorizar itens e total; manter barra de frete grátis perto do resumo; deixar cupom recolhido até ser necessário.
- Checkout: reforçar visualmente as etapas `Identificação → Entrega → Pagamento`, manter resumo visível no desktop e recolhível no celular.
- Usar rótulos persistentes, erros próximos aos campos e feedback claro nos estados de carregamento e sucesso.
- Manter as mudanças estritamente visuais, sem alterar integrações ou validações existentes.

### Administração

- Fora do escopo principal da loja. Aplicar apenas refinamentos pontuais de consistência caso a mesma identidade visual esteja exposta no painel; não reorganizar fluxos administrativos nesta etapa.

## 6. Sistema visual e conteúdo

- **Cores:** conservar os tokens existentes. Reservar magenta, laranja, verde, ciano e violeta para foco, estados e pequenos destaques.
- **Tipografia:** manter Sora em títulos e Inter em interface e texto. Evitar excesso de títulos em caixa alta e de texto pequeno.
- **Ritmo:** usar escala de espaçamento existente, mas reduzir o intervalo entre a navegação e o primeiro conteúdo; estabelecer separação uniforme entre seções.
- **Cards:** foto 4:5, fundo neutro, cantos de 12 px, hover discreto; CTA de opções não pode ser a única forma de descobrir a ação no celular.
- **Tom:** direto, caloroso e concreto. Explicar “feito sob encomenda” e impressão 3D com benefícios práticos, sem jargão.
- **Fotografia necessária:** hero de ambiente; pelo menos uma imagem por categoria prioritária; detalhes de textura e escala; versões acesa/apagada das luminárias; fotos verticais e quadradas para uso responsivo.

## 7. Plano de trabalho recomendado

### Fase 1 — Base da experiência

Cabeçalho responsivo, hero da home, espaçamento e tipografia das seções, atalhos de categoria e limpeza dos selos dos cards.

### Fase 2 — Decisão de compra

Reorganização visual do catálogo e da página de produto; filtros adaptados ao celular; destaque de variações, prazo, preço e CTA.

### Fase 3 — Fechamento da compra e confiança

Refino visual de carrinho e checkout, feedbacks de estados, prova social e consistência com o atendimento.

### Fase 4 — Revisão responsiva

Revisar larguras de celular, tablet e desktop, estados de foco, contraste, áreas de toque, conteúdo sem imagem, zoom e movimento reduzido.

## 8. Prioridade

| Prioridade | Melhoria | Motivo |
|---|---|---|
| P0 | Hero com foto de contexto e CTA claro | Torna o produto e o valor da marca compreensíveis antes da rolagem |
| P0 | Cabeçalho utilizável em notebook/tablet | Expõe o catálogo na largura comum de navegação |
| P0 | Simplificar cards e selos | Melhora leitura e libera espaço para o produto |
| P1 | Categorias visuais e catálogo mais enxuto | Ajuda descoberta e reduz fricção para filtrar |
| P1 | Hierarquia do painel de compra do produto | Facilita comparação de preço, variação e prazo |
| P2 | Ajustes de carrinho/checkout e reforço de prova social | Dá consistência ao percurso completo |

## 9. Critérios de aceite visual

- A primeira dobra da home apresenta produto real em contexto, proposta de valor e ação principal em desktop e celular.
- As categorias principais continuam acessíveis em larguras de notebook sem depender apenas do ícone de menu.
- Cards priorizam fotografia, nome e preço e não acumulam etiquetas.
- Filtros do catálogo não empurram a grade para baixo em celular e tablet.
- Página de produto deixa identificáveis a variação escolhida, preço final, prazo e ação de compra.
- Carrinho e checkout mantêm legibilidade e resumo do pedido em tela estreita.
- Foco, contraste, rótulos de campo e áreas de toque permanecem acessíveis.
- Nenhuma alteração visual muda regras ou dados do sistema.

## 10. O que foi aplicado

- Home reorganizada com hero visual, chamada e CTA mais diretos, categorias ilustradas, vitrine de novidades, chamada de personalização, mais vendidos e explicação do processo.
- Cabeçalho mostra os principais destinos em larguras de notebook e preserva todas as categorias no menu mobile.
- Cards priorizam produto e preço; no máximo dois selos ficam sobre a imagem.
- Filtros do catálogo ficam recolhidos por padrão em telas pequenas e informam quantos filtros estão ativos.
- Painel de preço e compra do produto ganhou hierarquia mais clara; o botão flutuante de WhatsApp não cobre a ação de compra nessa tela.
- Checkout apresenta a sequência de etapas e resumo recolhível em telas pequenas; o resumo lateral continua disponível no desktop.
- Carrinho não mantém o resumo preso à tela em celular.
- Controles de navegação, filtros, variações, CEP e quantidade receberam áreas de toque maiores; campos do checkout passaram a ter altura e texto mais confortáveis.
- Cabeçalho e filtros foram compactados nos breakpoints intermediários; o WhatsApp flutuante deixa de cobrir cards e ações nas telas de compra.
- Carrinho lateral, controles de cupom e opções de frete receberam áreas de toque de pelo menos 44px; campos de CEP/cupom e checkout usam fonte de 16px no celular para evitar zoom ao focar no Safari.
- Guia `design.md` atualizado com os padrões aplicados.

## 11. Próximo passo

A primeira rodada usa as ilustrações de produto já disponíveis. Quando houver fotografias reais de ambiente, substituir o destaque do hero e os atalhos de categoria por imagens de uso, escala e acabamento para aproximar ainda mais a experiência da peça final.
