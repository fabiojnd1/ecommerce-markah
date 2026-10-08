import { describe, it, expect, vi } from "vitest";
import { saveProductAction, deleteProductAction } from "@/server/admin-actions";
import { generateVariantSku } from "@/lib/sku";
import * as auth from "@/lib/auth";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Geração Inteligente de SKU e Prevenção de Conflitos", () => {
  it("deve gerar SKUs legíveis e distintos para diferentes modelos na mesma categoria", () => {
    const skuChape = generateVariantSku({
      productSlug: "luminaria-de-mesa-chape",
      categorySlug: "luminarias-de-mesa",
      optionValueNames: ["Terracota", "Branco Marfim"],
    });

    const skuGocu = generateVariantSku({
      productSlug: "luminaria-de-mesa-gocu",
      categorySlug: "luminarias-de-mesa",
      optionValueNames: ["Terracota", "Branco Marfim"],
    });

    expect(skuChape).toBe("MKH-LM-CHAPE-TER-BRA");
    expect(skuGocu).toBe("MKH-LM-GOCU-TER-BRA");
    expect(skuChape).not.toBe(skuGocu);
  });

  it("deve salvar a Luminária de Mesa Chape sem erro de SKU duplicado", async () => {
    vi.spyOn(auth, "requireAdmin").mockResolvedValue({
      id: "admin_test",
      name: "Admin",
      email: "admin@markah.com.br",
      role: "ADMIN",
    });

    const res = await saveProductAction({
      name: "Luminaria de Mesa Chape",
      slug: "luminaria-de-mesa-chape",
      description: "Linda luminária Chape",
      categorySlug: "luminarias-de-mesa",
      material: "PLA",
      isSustainable: true,
      productionDays: 3,
      dimensions: "24 × 20 × 20 cm",
      weightGrams: 380,
      socketType: "E27",
      maxWattage: 15,
      bulbIncluded: false,
      cordLengthCm: 150,
      waterproof: false,
      priceCents: 14900,
      compareAtPriceCents: 18900,
      packageHeightCm: 25,
      packageWidthCm: 25,
      packageDepthCm: 25,
      images: [
        { url: "/brand/markah-simbolo.png", isPrimary: true, isHover: false, alt: "Foto 1" },
        { url: "/brand/markah-simbolo.png", isPrimary: false, isHover: true, alt: "Foto 2" },
      ],
      baseColors: [
        { name: "Terracota", colorHex: "#D97A53" },
        { name: "Branco Marfim", colorHex: "#FAF8F5" },
        { name: "Preto Fosco", colorHex: "#222222" },
      ],
      cupulaColors: [
        { name: "Branco Marfim", colorHex: "#FAF8F5" },
        { name: "Terracota", colorHex: "#D97A53" },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.product).toBeDefined();
    expect(res.product?.variants.length).toBe(6);

    // Confirma que os SKUs contêm o modelo CHAPE e não colidem
    const skus = res.product?.variants.map((v) => v.sku) || [];
    expect(skus).toContain("MKH-LM-CHAPE-TER-BRA");
    expect(new Set(skus).size).toBe(6);

    // Limpa a peça de teste após o sucesso
    if (res.product?.id) {
      await deleteProductAction(res.product.id);
    }
  }, 25000);
});
