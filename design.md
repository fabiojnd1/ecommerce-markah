# design.md — Guia visual Markah

> "Como o sistema deve parecer?" Consulte antes de criar ou alterar qualquer tela. Todo padrão novo que virar reutilizável deve ser registrado aqui.

## 1. Conceito

A marca **Markah Brasil** tem um logo autoral: uma estrela/peça de quebra-cabeça em aquarela multicolorida (magenta, laranja, amarelo, verde, ciano, violeta) com contorno preto, um traço curvo sobre o nome e "Markah" em caligrafia preta. **Logo oficial:** `public/brand/markah-logo.png` (fornecido pelo dono em 26/09/2026 — não redesenhar, não vetorizar por conta própria).

Direção: **galeria clara e artesanal**. O fundo é neutro e calmo para que as peças impressas em 3D e o próprio logo sejam as únicas coisas coloridas da tela. A cor do logo aparece em **toques pontuais** (selos, destaques, ilustrações de fundo muito suaves), nunca em grandes blocos que briguem com as fotos dos produtos.

Palavras-guia: artesanal, tecnológico, luminoso, brasileiro, acolhedor.

## 2. Logo

Arquivos em `public/brand/` (gerados a partir do PNG oficial, fundo transparente):

| Arquivo | Uso |
|---|---|
| `markah-logo.png` | Logo colorido — header, checkout, admin, login |
| `markah-logo-branco.png` | Contorno e nome em branco, estrela colorida — fundos escuros (rodapé, banners `--ink`) |
| `markah-logo-preto.png` | Monocromático preto — impressos, etiquetas, carimbos |
| `markah-simbolo.png` | Só a estrela (512×512) — avatar, selo, imagem padrão de produto sem foto |
| `favicon-32.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `/favicon.ico` | Ícones do navegador e da tela inicial do celular |
| `markah-og.png` | Imagem de compartilhamento (1200×630) para WhatsApp/Instagram/Google |

- Proporção do logo: ~2:1 (largura ≈ 2 × altura). Nas tags `<Image>`, `width`/`height` devem respeitar essa proporção.
- Alturas: header 56px desktop / 40px mobile; rodapé 64px; checkout 44px; login do admin 64px; barra lateral do admin 36px.
- O nome "Markah" ocupa só a metade de baixo do logo: não usar o logo completo abaixo de 36px de altura — use o símbolo.
- Área de respiro mínima: metade da altura do símbolo em volta.
- Nunca distorcer, recolorir a estrela, aplicar sombra ou colocar sobre foto sem película.

## 3. Cores (tokens)

Defina como variáveis CSS e mapeie no Tailwind.

### Neutros (base de toda a interface)
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#FAF8F5` | Fundo geral (off-white quente) |
| `--surface` | `#FFFFFF` | Cards, gaveta do carrinho, modais |
| `--surface-alt` | `#F1EEE9` | Seções alternadas, fundo de fotos de produto |
| `--border` | `#E4DFD7` | Bordas e divisores |
| `--text` | `#1A1A1A` | Texto principal (mesmo preto do logo) |
| `--text-muted` | `#6B665F` | Texto secundário, legendas |
| `--ink` | `#111111` | Botão primário, rodapé, barra de benefícios |

### Acentos (tirados do logo — usar com moderação)
| Token | Hex | Uso |
|---|---|---|
| `--magenta` | `#E0218A` | Selo "Lançamento", destaques pontuais, foco de links |
| `--laranja` | `#F26B1D` | Selo "Promoção", preço promocional |
| `--amarelo` | `#F7C933` | Estrelas das avaliações |
| `--verde` | `#2BAA5E` | Sucesso, "Pagamento aprovado", selo Pix, material sustentável |
| `--ciano` | `#1FA4D9` | Informação, links de ajuda |
| `--violeta` | `#7B3FB8` | Seção Letras-caixa (cor de identidade dela) |

### Estados
- Erro: `#C62828` · Aviso: `#B26A00` · Sucesso: `--verde` · Info: `--ciano`.

### Gradiente de marca
`linear-gradient(120deg, #E0218A, #F26B1D, #F7C933, #2BAA5E, #1FA4D9, #7B3FB8)` — somente em detalhes finos: sublinhado de título de seção (3px), borda de destaque de banner, barra de progresso do frete grátis. Nunca como fundo de área de texto.

### Modo escuro
Não há modo escuro no lançamento (loja de produto com fotos em fundo claro).

## 4. Tipografia

- **Títulos**: `Sora` (Google Fonts), pesos 600/700. Moderna e geométrica, conversa com o "tecnológico" e contrasta com a caligrafia do logo sem competir com ela.
- **Texto e interface**: `Inter`, pesos 400/500/600.
- **Nunca** imitar a caligrafia do logo em textos do site.
- Carregar com `next/font` (sem requisição externa em tempo de execução).

| Estilo | Desktop | Mobile | Peso | Fonte |
|---|---|---|---|---|
| Display (banner) | 56px / 1.05 | 36px | 700 | Sora |
| H1 | 40px / 1.1 | 30px | 700 | Sora |
| H2 (título de seção) | 30px / 1.15 | 24px | 600 | Sora |
| H3 | 20px / 1.3 | 18px | 600 | Sora |
| Corpo | 16px / 1.6 | 16px | 400 | Inter |
| Pequeno | 14px / 1.5 | 14px | 400 | Inter |
| Legenda / selo | 12px, caixa alta, espaçamento 0.08em | 12px | 600 | Inter |
| Preço | 22px | 20px | 700 | Inter, números tabulares |

## 5. Espaçamento, grid e forma

- Escala de espaçamento base 4px: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Container máximo 1280px; margens laterais 16px (mobile), 24px (tablet), 32px (desktop).
- Grade de produtos: 2 colunas (mobile), 3 (tablet), 4 (desktop); gap 16px / 24px.
- Raio: 12px em cards e imagens, 999px em botões e selos (forma de pílula, orgânica como o logo), 8px em inputs.
- Sombras discretas: `0 1px 2px rgba(0,0,0,.06)` em repouso, `0 8px 24px rgba(0,0,0,.08)` em hover de card.
- Seções da home separadas por 64px (mobile 48px).

## 6. Fotografia

- Proporção padrão das fotos de produto: **4:5** (retrato), fundo neutro claro e consistente.
- Primeira foto: produto isolado; segunda: ambientado; para luminárias, ter uma foto **acesa** — no card, o hover troca para a foto acesa/ambientada ("bonita acesa e apagada").
- Sempre `next/image` com `sizes` corretos, `alt` descritivo e placeholder de blur.
- Galeria de clientes: proporção 1:1 ou 9:16 (vídeo), com @ do cliente sobreposto.

### Home e catálogo
- A primeira dobra combina mensagem e ação de compra à esquerda com uma peça em destaque à direita; em telas estreitas, a imagem vem logo após a chamada.
- Ordem da home: hero, atalhos visuais por categoria, lançamentos, personalização/letras-caixa, mais vendidos, galeria de clientes e explicação breve do processo.
- Atalhos de categoria usam imagens 4:5 de produto, título visível e área clicável completa.
- Barra de navegação desktop mostra os principais acessos já em notebook; menu mobile mantém todas as categorias e atalhos da conta.
- Catálogo mantém contagem e ordenação em uma barra enxuta. Em celular, filtros ficam recolhidos e indicam quando há filtros ativos.
- Cards mostram no máximo dois selos sobre a imagem. Material e informações adicionais ficam junto ao nome/cores.

## 7. Componentes

### Header
- Barra de benefícios acima (fundo `--ink`, texto branco, 12–13px), rotativa no mobile: "5% OFF no Pix · Até 3x sem juros · Frete grátis acima de R$ 200".
- Header branco, fixo ao rolar: logo, menu (Luminárias de mesa, Pendentes, Vasos, Cachepôs, Plantários, Organizadores, Lançamentos, **Letras-caixa** em destaque com `--violeta`), busca, favoritos, conta, carrinho com contador.
- Mobile: menu em gaveta lateral; busca expansível.

### Botões
- **Primário**: fundo `--ink`, texto branco, pílula, altura 48px, peso 600. Hover: leve clareada e sombra.
- **Secundário**: borda 1.5px `--ink`, fundo transparente.
- **Pix**: fundo `--verde` (somente no checkout, para o método Pix).
- **Fantasma**: só texto, sublinhado no hover.
- Estados obrigatórios: hover, foco visível (anel 2px `--magenta` com 2px de afastamento), desabilitado (40% opacidade), carregando (spinner + texto mantido).

### Card de produto
- Foto 4:5, raio 12px, fundo `--surface-alt`.
- Selos no canto superior esquerdo (pílulas 12px): "Lançamento" (`--magenta`), "-15%" (`--laranja`), "Kit".
- Coração de favoritar no canto superior direito.
- Abaixo: nome (16px, 500), estrelas + contagem, preço (cheio riscado quando houver promoção), linha "R$ X no Pix" em `--verde`, parcelas em `--text-muted`.
- Amostras de cor (bolinhas 16px) quando houver variação de cor.
- Hover (desktop): troca para a segunda foto e botão "Ver opções".

### Página de produto
- Desktop: galeria à esquerda (60%), informações à direita (40%) fixas ao rolar. Mobile: carrossel com indicadores, informações abaixo, botão "Adicionar ao carrinho" fixo no rodapé.
- Seletor de variação: cor em bolinhas com nome no hover/seleção; tamanho e textura em pílulas; opção indisponível riscada e desabilitada.
- Bloco de preço: preço, Pix, parcelas.
- Calculadora de frete: campo CEP + botão; resultado lista opções com preço e prazo total ("Produção 3 dias úteis + entrega X dias úteis").
- No celular, o WhatsApp contextual fica junto às informações do produto; a barra fixa de compra não é coberta por outro botão flutuante.
- Abas/acordeão: Descrição, Ficha técnica (tabela), Cuidados, Avaliações.

### Carrinho (gaveta)
- Abre pela direita (mobile: tela cheia), lista itens com miniatura, variação, quantidade e remover.
- **Barra de frete grátis** com o gradiente de marca: "Faltam R$ 42,10 para frete grátis" → "Você ganhou frete grátis!".
- Campo de cupom recolhível, subtotal, botão "Finalizar compra".

### Checkout
- Página enxuta: header só com logo e selo "Compra segura", sem menu.
- Etapas: Identificação → Entrega → Pagamento; resumo do pedido à direita (desktop) ou recolhível no topo (mobile).
- Pix mostra o valor com desconto em destaque verde; cartão mostra seletor de parcelas.
- Confirmação Pix: QR Code grande, botão "Copiar código", contador de expiração, status atualizando sozinho.

### Formulários
- Rótulo sempre visível acima do campo (nunca só placeholder).
- Input altura 48px, borda `--border`, foco com borda `--text` e anel `--magenta`.
- Erro abaixo do campo em `#C62828`, 14px, com ícone.
- CEP preenche endereço automaticamente; máscaras para CPF, CEP e telefone.

### Selos e badges
Pílulas 12px caixa alta. Status de pedido no admin e na conta:
Aguardando pagamento (amarelo claro), Pago (verde), Em produção (ciano), Enviado (violeta), Entregue (verde escuro), Cancelado (cinza), Reembolsado (cinza).

### Avaliações
Estrelas `--amarelo`; média grande + distribuição por estrela; fotos de clientes em miniatura.

### Galeria "Markah em casa"
Carrossel horizontal com rolagem por arraste, cards 1:1 com @ do cliente; clique abre modal com foto/vídeo e link para o produto. Chamada: "Marque @markah_br e apareça aqui".

### WhatsApp flutuante
Círculo 56px no canto inferior direito em páginas de conteúdo. Não aparece sobre home, catálogo, categorias, vitrines de produto e carrinho para não cobrir cards e ações; na página de produto, o contato fica junto às opções de compra. O rodapé mantém o acesso ao WhatsApp.

### Rodapé
Fundo `--ink`, texto claro: logo branco, links institucionais, políticas, contato, redes sociais, formas de pagamento, selo de site seguro, dados da empresa (configuráveis).

### Seção Letras-caixa
Mesmo sistema visual, com `--violeta` como cor de destaque e fotos noturnas com as letras acesas. Pode usar fundo escuro (`--ink`) no banner para valorizar o LED.

### Admin
Interface funcional e densa: mesmo tipo e tokens, fundo `--surface-alt`, barra lateral de navegação, tabelas com busca e filtros, sem elementos decorativos (sem gradiente de marca).

## 8. Movimento

- Transições 150–250ms, `ease-out`.
- Hover de card: elevação + troca de imagem com fade.
- Gaveta do carrinho desliza da direita.
- Respeitar `prefers-reduced-motion` (desativar animações não essenciais).

## 9. Acessibilidade

- Contraste mínimo AA (4.5:1 texto, 3:1 elementos grandes). Acentos coloridos **não** são usados para texto pequeno sobre branco, exceto `--verde` e `--magenta` em tamanho ≥ 14px peso 600 (verificar).
- Foco visível em todo elemento interativo.
- Áreas de toque de no mínimo 44 × 44px.
- Campos de entrada com fonte de 16px no celular para evitar zoom inesperado no Safari; em telas maiores, podem voltar à escala compacta da interface.
- Formulários e controles de frete devem caber em uma coluna estreita: permitir que o campo encolha e manter o botão visível sem rolagem horizontal.
- Cor nunca é o único indicador (ex.: variação indisponível também é riscada).

## 10. Tom de voz

Próximo, acolhedor e direto, na segunda pessoa ("você"). Valoriza o feito à mão com tecnologia: "produzido sob encomenda", "impresso em 3D aqui no Brasil". Sem exageros nem caixa alta em frases inteiras (exceto selos e barra de benefícios).
