"use server";

import {
  calculateCartTotals,
  type AppliedCoupon,
  type CartItemPriceInput,
  type CartCalculationSummary,
} from "@/lib/pricing";
import {
  validateCouponEligibility,
  findCouponByCode,
} from "@/lib/promotions-repository";

export interface ValidateCouponResult {
  success: boolean;
  coupon?: AppliedCoupon;
  error?: string;
}

export interface ServerCartSummaryResult {
  success: boolean;
  totals?: CartCalculationSummary;
  error?: string;
}

/**
 * Valida um cupom no servidor e verifica requisitos como vigência e pedido mínimo (Fase 6).
 */
export async function validateCouponAction(
  rawCode: string,
  subtotalCents: number
): Promise<ValidateCouponResult> {
  const code = (rawCode || "").trim().toUpperCase();

  if (!code) {
    return { success: false, error: "Digite um código de cupom." };
  }

  const result = await validateCouponEligibility(code, subtotalCents);
  if (!result.isValid || !result.coupon) {
    return {
      success: false,
      error: result.error || `Cupom "${code}" inválido ou expirado.`,
    };
  }

  const appliedCoupon: AppliedCoupon = {
    code: result.coupon.code,
    type: result.coupon.type,
    value: result.coupon.value,
    minOrderCents: result.coupon.minOrderCents || undefined,
    description: result.coupon.description || undefined,
  };

  return {
    success: true,
    coupon: appliedCoupon,
  };
}

/**
 * Recalcula os totais consolidados do carrinho exclusivamente no servidor (P-001).
 */
export async function calculateServerCartTotalsAction(
  items: CartItemPriceInput[],
  shippingPriceCents = 0,
  couponCode?: string | null
): Promise<ServerCartSummaryResult> {
  try {
    let appliedCoupon: AppliedCoupon | null = null;
    if (couponCode) {
      const normalized = couponCode.trim().toUpperCase();
      const found = await findCouponByCode(normalized);
      if (found && found.active) {
        appliedCoupon = {
          code: found.code,
          type: found.type,
          value: found.value,
          minOrderCents: found.minOrderCents || undefined,
          description: found.description || undefined,
        };
      }
    }

    const totals = calculateCartTotals({
      items,
      shippingPriceCents,
      coupon: appliedCoupon,
    });

    return {
      success: true,
      totals,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Erro ao recalcular totais no servidor.";
    return {
      success: false,
      error: msg,
    };
  }
}
