export interface SeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  imageUrl?: string;
}

export interface SeedOptionValue {
  id: string;
  name: string;
  colorHex?: string;
}

export interface SeedOption {
  id: string;
  name: string;
  values: SeedOptionValue[];
}

export interface SeedVariant {
  id: string;
  sku: string;
  priceCents: number;
  compareAtPriceCents?: number | null;
  weightGrams: number;
  packageHeightCm: number;
  packageWidthCm: number;
  packageDepthCm: number;
  active: boolean;
  selectedOptionValueIds: string[];
}

export interface SeedImage {
  id: string;
  url: string;
  alt: string;
  displayOrder?: number;
  isPrimary: boolean;
  isHover: boolean;
}

export interface SeedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  collectionSlugs: string[];
  material: "PLA" | "PETG";
  isSustainable: boolean;
  productionDays: number;
  // Ficha técnica
  dimensions: string;
  weightGrams: number;
  socketType?: string;
  maxWattage?: number;
  bulbIncluded?: boolean;
  cordLengthCm?: number;
  waterproof?: boolean;
  tags?: string[];
  images: SeedImage[];
  options: SeedOption[];
  variants: SeedVariant[];
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    id: "cat_luminarias_mesa",
    name: "Luminárias de mesa",
    slug: "luminarias-de-mesa",
    description: "Iluminação difusa e envolvente com design escultural.",
    displayOrder: 1,
  },
  {
    id: "cat_pendentes",
    name: "Pendentes",
    slug: "pendentes",
    description: "Peças aéreas com padrões geométricos e luz aconchegante.",
    displayOrder: 2,
  },
  {
    id: "cat_vasos",
    name: "Vasos",
    slug: "vasos",
    description: "Vasos contemporâneos para flores secas e composições decorativas.",
    displayOrder: 3,
  },
  {
    id: "cat_cachepos",
    name: "Cachepôs",
    slug: "cachepos",
    description: "Cachepôs orgânicos e geométricos perfeitos para plantas e suculentas.",
    displayOrder: 4,
  },
  {
    id: "cat_plantarios",
    name: "Plantários",
    slug: "plantarios",
    description: "Estruturas que unem botânica e design tridimensional.",
    displayOrder: 5,
  },
  {
    id: "cat_organizadores",
    name: "Organizadores",
    slug: "organizadores",
    description: "Acessórios de mesa e bandejas com textura tátil única.",
    displayOrder: 6,
  },
];

export const SEED_COLLECTIONS = [
  {
    id: "col_lancamentos",
    name: "Lançamentos",
    slug: "lancamentos",
    description: "As criações mais recentes saídas das impressoras Markah.",
  },
  {
    id: "col_mais_vendidos",
    name: "Mais Vendidos",
    slug: "mais-vendidos",
    description: "Os clássicos favoritos dos nossos clientes.",
  },
  {
    id: "col_kits",
    name: "Kits Decorativos",
    slug: "kits",
    description: "Combinações harmoniosas com condições especiais.",
  },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: "prod_saturno",
    name: "Luminária de Mesa Saturno",
    slug: "luminaria-de-mesa-saturno",
    description:
      "Inspirada na beleza celestial dos anéis planetários, a Luminária Saturno combina uma base cônica de apoio e uma cúpula difusora que projeta uma luz quente e relaxante de 2700K. Impressa em PLA de origem botânica, cada camada de 0.2mm cria uma textura sutil e refinada ao toque. Perfeita para mesas de cabeceira, aparadores e mesas de trabalho.",
    categorySlug: "luminarias-de-mesa",
    collectionSlugs: ["lancamentos", "mais-vendidos"],
    material: "PLA",
    isSustainable: true,
    productionDays: 3,
    dimensions: "24 × 28 × 28 cm",
    weightGrams: 420,
    socketType: "E27",
    maxWattage: 12,
    bulbIncluded: true,
    cordLengthCm: 150,
    tags: ["Lançamento", "Mais Vendido"],
    images: [
      {
        id: "img_saturno_1",
        url: "/products/luminaria-saturno-off.svg",
        alt: "Luminária Saturno Markah apagada com base terracota",
        isPrimary: true,
        isHover: false,
      },
      {
        id: "img_saturno_2",
        url: "/products/luminaria-saturno-on.svg",
        alt: "Luminária Saturno Markah iluminada com anel cósmico",
        isPrimary: false,
        isHover: true,
      },
    ],
    options: [
      {
        id: "opt_saturno_base",
        name: "Cor da Base",
        values: [
          { id: "val_saturno_base_terracota", name: "Terracota", colorHex: "#D97A53" },
          { id: "val_saturno_base_marfim", name: "Branco Marfim", colorHex: "#FAF8F5" },
          { id: "val_saturno_base_preto", name: "Preto Fosco", colorHex: "#222222" },
        ],
      },
      {
        id: "opt_saturno_cupula",
        name: "Cor da Cúpula",
        values: [
          { id: "val_saturno_cupula_marfim", name: "Branco Marfim", colorHex: "#FAF8F5" },
          { id: "val_saturno_cupula_terracota", name: "Terracota", colorHex: "#D97A53" },
          { id: "val_saturno_cupula_preto", name: "Preto Fosco", colorHex: "#222222" },
        ],
      },
      {
        id: "opt_saturno_tamanho",
        name: "Tamanho",
        values: [
          { id: "val_tam_padrao", name: "Padrão (Ø 28cm)" },
          { id: "val_tam_grande", name: "Grande (Ø 35cm)" },
        ],
      },
    ],
    variants: [
      // 1. Base Terracota + Cúpula Marfim + Padrão (variante principal)
      {
        id: "var_saturno_terracota_padrao",
        sku: "MKH-SAT-TER-MAR-STD",
        priceCents: 18900,
        compareAtPriceCents: 21900,
        weightGrams: 420,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 30,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_terracota", "val_saturno_cupula_marfim", "val_tam_padrao"],
      },
      // 2. Base Terracota + Cúpula Terracota + Padrão
      {
        id: "var_saturno_terracota_terracota_padrao",
        sku: "MKH-SAT-TER-TER-STD",
        priceCents: 18900,
        compareAtPriceCents: null,
        weightGrams: 420,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 30,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_terracota", "val_saturno_cupula_terracota", "val_tam_padrao"],
      },
      // 3. Base Terracota + Cúpula Preto + Padrão
      {
        id: "var_saturno_terracota_preto_padrao",
        sku: "MKH-SAT-TER-BLK-STD",
        priceCents: 18900,
        compareAtPriceCents: null,
        weightGrams: 420,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 30,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_terracota", "val_saturno_cupula_preto", "val_tam_padrao"],
      },
      // 4. Base Marfim + Cúpula Marfim + Padrão
      {
        id: "var_saturno_marfim_padrao",
        sku: "MKH-SAT-MAR-MAR-STD",
        priceCents: 18900,
        compareAtPriceCents: null,
        weightGrams: 420,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 30,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_marfim", "val_saturno_cupula_marfim", "val_tam_padrao"],
      },
      // 5. Base Marfim + Cúpula Terracota + Padrão
      {
        id: "var_saturno_marfim_terracota_padrao",
        sku: "MKH-SAT-MAR-TER-STD",
        priceCents: 18900,
        compareAtPriceCents: null,
        weightGrams: 420,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 30,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_marfim", "val_saturno_cupula_terracota", "val_tam_padrao"],
      },
      // 6. Base Marfim + Cúpula Preto + Padrão
      {
        id: "var_saturno_marfim_preto_padrao",
        sku: "MKH-SAT-MAR-BLK-STD",
        priceCents: 18900,
        compareAtPriceCents: null,
        weightGrams: 420,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 30,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_marfim", "val_saturno_cupula_preto", "val_tam_padrao"],
      },
      // 7. Base Preto + Cúpula Marfim + Padrão
      {
        id: "var_saturno_preto_padrao",
        sku: "MKH-SAT-BLK-MAR-STD",
        priceCents: 18900,
        compareAtPriceCents: null,
        weightGrams: 420,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 30,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_preto", "val_saturno_cupula_marfim", "val_tam_padrao"],
      },
      // 8. Base Preto + Cúpula Terracota + Padrão
      {
        id: "var_saturno_preto_terracota_padrao",
        sku: "MKH-SAT-BLK-TER-STD",
        priceCents: 18900,
        compareAtPriceCents: null,
        weightGrams: 420,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 30,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_preto", "val_saturno_cupula_terracota", "val_tam_padrao"],
      },
      // 9. Base Preto + Cúpula Preto + Padrão
      {
        id: "var_saturno_preto_preto_padrao",
        sku: "MKH-SAT-BLK-BLK-STD",
        priceCents: 18900,
        compareAtPriceCents: null,
        weightGrams: 420,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 30,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_preto", "val_saturno_cupula_preto", "val_tam_padrao"],
      },

      // 10. Base Terracota + Cúpula Marfim + Grande
      {
        id: "var_saturno_terracota_grande",
        sku: "MKH-SAT-TER-MAR-LRG",
        priceCents: 24900,
        compareAtPriceCents: 27900,
        weightGrams: 650,
        packageHeightCm: 38,
        packageWidthCm: 38,
        packageDepthCm: 38,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_terracota", "val_saturno_cupula_marfim", "val_tam_grande"],
      },
      // 11. Base Terracota + Cúpula Terracota + Grande
      {
        id: "var_saturno_terracota_terracota_grande",
        sku: "MKH-SAT-TER-TER-LRG",
        priceCents: 24900,
        compareAtPriceCents: null,
        weightGrams: 650,
        packageHeightCm: 38,
        packageWidthCm: 38,
        packageDepthCm: 38,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_terracota", "val_saturno_cupula_terracota", "val_tam_grande"],
      },
      // 12. Base Terracota + Cúpula Preto + Grande
      {
        id: "var_saturno_terracota_preto_grande",
        sku: "MKH-SAT-TER-BLK-LRG",
        priceCents: 24900,
        compareAtPriceCents: null,
        weightGrams: 650,
        packageHeightCm: 38,
        packageWidthCm: 38,
        packageDepthCm: 38,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_terracota", "val_saturno_cupula_preto", "val_tam_grande"],
      },
      // 13. Base Marfim + Cúpula Marfim + Grande
      {
        id: "var_saturno_marfim_marfim_grande",
        sku: "MKH-SAT-MAR-MAR-LRG",
        priceCents: 24900,
        compareAtPriceCents: null,
        weightGrams: 650,
        packageHeightCm: 38,
        packageWidthCm: 38,
        packageDepthCm: 38,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_marfim", "val_saturno_cupula_marfim", "val_tam_grande"],
      },
      // 14. Base Marfim + Cúpula Terracota + Grande
      {
        id: "var_saturno_marfim_terracota_grande",
        sku: "MKH-SAT-MAR-TER-LRG",
        priceCents: 24900,
        compareAtPriceCents: null,
        weightGrams: 650,
        packageHeightCm: 38,
        packageWidthCm: 38,
        packageDepthCm: 38,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_marfim", "val_saturno_cupula_terracota", "val_tam_grande"],
      },
      // 15. Base Marfim + Cúpula Preto + Grande
      {
        id: "var_saturno_marfim_preto_grande",
        sku: "MKH-SAT-MAR-BLK-LRG",
        priceCents: 24900,
        compareAtPriceCents: null,
        weightGrams: 650,
        packageHeightCm: 38,
        packageWidthCm: 38,
        packageDepthCm: 38,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_marfim", "val_saturno_cupula_preto", "val_tam_grande"],
      },
      // 16. Base Preto + Cúpula Marfim + Grande
      {
        id: "var_saturno_preto_marfim_grande",
        sku: "MKH-SAT-BLK-MAR-LRG",
        priceCents: 24900,
        compareAtPriceCents: null,
        weightGrams: 650,
        packageHeightCm: 38,
        packageWidthCm: 38,
        packageDepthCm: 38,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_preto", "val_saturno_cupula_marfim", "val_tam_grande"],
      },
      // 17. Base Preto + Cúpula Terracota + Grande
      {
        id: "var_saturno_preto_terracota_grande",
        sku: "MKH-SAT-BLK-TER-LRG",
        priceCents: 24900,
        compareAtPriceCents: null,
        weightGrams: 650,
        packageHeightCm: 38,
        packageWidthCm: 38,
        packageDepthCm: 38,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_preto", "val_saturno_cupula_terracota", "val_tam_grande"],
      },
      // 18. Base Preto + Cúpula Preto + Grande
      {
        id: "var_saturno_preto_preto_grande",
        sku: "MKH-SAT-BLK-BLK-LRG",
        priceCents: 24900,
        compareAtPriceCents: null,
        weightGrams: 650,
        packageHeightCm: 38,
        packageWidthCm: 38,
        packageDepthCm: 38,
        active: true,
        selectedOptionValueIds: ["val_saturno_base_preto", "val_saturno_cupula_preto", "val_tam_grande"],
      },
    ],
  },
  {
    id: "prod_pendente_origami",
    name: "Pendente Geométrico Origami",
    slug: "pendente-geometrico-origami",
    description:
      "Inspirado nas dobras da arte milenar do papel japonês, o Pendente Origami transforma uma cúpula de polímero em um jogo hipnotizante de planos, sombras e luzes. Acompanha canopla para teto no mesmo material e cabo com revestimento em tecido premium.",
    categorySlug: "pendentes",
    collectionSlugs: ["lancamentos"],
    material: "PETG",
    isSustainable: true,
    productionDays: 3,
    dimensions: "26 × 24 × 24 cm",
    weightGrams: 380,
    socketType: "E27",
    maxWattage: 15,
    bulbIncluded: false,
    cordLengthCm: 200,
    tags: ["Lançamento"],
    images: [
      {
        id: "img_origami_1",
        url: "/products/pendente-origami-off.svg",
        alt: "Pendente Origami desligado acabamento off-white",
        isPrimary: true,
        isHover: false,
      },
      {
        id: "img_origami_2",
        url: "/products/pendente-origami-on.svg",
        alt: "Pendente Origami aceso com luz focal dourada",
        isPrimary: false,
        isHover: true,
      },
    ],
    options: [
      {
        id: "opt_origami_cor",
        name: "Cor",
        values: [
          { id: "val_ori_branco", name: "Branco Neve", colorHex: "#FFFFFF" },
          { id: "val_ori_areia", name: "Areia Duna", colorHex: "#E0D9CE" },
        ],
      },
    ],
    variants: [
      {
        id: "var_origami_branco",
        sku: "MKH-ORI-WHT",
        priceCents: 15900,
        compareAtPriceCents: 18900,
        weightGrams: 380,
        packageHeightCm: 28,
        packageWidthCm: 28,
        packageDepthCm: 28,
        active: true,
        selectedOptionValueIds: ["val_ori_branco"],
      },
      {
        id: "var_origami_areia",
        sku: "MKH-ORI-SND",
        priceCents: 15900,
        compareAtPriceCents: null,
        weightGrams: 380,
        packageHeightCm: 28,
        packageWidthCm: 28,
        packageDepthCm: 28,
        active: true,
        selectedOptionValueIds: ["val_ori_areia"],
      },
    ],
  },
  {
    id: "prod_vaso_hera",
    name: "Vaso Facetado Hera",
    slug: "vaso-facetado-hera",
    description:
      "Linhas retas e ângulos calculados que capturam a luz de diferentes maneiras ao longo do dia. O Vaso Hera é uma peça escultural que funciona tanto como vaso para arranjos secos quanto como objeto de centro de mesa independente.",
    categorySlug: "vasos",
    collectionSlugs: ["mais-vendidos"],
    material: "PLA",
    isSustainable: true,
    productionDays: 3,
    dimensions: "28 × 16 × 16 cm",
    weightGrams: 310,
    waterproof: false,
    tags: ["Mais Vendido"],
    images: [
      {
        id: "img_hera_1",
        url: "/products/vaso-facetado-hera-1.svg",
        alt: "Vaso Facetado Hera isolado em Terracota",
        isPrimary: true,
        isHover: false,
      },
      {
        id: "img_hera_2",
        url: "/products/vaso-facetado-hera-2.svg",
        alt: "Vaso Facetado Hera ambientado com ramos de eucalipto",
        isPrimary: false,
        isHover: true,
      },
    ],
    options: [
      {
        id: "opt_hera_cor",
        name: "Cor",
        values: [
          { id: "val_hera_terra", name: "Terracota Mate", colorHex: "#D96E43" },
          { id: "val_hera_marfim", name: "Branco Pérola", colorHex: "#F5F2EB" },
          { id: "val_hera_verde", name: "Verde Sálvia", colorHex: "#7A9E87" },
        ],
      },
    ],
    variants: [
      {
        id: "var_hera_terra",
        sku: "MKH-HERA-TER",
        priceCents: 9800,
        compareAtPriceCents: null,
        weightGrams: 310,
        packageHeightCm: 32,
        packageWidthCm: 20,
        packageDepthCm: 20,
        active: true,
        selectedOptionValueIds: ["val_hera_terra"],
      },
      {
        id: "var_hera_marfim",
        sku: "MKH-HERA-MRF",
        priceCents: 9800,
        compareAtPriceCents: null,
        weightGrams: 310,
        packageHeightCm: 32,
        packageWidthCm: 20,
        packageDepthCm: 20,
        active: true,
        selectedOptionValueIds: ["val_hera_marfim"],
      },
    ],
  },
  {
    id: "prod_cachepo_torus",
    name: "Cachepô Orgânico Torus",
    slug: "cachepo-organico-torus",
    description:
      "Quatro anéis concêntricos que criam um ritmo visual fluido e acolhedor. O Cachepô Torus foi desenhado para envolver vasos de plantas e suculentas, trazendo a natureza para perto com um toque de design contemporâneo brasileiro.",
    categorySlug: "cachepos",
    collectionSlugs: ["mais-vendidos", "kits"],
    material: "PLA",
    isSustainable: true,
    productionDays: 3,
    dimensions: "18 × 20 × 20 cm",
    weightGrams: 280,
    waterproof: true,
    tags: ["Destaque"],
    images: [
      {
        id: "img_torus_1",
        url: "/products/cachepo-torus-1.svg",
        alt: "Cachepô Torus em Verde Botânico",
        isPrimary: true,
        isHover: false,
      },
      {
        id: "img_torus_2",
        url: "/products/cachepo-torus-2.svg",
        alt: "Cachepô Torus com suculenta verde viva",
        isPrimary: false,
        isHover: true,
      },
    ],
    options: [
      {
        id: "opt_torus_cor",
        name: "Cor",
        values: [
          { id: "val_torus_verde", name: "Verde Botânico", colorHex: "#3B7357" },
          { id: "val_torus_areia", name: "Areia", colorHex: "#DDD4C5" },
        ],
      },
    ],
    variants: [
      {
        id: "var_torus_verde",
        sku: "MKH-TOR-GRN",
        priceCents: 8900,
        compareAtPriceCents: 10900,
        weightGrams: 280,
        packageHeightCm: 22,
        packageWidthCm: 24,
        packageDepthCm: 24,
        active: true,
        selectedOptionValueIds: ["val_torus_verde"],
      },
      {
        id: "var_torus_areia",
        sku: "MKH-TOR-SND",
        priceCents: 8900,
        compareAtPriceCents: null,
        weightGrams: 280,
        packageHeightCm: 22,
        packageWidthCm: 24,
        packageDepthCm: 24,
        active: true,
        selectedOptionValueIds: ["val_torus_areia"],
      },
    ],
  },
  {
    id: "prod_coluna_duna",
    name: "Luminária Coluna Duna",
    slug: "luminaria-coluna-duna",
    description:
      "A suavidade das dunas brasileiras impressa em uma coluna helicoidal translúcida. Ao ser acesa, a luz revela as micro-ranhuras horizontais que formam desenhos fluidos de gradiente luminoso na parede e no ambiente.",
    categorySlug: "luminarias-de-mesa",
    collectionSlugs: ["lancamentos"],
    material: "PETG",
    isSustainable: true,
    productionDays: 3,
    dimensions: "36 × 16 × 16 cm",
    weightGrams: 510,
    socketType: "E27",
    maxWattage: 12,
    bulbIncluded: true,
    cordLengthCm: 180,
    tags: ["Lançamento"],
    images: [
      {
        id: "img_duna_1",
        url: "/products/luminaria-coluna-duna-off.svg",
        alt: "Luminária Coluna Duna desligada",
        isPrimary: true,
        isHover: false,
      },
      {
        id: "img_duna_2",
        url: "/products/luminaria-coluna-duna-on.svg",
        alt: "Luminária Coluna Duna acesa com luz calorosa",
        isPrimary: false,
        isHover: true,
      },
    ],
    options: [
      {
        id: "opt_duna_cor",
        name: "Cor",
        values: [
          { id: "val_duna_areia", name: "Areia Duna", colorHex: "#E8DEC8" },
          { id: "val_duna_ambar", name: "Âmbar Translúcido", colorHex: "#FFBE6B" },
        ],
      },
    ],
    variants: [
      {
        id: "var_duna_areia",
        sku: "MKH-DUN-SND",
        priceCents: 21900,
        compareAtPriceCents: 24900,
        weightGrams: 510,
        packageHeightCm: 40,
        packageWidthCm: 20,
        packageDepthCm: 20,
        active: true,
        selectedOptionValueIds: ["val_duna_areia"],
      },
    ],
  },
  {
    id: "prod_organizador_wave",
    name: "Organizador de Mesa Wave",
    slug: "organizador-de-mesa-wave",
    description:
      "O equilíbrio ideal entre função e escultura para sua estação de trabalho ou penteadeira. Suas curvas em desnível servem como porta-canetas, suporte para smartphone, óculos e pequenos pertences do dia a dia.",
    categorySlug: "organizadores",
    collectionSlugs: ["mais-vendidos"],
    material: "PLA",
    isSustainable: true,
    productionDays: 3,
    dimensions: "8 × 26 × 14 cm",
    weightGrams: 220,
    tags: ["Prático"],
    images: [
      {
        id: "img_wave_1",
        url: "/products/organizador-wave-1.svg",
        alt: "Organizador Wave em Azul Cobalto",
        isPrimary: true,
        isHover: false,
      },
      {
        id: "img_wave_2",
        url: "/products/organizador-wave-2.svg",
        alt: "Organizador Wave ambientado na mesa de trabalho",
        isPrimary: false,
        isHover: true,
      },
    ],
    options: [
      {
        id: "opt_wave_cor",
        name: "Cor",
        values: [
          { id: "val_wave_azul", name: "Azul Cobalto", colorHex: "#24A7D4" },
          { id: "val_wave_grafite", name: "Grafite", colorHex: "#333333" },
          { id: "val_wave_marfim", name: "Marfim", colorHex: "#FAF8F5" },
        ],
      },
    ],
    variants: [
      {
        id: "var_wave_azul",
        sku: "MKH-WAV-BLU",
        priceCents: 7900,
        compareAtPriceCents: null,
        weightGrams: 220,
        packageHeightCm: 12,
        packageWidthCm: 30,
        packageDepthCm: 18,
        active: true,
        selectedOptionValueIds: ["val_wave_azul"],
      },
      {
        id: "var_wave_grafite",
        sku: "MKH-WAV-GRA",
        priceCents: 7900,
        compareAtPriceCents: null,
        weightGrams: 220,
        packageHeightCm: 12,
        packageWidthCm: 30,
        packageDepthCm: 18,
        active: true,
        selectedOptionValueIds: ["val_wave_grafite"],
      },
    ],
  },
  {
    id: "prod_plantario_oasis",
    name: "Plantário Suspenso Oasis",
    slug: "plantario-suspenso-oasis",
    description:
      "Uma moldura circular tridimensional que emoldura suas folhagens como uma obra de arte viva. Possui reservatório oculto que retém o excesso de água sem gotejamento, ideal para paredes e suportes internos.",
    categorySlug: "plantarios",
    collectionSlugs: ["lancamentos"],
    material: "PETG",
    isSustainable: true,
    productionDays: 3,
    dimensions: "26 × 26 × 12 cm",
    weightGrams: 340,
    waterproof: true,
    tags: ["Lançamento", "Botânico"],
    images: [
      {
        id: "img_oasis_1",
        url: "/products/plantario-oasis-1.svg",
        alt: "Plantário Suspenso Oasis isolado",
        isPrimary: true,
        isHover: false,
      },
      {
        id: "img_oasis_2",
        url: "/products/plantario-oasis-2.svg",
        alt: "Plantário Suspenso Oasis ambientado com jiboia",
        isPrimary: false,
        isHover: true,
      },
    ],
    options: [
      {
        id: "opt_oasis_cor",
        name: "Cor do Aro",
        values: [
          { id: "val_oasis_terra", name: "Terracota", colorHex: "#C9754C" },
          { id: "val_oasis_preto", name: "Preto", colorHex: "#1A1A1A" },
        ],
      },
    ],
    variants: [
      {
        id: "var_oasis_terra",
        sku: "MKH-OAS-TER",
        priceCents: 11900,
        compareAtPriceCents: 13900,
        weightGrams: 340,
        packageHeightCm: 30,
        packageWidthCm: 30,
        packageDepthCm: 16,
        active: true,
        selectedOptionValueIds: ["val_oasis_terra"],
      },
    ],
  },
];
