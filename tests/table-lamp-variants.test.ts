import { describe, it, expect, vi } from "vitest";
import { SEED_PRODUCTS } from "@/lib/data/catalog-seed";
import {
  formatVariantDisplayName,
  getVariantColors,
  getProductBySlug,
} from "@/lib/catalog";
import {
  toggleVariantActiveAction,
  saveProductAction,
} from "@/server/admin-actions";
import * as auth from "@/lib/auth";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Luminárias de Mesa — Seleção Independente de Base e Cúpula", () => {
  const saturno = SEED_PRODUCTS.find((p) => p.slug === "luminaria-de-mesa-saturno");

  it("deve conter opções separadas de 'Cor da Base', 'Cor da Cúpula' e 'Tamanho' na Saturno", () => {
    expect(saturno).toBeDefined();
    expect(saturno?.options.length).toBe(3);

    const baseOpt = saturno?.options.find((o) => o.name === "Cor da Base");
    const cupulaOpt = saturno?.options.find((o) => o.name === "Cor da Cúpula");
    const tamanhoOpt = saturno?.options.find((o) => o.name === "Tamanho");

    expect(baseOpt).toBeDefined();
    expect(cupulaOpt).toBeDefined();
    expect(tamanhoOpt).toBeDefined();

    // 3 cores de base: Terracota, Branco Marfim e Preto Fosco
    expect(baseOpt?.values.map((v) => v.name)).toEqual([
      "Terracota",
      "Branco Marfim",
      "Preto Fosco",
    ]);

    // 3 cores de cúpula: Branco Marfim, Terracota e Preto Fosco
    expect(cupulaOpt?.values.map((v) => v.name)).toEqual([
      "Branco Marfim",
      "Terracota",
      "Preto Fosco",
    ]);

    // 2 tamanhos
    expect(tamanhoOpt?.values.map((v) => v.name)).toEqual([
      "Padrão (Ø 28cm)",
      "Grande (Ø 35cm)",
    ]);
  });

  it("deve disponibilizar as 18 variantes vendáveis ativas na Saturno (3 bases × 3 cúpulas × 2 tamanhos)", () => {
    expect(saturno?.variants.length).toBe(18);

    const padraoVariants = saturno?.variants.filter((v) =>
      v.selectedOptionValueIds.includes("val_tam_padrao")
    );
    const grandeVariants = saturno?.variants.filter((v) =>
      v.selectedOptionValueIds.includes("val_tam_grande")
    );

    expect(padraoVariants?.length).toBe(9);
    expect(grandeVariants?.length).toBe(9);

    // Preços consistentes
    padraoVariants?.forEach((v) => {
      expect(v.priceCents).toBe(18900);
      expect(v.weightGrams).toBe(420);
    });

    grandeVariants?.forEach((v) => {
      expect(v.priceCents).toBe(24900);
      expect(v.weightGrams).toBe(650);
    });
  });

  it("deve formatar o nome legível da variante com Base, Cúpula e Tamanho", () => {
    const variant1 = saturno!.variants[0];
    const name1 = formatVariantDisplayName(saturno!, variant1);
    expect(name1).toBe(
      "Base: Terracota / Cúpula: Branco Marfim · Padrão (Ø 28cm)"
    );

    const colors1 = getVariantColors(saturno!, variant1);
    expect(colors1.length).toBe(2);
    expect(colors1[0].name).toBe("Terracota");
    expect(colors1[0].hex).toBe("#D97A53");
    expect(colors1[1].name).toBe("Branco Marfim");
    expect(colors1[1].hex).toBe("#FAF8F5");
  });

  it("não deve alterar o seletor simples de cor da Luminária Coluna Duna nem de outros produtos", async () => {
    const duna = await getProductBySlug("luminaria-coluna-duna");
    expect(duna).toBeDefined();
    expect(duna?.options.length).toBe(1);
    expect(duna?.options[0].name).toBe("Cor");
    expect(duna?.options[0].values.length).toBe(2);

    const origami = await getProductBySlug("pendente-geometrico-origami");
    expect(origami?.options.length).toBe(1);
    expect(origami?.options[0].name).toBe("Cor");

    const hera = await getProductBySlug("vaso-facetado-hera");
    expect(hera?.options.length).toBe(1);
    expect(hera?.options[0].name).toBe("Cor");
  }, 15000);

  it("deve permitir que o admin alterne a disponibilidade de uma variante ativa/pausada", async () => {
    vi.spyOn(auth, "requireAdmin").mockResolvedValue({
      id: "admin_test",
      name: "Admin",
      email: "admin@markah.com.br",
      role: "ADMIN",
    });

    const targetVariantId = "var_saturno_terracota_terracota_padrao";
    const resDeactivate = await toggleVariantActiveAction(
      saturno!.id,
      targetVariantId,
      false
    );
    expect(resDeactivate.success).toBe(true);
    expect(resDeactivate.active).toBe(false);

    const variantAfter = saturno!.variants.find((v) => v.id === targetVariantId);
    expect(variantAfter?.active).toBe(false);

    // Reativa
    const resReactivate = await toggleVariantActiveAction(
      saturno!.id,
      targetVariantId,
      true
    );
    expect(resReactivate.success).toBe(true);
    expect(resReactivate.active).toBe(true);
    expect(variantAfter?.active).toBe(true);
  });

  it("deve preservar as opções e variantes da Saturno ao salvar pelo painel administrativo", async () => {
    vi.spyOn(auth, "requireAdmin").mockResolvedValue({
      id: "admin_test",
      name: "Admin",
      email: "admin@markah.com.br",
      role: "ADMIN",
    });

    const res = await saveProductAction({
      id: saturno!.id,
      name: saturno!.name,
      slug: saturno!.slug,
      description: saturno!.description,
      categorySlug: saturno!.categorySlug,
      material: saturno!.material,
      isSustainable: saturno!.isSustainable,
      productionDays: saturno!.productionDays,
      dimensions: saturno!.dimensions,
      weightGrams: saturno!.weightGrams,
      priceCents: 18900,
      packageHeightCm: 30,
      packageWidthCm: 30,
      packageDepthCm: 30,
      options: saturno!.options,
      variants: saturno!.variants,
    });

    expect(res.success).toBe(true);
    expect(res.product?.options.length).toBe(3);
    expect(res.product?.variants.length).toBe(18);
  }, 15000);

  it("deve criar uma nova luminária de mesa com opções independentes de Base e Cúpula e variantes combinatórias", async () => {
    vi.spyOn(auth, "requireAdmin").mockResolvedValue({
      id: "admin_test",
      name: "Admin",
      email: "admin@markah.com.br",
      role: "ADMIN",
    });

    const newLampSlug = "luminaria-aurora-teste";
    const res = await saveProductAction({
      name: "Luminária Aurora Teste",
      slug: newLampSlug,
      description: "Nova luminária bicolor para teste",
      categorySlug: "luminarias-de-mesa",
      material: "PLA",
      isSustainable: true,
      productionDays: 3,
      dimensions: "22 × 18 × 18 cm",
      weightGrams: 390,
      priceCents: 16900,
      packageHeightCm: 25,
      packageWidthCm: 25,
      packageDepthCm: 25,
      options: [
        {
          id: "opt_aurora_base",
          name: "Cor da Base",
          values: [
            { id: "val_aurora_b1", name: "Terracota", colorHex: "#D97A53" },
            { id: "val_aurora_b2", name: "Branco Marfim", colorHex: "#FAF8F5" },
          ],
        },
        {
          id: "opt_aurora_cupula",
          name: "Cor da Cúpula",
          values: [
            { id: "val_aurora_c1", name: "Branco Marfim", colorHex: "#FAF8F5" },
            { id: "val_aurora_c2", name: "Preto Fosco", colorHex: "#222222" },
          ],
        },
      ],
      variants: [
        {
          id: "var_aurora_b1_c1",
          sku: "MKH-AURORA-TER-MAR",
          priceCents: 16900,
          weightGrams: 390,
          packageHeightCm: 25,
          packageWidthCm: 25,
          packageDepthCm: 25,
          active: true,
          selectedOptionValueIds: ["val_aurora_b1", "val_aurora_c1"],
        },
        {
          id: "var_aurora_b1_c2",
          sku: "MKH-AURORA-TER-BLK",
          priceCents: 16900,
          weightGrams: 390,
          packageHeightCm: 25,
          packageWidthCm: 25,
          packageDepthCm: 25,
          active: true,
          selectedOptionValueIds: ["val_aurora_b1", "val_aurora_c2"],
        },
        {
          id: "var_aurora_b2_c1",
          sku: "MKH-AURORA-MAR-MAR",
          priceCents: 16900,
          weightGrams: 390,
          packageHeightCm: 25,
          packageWidthCm: 25,
          packageDepthCm: 25,
          active: true,
          selectedOptionValueIds: ["val_aurora_b2", "val_aurora_c1"],
        },
        {
          id: "var_aurora_b2_c2",
          sku: "MKH-AURORA-MAR-BLK",
          priceCents: 16900,
          weightGrams: 390,
          packageHeightCm: 25,
          packageWidthCm: 25,
          packageDepthCm: 25,
          active: true,
          selectedOptionValueIds: ["val_aurora_b2", "val_aurora_c2"],
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.product).toBeDefined();

    const created = res.product!;
    expect(created.options.length).toBe(2);

    const baseOpt = created.options.find((o) => o.name === "Cor da Base");
    const cupulaOpt = created.options.find((o) => o.name === "Cor da Cúpula");
    expect(baseOpt?.values.length).toBe(2);
    expect(cupulaOpt?.values.length).toBe(2);

    // 4 variantes combinatórias (2 bases × 2 cúpulas)
    expect(created.variants.length).toBe(4);

    // O nome da variante deve ser legível com Base e Cúpula
    const formattedName = formatVariantDisplayName(created, created.variants[0]);
    expect(formattedName).toBe("Base: Terracota / Cúpula: Branco Marfim");

    const colors = getVariantColors(created, created.variants[0]);
    expect(colors.length).toBe(2);
    expect(colors[0].name).toBe("Terracota");
    expect(colors[1].name).toBe("Branco Marfim");

    // Produto deve estar acessível por getProductBySlug
    const loaded = await getProductBySlug(newLampSlug);
    expect(loaded).toBeDefined();
    expect(loaded?.options.length).toBe(2);
    expect(loaded?.variants.length).toBe(4);
  }, 15000);

  it("deve criar um produto em outra categoria com opção simples 'Cor' e variante única", async () => {
    vi.spyOn(auth, "requireAdmin").mockResolvedValue({
      id: "admin_test",
      name: "Admin",
      email: "admin@markah.com.br",
      role: "ADMIN",
    });

    const newVaseSlug = "vaso-zenith-teste";
    const res = await saveProductAction({
      name: "Vaso Zenith Teste",
      slug: newVaseSlug,
      description: "Vaso decorativo em outra categoria",
      categorySlug: "vasos",
      material: "PLA",
      isSustainable: true,
      productionDays: 3,
      dimensions: "18 × 15 × 15 cm",
      weightGrams: 280,
      priceCents: 8900,
      packageHeightCm: 20,
      packageWidthCm: 20,
      packageDepthCm: 20,
      colorName: "Verde Sálvia",
      colorHex: "#7A9E87",
      options: [
        {
          id: "opt_zenith_cor",
          name: "Cor",
          values: [
            { id: "val_zenith_verde", name: "Verde Sálvia", colorHex: "#7A9E87" },
          ],
        },
      ],
      variants: [
        {
          id: "var_zenith_verde",
          sku: "MKH-ZEN-VRD",
          priceCents: 8900,
          weightGrams: 280,
          packageHeightCm: 20,
          packageWidthCm: 20,
          packageDepthCm: 20,
          active: true,
          selectedOptionValueIds: ["val_zenith_verde"],
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.product).toBeDefined();

    const created = res.product!;
    expect(created.options.length).toBe(1);
    expect(created.options[0].name).toBe("Cor");
    expect(created.options[0].values[0].name).toBe("Verde Sálvia");
    expect(created.variants.length).toBe(1);
    expect(created.variants[0].selectedOptionValueIds).toEqual(["val_zenith_verde"]);

    const formattedName = formatVariantDisplayName(created, created.variants[0]);
    expect(formattedName).toBe("Verde Sálvia");
  }, 15000);

  it("deve preservar as opções e variantes existentes ao editar a Luminária Coluna Duna", async () => {
    vi.spyOn(auth, "requireAdmin").mockResolvedValue({
      id: "admin_test",
      name: "Admin",
      email: "admin@markah.com.br",
      role: "ADMIN",
    });

    const dunaOriginal = SEED_PRODUCTS.find((p) => p.slug === "luminaria-coluna-duna");
    expect(dunaOriginal).toBeDefined();
    expect(dunaOriginal?.options.length).toBe(1);

    // Salva alterando apenas a descrição e preço, sem perder opções
    const res = await saveProductAction({
      id: dunaOriginal!.id,
      name: dunaOriginal!.name,
      slug: dunaOriginal!.slug,
      description: "Descrição atualizada da Duna mantendo opções",
      categorySlug: dunaOriginal!.categorySlug,
      material: dunaOriginal!.material,
      isSustainable: dunaOriginal!.isSustainable,
      productionDays: dunaOriginal!.productionDays,
      dimensions: dunaOriginal!.dimensions,
      weightGrams: dunaOriginal!.weightGrams,
      priceCents: 22900,
      packageHeightCm: 40,
      packageWidthCm: 20,
      packageDepthCm: 20,
      options: dunaOriginal!.options,
      variants: dunaOriginal!.variants,
    });

    expect(res.success).toBe(true);
    expect(res.product?.options.length).toBe(1);
    expect(res.product?.options[0].name).toBe("Cor");
    expect(res.product?.variants.length).toBe(1);
    expect(res.product?.variants[0].selectedOptionValueIds).toEqual(["val_duna_areia"]);
  }, 15000);
});
