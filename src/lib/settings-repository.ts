import { cache } from "react";
import { db } from "@/lib/db";
import { isDatabaseConfigured, assertDevFallbackAllowed } from "@/lib/runtime";

export interface StoreSettingsData {
  storeName: string;
  whatsappNumber: string;
  instagramHandle: string;
  originPostalCode: string;
  pixDiscountPercent: number;
  maxInstallmentsFree: number;
  freeShippingThresholdCents: number;
  defaultProductionDays: number;
}

export const DEFAULT_STORE_SETTINGS: StoreSettingsData = {
  storeName: "Markah Brasil",
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999").replace(/\D/g, ""),
  instagramHandle: (process.env.NEXT_PUBLIC_INSTAGRAM_USER || "markah_br").replace(/^@/, ""),
  originPostalCode: "01001000",
  pixDiscountPercent: 5,
  maxInstallmentsFree: 3,
  freeShippingThresholdCents: 20000,
  defaultProductionDays: 3,
};

let memoryStoreSettings: StoreSettingsData = { ...DEFAULT_STORE_SETTINGS };

/**
 * Obtém as configurações da loja do banco de dados (Neon / Prisma)
 * com fallback para memória e valores padrão.
 * Utiliza o cache por requisição do React para evitar múltiplas consultas no mesmo render.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettingsData> => {
  try {
    if (isDatabaseConfigured()) {
      const record = await db.storeSettings.findUnique({
        where: { id: "default" },
      });

      if (record) {
        const data: StoreSettingsData = {
          storeName: record.storeName || DEFAULT_STORE_SETTINGS.storeName,
          whatsappNumber: (record.whatsappNumber || DEFAULT_STORE_SETTINGS.whatsappNumber).replace(/\D/g, ""),
          instagramHandle: (record.instagramHandle || DEFAULT_STORE_SETTINGS.instagramHandle).replace(/^@/, ""),
          originPostalCode: (record.originPostalCode || DEFAULT_STORE_SETTINGS.originPostalCode).replace(/\D/g, ""),
          pixDiscountPercent: Number(record.pixDiscountPercent) || DEFAULT_STORE_SETTINGS.pixDiscountPercent,
          maxInstallmentsFree: Number(record.maxInstallmentsFree) || DEFAULT_STORE_SETTINGS.maxInstallmentsFree,
          freeShippingThresholdCents: Number(record.freeShippingThresholdCents) || DEFAULT_STORE_SETTINGS.freeShippingThresholdCents,
          defaultProductionDays: Number(record.defaultProductionDays) || DEFAULT_STORE_SETTINGS.defaultProductionDays,
        };
        memoryStoreSettings = { ...data };
        return data;
      }
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
  }

  return memoryStoreSettings;
});

/**
 * Persiste as configurações da loja no banco de dados e sincroniza com a memória.
 */
export async function saveStoreSettingsToDb(payload: StoreSettingsData): Promise<StoreSettingsData> {
  const sanitized: StoreSettingsData = {
    storeName: payload.storeName.trim() || DEFAULT_STORE_SETTINGS.storeName,
    whatsappNumber: payload.whatsappNumber.replace(/\D/g, "") || DEFAULT_STORE_SETTINGS.whatsappNumber,
    instagramHandle: payload.instagramHandle.replace(/^@/, "").trim() || DEFAULT_STORE_SETTINGS.instagramHandle,
    originPostalCode: payload.originPostalCode.replace(/\D/g, "") || DEFAULT_STORE_SETTINGS.originPostalCode,
    pixDiscountPercent: Math.max(0, Math.min(50, Number(payload.pixDiscountPercent) || 0)),
    maxInstallmentsFree: Math.max(1, Math.min(12, Number(payload.maxInstallmentsFree) || 1)),
    freeShippingThresholdCents: Math.max(0, Number(payload.freeShippingThresholdCents) || 0),
    defaultProductionDays: Math.max(1, Math.min(30, Number(payload.defaultProductionDays) || 3)),
  };

  memoryStoreSettings = { ...sanitized };

  try {
    if (isDatabaseConfigured()) {
      await db.storeSettings.upsert({
        where: { id: "default" },
        update: sanitized,
        create: { id: "default", ...sanitized },
      });
    }
  } catch (err) {
    assertDevFallbackAllowed(err);
  }

  return sanitized;
}
