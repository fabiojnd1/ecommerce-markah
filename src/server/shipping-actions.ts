"use server";

import {
  calculateShippingQuotes,
  type ShippingItemInput,
  type ShippingQuote,
} from "@/lib/shipping/melhor-envio";
import { getStoreSettings } from "@/lib/settings-repository";

export interface ShippingActionResult {
  success: boolean;
  quotes?: ShippingQuote[];
  error?: string;
}

export async function getShippingQuotesAction(
  destinationPostalCode: string,
  items: ShippingItemInput[]
): Promise<ShippingActionResult> {
  try {
    const cleanCep = destinationPostalCode.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      return {
        success: false,
        error: "CEP inválido. O CEP deve conter 8 dígitos.",
      };
    }

    if (!items || items.length === 0) {
      return {
        success: false,
        error: "Carrinho vazio para cálculo de frete.",
      };
    }

    const settings = await getStoreSettings();

    const quotes = await calculateShippingQuotes({
      destinationPostalCode: cleanCep,
      items,
      originPostalCode: settings.originPostalCode,
      freeShippingThresholdCents: settings.freeShippingThresholdCents,
      productionDays: settings.defaultProductionDays,
    });

    return {
      success: true,
      quotes,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Erro inesperado ao calcular o frete.";
    return {
      success: false,
      error: msg,
    };
  }
}
