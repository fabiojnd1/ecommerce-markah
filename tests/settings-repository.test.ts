import { describe, it, expect } from "vitest";
import { getStoreSettings, saveStoreSettingsToDb } from "@/lib/settings-repository";

describe("Settings Repository & Store Configurations", () => {
  it("deve carregar configurações válidas do repositório", async () => {
    const settings = await getStoreSettings();
    expect(settings).toBeDefined();
    expect(settings.storeName).toBe("Markah Brasil");
    expect(settings.whatsappNumber).toBe("5511984949585");
    expect(settings.originPostalCode).toBe("13212880");
    expect(settings.pixDiscountPercent).toBe(5);
    expect(settings.maxInstallmentsFree).toBe(3);
    expect(settings.freeShippingThresholdCents).toBe(20000);
  });
});
