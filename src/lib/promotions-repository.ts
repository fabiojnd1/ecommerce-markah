import { isDatabaseConfigured, assertDevFallbackAllowed } from "@/lib/runtime";
import { type CouponDiscountType } from "@prisma/client";
import { db } from "./db";

export interface CouponRecord {
  id: string;
  code: string;
  type: CouponDiscountType;
  value: number; // Centavos para FIXED, 1-100 para PERCENTAGE, 0 para FREE_SHIPPING
  description?: string | null;
  minOrderCents?: number | null;
  maxDiscountCents?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  startDate?: Date | null;
  endDate?: Date | null;
  isPixCumulative: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveCouponInput {
  id?: string;
  code: string;
  type: CouponDiscountType;
  value: number;
  description?: string | null;
  minOrderCents?: number | null;
  maxDiscountCents?: number | null;
  usageLimit?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  isPixCumulative?: boolean;
  active?: boolean;
}

// Repositório em memória para desenvolvimento e testes (resiliente sem Neon)
const inMemoryCoupons = new Map<string, CouponRecord>();

function ensureSeedCoupons(): void {
  if (inMemoryCoupons.size > 0) return;

  const defaultCoupons: CouponRecord[] = [
    {
      id: "coup_bemvindo10",
      code: "BEMVINDO10",
      type: "PERCENTAGE",
      value: 10,
      description: "10% de desconto de boas-vindas em qualquer peça",
      minOrderCents: null,
      maxDiscountCents: 5000,
      usageLimit: null,
      usageCount: 14,
      isPixCumulative: true,
      active: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      updatedAt: new Date(),
    },
    {
      id: "coup_markah20",
      code: "MARKAH20",
      type: "FIXED",
      value: 2000, // R$ 20,00
      description: "R$ 20,00 OFF em compras acima de R$ 150,00",
      minOrderCents: 15000,
      maxDiscountCents: null,
      usageLimit: 200,
      usageCount: 38,
      isPixCumulative: true,
      active: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
      updatedAt: new Date(),
    },
    {
      id: "coup_fretegratis",
      code: "FRETEGRATIS",
      type: "FREE_SHIPPING",
      value: 0,
      description: "Frete cortesia para pedidos acima de R$ 100,00",
      minOrderCents: 10000,
      maxDiscountCents: null,
      usageLimit: null,
      usageCount: 22,
      isPixCumulative: true,
      active: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
      updatedAt: new Date(),
    },
    {
      id: "coup_primeiracompra",
      code: "PRIMEIRACOMPRA",
      type: "PERCENTAGE",
      value: 10,
      description: "10% de desconto na primeira compra Markah",
      minOrderCents: null,
      maxDiscountCents: null,
      usageLimit: null,
      usageCount: 45,
      isPixCumulative: true,
      active: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      updatedAt: new Date(),
    },
  ];

  for (const c of defaultCoupons) {
    inMemoryCoupons.set(c.id, c);
  }
}

/**
 * Lista todos os cupons cadastrados.
 */
export async function listAllCoupons(): Promise<CouponRecord[]> {
  try {
    if (isDatabaseConfigured()) {
      const coupons = await db.coupon.findMany({
        orderBy: { createdAt: "desc" },
      });
      return coupons;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedCoupons();
  const list = Array.from(inMemoryCoupons.values());
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

/**
 * Busca cupom pelo código (insensível a maiúsculas/minúsculas).
 */
export async function findCouponByCode(code: string): Promise<CouponRecord | null> {
  const cleanCode = code?.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    if (isDatabaseConfigured()) {
      const coupon = await db.coupon.findUnique({
        where: { code: cleanCode },
      });
      if (coupon) return coupon;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedCoupons();
  for (const c of inMemoryCoupons.values()) {
    if (c.code === cleanCode) {
      return c;
    }
  }

  return null;
}

/**
 * Salva ou cria um cupom no sistema.
 */
export async function saveCoupon(data: SaveCouponInput): Promise<CouponRecord> {
  const code = data.code.trim().toUpperCase();
  const id = data.id || `coup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  try {
    if (isDatabaseConfigured()) {
      const upserted = await db.coupon.upsert({
        where: { code },
        create: {
          id,
          code,
          type: data.type,
          value: data.value,
          description: data.description || null,
          minOrderCents: data.minOrderCents || null,
          maxDiscountCents: data.maxDiscountCents || null,
          usageLimit: data.usageLimit || null,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          isPixCumulative: data.isPixCumulative !== undefined ? data.isPixCumulative : true,
          active: data.active !== undefined ? data.active : true,
        },
        update: {
          type: data.type,
          value: data.value,
          description: data.description || null,
          minOrderCents: data.minOrderCents || null,
          maxDiscountCents: data.maxDiscountCents || null,
          usageLimit: data.usageLimit || null,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          isPixCumulative: data.isPixCumulative !== undefined ? data.isPixCumulative : true,
          active: data.active !== undefined ? data.active : true,
        },
      });

      inMemoryCoupons.set(upserted.id, upserted);
      return upserted;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedCoupons();
  // Se editando por ID
  let existingId = data.id;
  if (!existingId) {
    for (const [key, val] of inMemoryCoupons.entries()) {
      if (val.code === code) {
        existingId = key;
        break;
      }
    }
  }

  const targetId = existingId || id;
  const existing = inMemoryCoupons.get(targetId);

  const savedRecord: CouponRecord = {
    id: targetId,
    code,
    type: data.type,
    value: data.value,
    description: data.description || null,
    minOrderCents: data.minOrderCents || null,
    maxDiscountCents: data.maxDiscountCents || null,
    usageLimit: data.usageLimit || null,
    usageCount: existing ? existing.usageCount : 0,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    isPixCumulative: data.isPixCumulative !== undefined ? data.isPixCumulative : true,
    active: data.active !== undefined ? data.active : true,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };

  inMemoryCoupons.set(targetId, savedRecord);
  return savedRecord;
}

/**
 * Remove um cupom pelo ID.
 */
export async function deleteCoupon(id: string): Promise<boolean> {
  try {
    if (isDatabaseConfigured()) {
      await db.coupon.delete({ where: { id } });
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedCoupons();
  return inMemoryCoupons.delete(id);
}

/**
 * Ativa ou pausa um cupom de desconto.
 */
export async function toggleCouponStatus(
  id: string,
  active: boolean
): Promise<CouponRecord | null> {
  try {
    if (isDatabaseConfigured()) {
      const updated = await db.coupon.update({
        where: { id },
        data: { active },
      });
      inMemoryCoupons.set(id, updated);
      return updated;
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedCoupons();
  const existing = inMemoryCoupons.get(id);
  if (!existing) return null;

  const updated: CouponRecord = {
    ...existing,
    active,
    updatedAt: new Date(),
  };
  inMemoryCoupons.set(id, updated);
  return updated;
}

/**
 * Incrementa o número de utilizações do cupom após um pedido confirmado.
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  const cleanCode = code?.trim().toUpperCase();
  if (!cleanCode) return;

  try {
    if (isDatabaseConfigured()) {
      await db.coupon.update({
        where: { code: cleanCode },
        data: { usageCount: { increment: 1 } },
      });
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
    // Fallback (somente em desenvolvimento)
  }

  ensureSeedCoupons();
  for (const [id, coupon] of inMemoryCoupons.entries()) {
    if (coupon.code === cleanCode) {
      inMemoryCoupons.set(id, {
        ...coupon,
        usageCount: coupon.usageCount + 1,
        updatedAt: new Date(),
      });
      break;
    }
  }
}

/**
 * Validação abrangente de elegibilidade do cupom no carrinho e checkout.
 */
export async function validateCouponEligibility(
  code: string,
  subtotalCents: number
): Promise<{
  isValid: boolean;
  coupon?: CouponRecord;
  error?: string;
}> {
  const cleanCode = code?.trim().toUpperCase();
  if (!cleanCode) {
    return { isValid: false, error: "Informe o código do cupom." };
  }

  const coupon = await findCouponByCode(cleanCode);
  if (!coupon) {
    return { isValid: false, error: "Cupom não encontrado ou expirado." };
  }

  if (!coupon.active) {
    return { isValid: false, error: "Este cupom não está mais ativo." };
  }

  const now = new Date();
  if (coupon.startDate && now < new Date(coupon.startDate)) {
    return {
      isValid: false,
      error: `Este cupom é válido a partir de ${new Date(coupon.startDate).toLocaleDateString("pt-BR")}.`,
    };
  }

  if (coupon.endDate && now > new Date(coupon.endDate)) {
    return {
      isValid: false,
      error: `Este cupom expirou em ${new Date(coupon.endDate).toLocaleDateString("pt-BR")}.`,
    };
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return {
      isValid: false,
      error: "O limite máximo de utilizações deste cupom foi atingido.",
    };
  }

  if (coupon.minOrderCents && subtotalCents < coupon.minOrderCents) {
    const minBrl = (coupon.minOrderCents / 100).toFixed(2).replace(".", ",");
    return {
      isValid: false,
      error: `Este cupom é válido apenas para compras a partir de R$ ${minBrl}.`,
    };
  }

  return { isValid: true, coupon };
}
