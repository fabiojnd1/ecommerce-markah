/**
 * =====================================================================
 * ECOMMERCE MARKAH — REGRAS DE PREÇO (src/lib/pricing.ts)
 * =====================================================================
 * Regras fundamentais (CLAUDE.md §4, D-011, P-001, P-002):
 * 1. Todos os valores monetários são inteiros em centavos (Int).
 * 2. O servidor é a única fonte de verdade de preço.
 * 3. Formatação monetária ocorre estritamente na camada de exibição.
 * 4. Desconto Pix e parcelamento são calculados com centavos inteiros.
 */

export interface PricingInput {
  priceCents: number;
  compareAtPriceCents?: number | null;
  pixDiscountPercent?: number; // Padrão: 5%
  maxInstallments?: number; // Padrão: 3x
}

export interface PricingSummary {
  priceCents: number;
  compareAtPriceCents: number | null;
  hasDiscount: boolean;
  discountPercentage: number;
  pixPriceCents: number;
  pixDiscountPercent: number;
  installments: {
    count: number;
    installmentPriceCents: number;
    isInterestFree: boolean;
    formatted: string;
  };
  formatted: {
    price: string;
    compareAtPrice: string | null;
    pixPrice: string;
    installments: string;
  };
}

/**
 * Formata um valor inteiro em centavos para a representação em Real (BRL).
 * Exemplo: 12900 -> "R$ 129,00"
 */
export function formatCents(cents: number): string {
  if (isNaN(cents) || cents < 0) {
    cents = 0;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Calcula o preço à vista no Pix com percentual de desconto.
 * O arredondamento é feito sempre para o centavo inteiro mais próximo (Math.round).
 */
export function calculatePixPrice(
  priceCents: number,
  discountPercent = 5
): number {
  if (priceCents <= 0) return 0;
  if (discountPercent <= 0) return priceCents;
  const factor = (100 - discountPercent) / 100;
  return Math.round(priceCents * factor);
}

/**
 * Calcula o valor de cada parcela sem juros.
 */
export function calculateInstallmentPrice(
  priceCents: number,
  installments = 3
): number {
  if (priceCents <= 0 || installments <= 1) return priceCents;
  return Math.floor(priceCents / installments);
}

/**
 * Calcula o percentual de desconto entre o preço original (compareAt) e o preço atual.
 */
export function calculateDiscountPercentage(
  priceCents: number,
  compareAtPriceCents?: number | null
): number {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) {
    return 0;
  }
  const diff = compareAtPriceCents - priceCents;
  return Math.round((diff / compareAtPriceCents) * 100);
}

/**
 * Gera o resumo completo de preços para exibição em cards e páginas de produto.
 */
export function getProductPricing({
  priceCents,
  compareAtPriceCents = null,
  pixDiscountPercent = 5,
  maxInstallments = 3,
}: PricingInput): PricingSummary {
  const safePrice = Math.max(0, Math.round(priceCents));
  const safeCompareAt =
    compareAtPriceCents && compareAtPriceCents > safePrice
      ? Math.round(compareAtPriceCents)
      : null;

  const discountPercentage = calculateDiscountPercentage(
    safePrice,
    safeCompareAt
  );
  const pixPriceCents = calculatePixPrice(safePrice, pixDiscountPercent);
  const installmentPriceCents = calculateInstallmentPrice(
    safePrice,
    maxInstallments
  );

  return {
    priceCents: safePrice,
    compareAtPriceCents: safeCompareAt,
    hasDiscount: discountPercentage > 0,
    discountPercentage,
    pixPriceCents,
    pixDiscountPercent,
    installments: {
      count: maxInstallments,
      installmentPriceCents,
      isInterestFree: true,
      formatted: `${maxInstallments}x de ${formatCents(installmentPriceCents)} sem juros`,
    },
    formatted: {
      price: formatCents(safePrice),
      compareAtPrice: safeCompareAt ? formatCents(safeCompareAt) : null,
      pixPrice: formatCents(pixPriceCents),
      installments: `ou até ${maxInstallments}x de ${formatCents(installmentPriceCents)} sem juros`,
    },
  };
}

// =====================================================================
// REGRAS DE CÁLCULO DO CARRINHO E FRETE GRÁTIS (FASE 3)
// =====================================================================

export type CouponDiscountType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

export interface AppliedCoupon {
  code: string;
  type: CouponDiscountType;
  value: number; // Porcentagem (ex: 10 para 10%) ou centavos (ex: 2000 para R$ 20,00)
  minOrderCents?: number;
  description?: string;
}

export interface CartItemPriceInput {
  priceCents: number;
  quantity: number;
}

export interface CartCalculationInput {
  items: CartItemPriceInput[];
  shippingPriceCents?: number;
  /**
   * Preço da opção de frete mais barata disponível (PRD §5.2: o frete grátis vale
   * para a opção mais barata). Se o cliente escolher uma opção mais cara, paga a diferença.
   * Quando omitido, considera-se que a opção escolhida é a mais barata.
   */
  cheapestShippingPriceCents?: number;
  pixDiscountPercent?: number; // Padrão PRD §5.1: 5%
  freeShippingThresholdCents?: number; // Padrão PRD §5.2: 20000 (R$ 200,00)
  maxInstallments?: number; // Padrão: 3x
  coupon?: AppliedCoupon | null;
}

export interface CartCalculationSummary {
  subtotalCents: number;
  couponCode: string | null;
  couponDiscountCents: number;
  discountedSubtotalCents: number;
  isFreeShippingQualified: boolean;
  freeShippingThresholdCents: number;
  remainingForFreeShippingCents: number;
  freeShippingProgressPercent: number;
  shippingPriceCents: number;
  effectiveShippingPriceCents: number;
  totalCents: number;
  pixDiscountPercent: number;
  pixDiscountAmountCents: number;
  pixTotalCents: number;
  installments: {
    count: number;
    installmentPriceCents: number;
    formatted: string;
  };
  formatted: {
    subtotal: string;
    couponDiscount: string | null;
    discountedSubtotal: string;
    shipping: string;
    total: string;
    pixDiscount: string;
    pixTotal: string;
    remainingForFreeShipping: string;
    installments: string;
  };
}

/**
 * Calcula os totais consolidados do carrinho no servidor (P-001).
 * Regra PRD §5.1:
 * - Ordem de aplicação: preço produtos -> cupom -> desconto Pix.
 * - Desconto Pix aplica-se EXCLUSIVAMENTE sobre o valor líquido dos produtos, nunca sobre o frete.
 * Regra PRD §5.2:
 * - Frete grátis ativa-se quando subtotal líquido dos produtos >= freeShippingThresholdCents
 *   ou quando o cupom for do tipo FREE_SHIPPING.
 */
export function calculateCartTotals({
  items,
  shippingPriceCents = 0,
  cheapestShippingPriceCents,
  pixDiscountPercent = 5,
  freeShippingThresholdCents = 20000, // R$ 200,00 em centavos
  maxInstallments = 3,
  coupon = null,
}: CartCalculationInput): CartCalculationSummary {
  // 1. Subtotal bruto dos produtos (somatório em centavos)
  const subtotalCents = items.reduce(
    (acc, item) =>
      acc + Math.max(0, Math.round(item.priceCents)) * Math.max(0, item.quantity),
    0
  );

  // 2. Aplicação de cupom de desconto (PRD §5.1)
  let couponDiscountCents = 0;
  let isFreeShippingFromCoupon = false;

  if (coupon && subtotalCents > 0) {
    const meetsMinOrder = !coupon.minOrderCents || subtotalCents >= coupon.minOrderCents;

    if (meetsMinOrder) {
      if (coupon.type === "PERCENTAGE") {
        const percent = Math.min(100, Math.max(0, coupon.value));
        couponDiscountCents = Math.round(subtotalCents * (percent / 100));
      } else if (coupon.type === "FIXED") {
        couponDiscountCents = Math.min(subtotalCents, Math.max(0, Math.round(coupon.value)));
      } else if (coupon.type === "FREE_SHIPPING") {
        isFreeShippingFromCoupon = true;
      }
    }
  }

  // Subtotal líquido de produtos após cupom
  const discountedSubtotalCents = Math.max(0, subtotalCents - couponDiscountCents);

  // 3. Qualificação para Frete Grátis (≥ R$ 200,00 líquido de produtos ou por cupom)
  const isFreeShippingQualified =
    isFreeShippingFromCoupon || discountedSubtotalCents >= freeShippingThresholdCents;

  const remainingForFreeShippingCents = isFreeShippingFromCoupon
    ? 0
    : Math.max(0, freeShippingThresholdCents - discountedSubtotalCents);

  const freeShippingProgressPercent = isFreeShippingFromCoupon
    ? 100
    : Math.min(
        100,
        freeShippingThresholdCents > 0
          ? Math.round((discountedSubtotalCents / freeShippingThresholdCents) * 100)
          : 100
      );

  // 4. Frete Efetivo (se qualificado, a opção de frete é zerada)
  const safeShippingPrice = Math.max(0, Math.round(shippingPriceCents));
  const safeCheapest = Math.max(
    0,
    Math.round(cheapestShippingPriceCents ?? safeShippingPrice)
  );
  const effectiveShippingPriceCents = isFreeShippingQualified
    ? Math.max(0, safeShippingPrice - safeCheapest)
    : safeShippingPrice;

  // 5. Total Geral no Cartão
  const totalCents = discountedSubtotalCents + effectiveShippingPriceCents;

  // 6. Desconto no Pix (apenas sobre produtos com desconto: PRD §5.1)
  const pixDiscountFactor = pixDiscountPercent / 100;
  const pixDiscountAmountCents = Math.round(discountedSubtotalCents * pixDiscountFactor);
  const pixTotalCents =
    discountedSubtotalCents - pixDiscountAmountCents + effectiveShippingPriceCents;

  // 7. Parcelamento no Cartão
  const installmentPriceCents = calculateInstallmentPrice(
    totalCents,
    maxInstallments
  );

  return {
    subtotalCents,
    couponCode: coupon?.code || null,
    couponDiscountCents,
    discountedSubtotalCents,
    isFreeShippingQualified,
    freeShippingThresholdCents,
    remainingForFreeShippingCents,
    freeShippingProgressPercent,
    shippingPriceCents: safeShippingPrice,
    effectiveShippingPriceCents,
    totalCents,
    pixDiscountPercent,
    pixDiscountAmountCents,
    pixTotalCents,
    installments: {
      count: maxInstallments,
      installmentPriceCents,
      formatted: `${maxInstallments}x de ${formatCents(installmentPriceCents)} sem juros`,
    },
    formatted: {
      subtotal: formatCents(subtotalCents),
      couponDiscount:
        couponDiscountCents > 0 ? `-${formatCents(couponDiscountCents)}` : null,
      discountedSubtotal: formatCents(discountedSubtotalCents),
      shipping:
        effectiveShippingPriceCents === 0
          ? "Grátis"
          : formatCents(effectiveShippingPriceCents),
      total: formatCents(totalCents),
      pixDiscount: formatCents(pixDiscountAmountCents),
      pixTotal: formatCents(pixTotalCents),
      remainingForFreeShipping: formatCents(remainingForFreeShippingCents),
      installments: `ou até ${maxInstallments}x de ${formatCents(installmentPriceCents)} sem juros`,
    },
  };
}
