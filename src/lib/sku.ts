/**
 * =====================================================================
 * ECOMMERCE MARKAH — GERADOR DE SKU INTELIGENTE (src/lib/sku.ts)
 * =====================================================================
 * Gera SKUs legíveis, padronizados e distintos para cada modelo e variação.
 * Formato padrão: MKH-[CATEGORIA]-[MODELO]-[VARIAÇÕES]
 * Exemplo: MKH-LM-CHAPE-TER-BRA
 */

const CATEGORY_CODES: Record<string, string> = {
  "luminarias-de-mesa": "LM",
  pendentes: "PD",
  vasos: "VS",
  cachepos: "CP",
  plantarios: "PL",
  organizadores: "OG",
};

const STOP_WORDS = new Set([
  "luminaria",
  "luminarias",
  "de",
  "da",
  "do",
  "dos",
  "das",
  "para",
  "e",
  "mesa",
  "coluna",
  "teto",
  "pendente",
  "pendentes",
  "vaso",
  "vasos",
  "cachepo",
  "cachepos",
  "plantario",
  "plantarios",
  "organizador",
  "organizadores",
]);

/**
 * Remove acentos e caracteres especiais, mantendo apenas letras e números em maiúsculas.
 */
function cleanString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

/**
 * Extrai o identificador distintivo da peça a partir do slug.
 * Ex: 'luminaria-de-mesa-chape' -> 'CHAPE'
 * Ex: 'luminaria-coluna-duna'   -> 'DUNA'
 * Ex: 'vaso-facetado-hera'      -> 'HERA'
 */
export function extractModelCode(slug: string): string {
  const parts = slug.toLowerCase().split(/[-_]+/);
  const meaningful = parts.filter((p) => !STOP_WORDS.has(p) && p.length > 0);

  if (meaningful.length > 0) {
    const raw = meaningful.join("-");
    const cleaned = cleanString(raw);
    return cleaned.slice(0, 8);
  }

  const fallback = cleanString(slug);
  return fallback.slice(0, 8) || "MOD";
}

/**
 * Gera um SKU estruturado e profissional para a variante do produto.
 */
export function generateVariantSku(params: {
  productSlug: string;
  categorySlug?: string;
  optionValueNames?: string[];
  suffixIndex?: number;
}): string {
  const { productSlug, categorySlug, optionValueNames = [], suffixIndex } = params;

  const catCode = categorySlug ? CATEGORY_CODES[categorySlug] || cleanString(categorySlug).slice(0, 3) : "MKH";
  const modelCode = extractModelCode(productSlug);

  const optCodes = optionValueNames
    .map((name) => {
      const cleaned = cleanString(name);
      return cleaned.slice(0, 3);
    })
    .filter(Boolean);

  const parts = ["MKH", catCode, modelCode];

  if (optCodes.length > 0) {
    parts.push(...optCodes);
  } else if (suffixIndex !== undefined) {
    parts.push(String(suffixIndex + 1).padStart(2, "0"));
  }

  return parts.join("-");
}
