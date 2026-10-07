"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  listAllCoupons,
  saveCoupon,
  deleteCoupon,
  toggleCouponStatus,
  type SaveCouponInput,
  type CouponRecord,
} from "@/lib/promotions-repository";

/**
 * Server Action: Lista todos os cupons no painel administrativo.
 * Regra P-007: Exige requireAdmin().
 */
export async function getAdminCouponsAction(): Promise<{
  success: boolean;
  coupons?: CouponRecord[];
  error?: string;
}> {
  await requireAdmin();

  try {
    const coupons = await listAllCoupons();
    return { success: true, coupons };
  } catch {
    return { success: false, error: "Erro ao buscar cupons." };
  }
}

/**
 * Server Action: Salva ou cria um cupom de desconto.
 * Regra P-007: Exige requireAdmin().
 */
export async function saveCouponAction(data: SaveCouponInput): Promise<{
  success: boolean;
  coupon?: CouponRecord;
  error?: string;
}> {
  await requireAdmin();

  const code = (data.code || "").trim().toUpperCase();
  if (!code || code.length < 3) {
    return { success: false, error: "Código do cupom deve ter pelo menos 3 caracteres." };
  }

  if (data.type === "PERCENTAGE" && (data.value < 1 || data.value > 100)) {
    return { success: false, error: "Desconto percentual deve estar entre 1% e 100%." };
  }

  if (data.type === "FIXED" && data.value <= 0) {
    return { success: false, error: "Valor de desconto fixo deve ser maior que zero." };
  }

  try {
    const saved = await saveCoupon({
      ...data,
      code,
    });

    revalidatePath("/admin/promocoes");
    revalidatePath("/carrinho");
    revalidatePath("/checkout");

    return { success: true, coupon: saved };
  } catch {
    return { success: false, error: "Erro ao salvar cupom." };
  }
}

/**
 * Server Action: Ativa ou desativa um cupom de desconto.
 * Regra P-007: Exige requireAdmin().
 */
export async function toggleCouponAction(
  id: string,
  active: boolean
): Promise<{
  success: boolean;
  coupon?: CouponRecord | null;
  error?: string;
}> {
  await requireAdmin();

  try {
    const updated = await toggleCouponStatus(id, active);
    revalidatePath("/admin/promocoes");
    return { success: true, coupon: updated };
  } catch {
    return { success: false, error: "Erro ao alterar status do cupom." };
  }
}

/**
 * Server Action: Exclui um cupom de desconto.
 * Regra P-007: Exige requireAdmin().
 */
export async function deleteCouponAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireAdmin();

  try {
    await deleteCoupon(id);
    revalidatePath("/admin/promocoes");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao excluir cupom." };
  }
}
