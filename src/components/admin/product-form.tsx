"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveProductAction, toggleVariantActiveAction } from "@/server/admin-actions";
import { formatVariantDisplayName } from "@/lib/catalog";
import { formatCents } from "@/lib/pricing";
import type { SeedProduct, SeedCategory, SeedVariant, SeedOption } from "@/lib/data/catalog-seed";
import { ProductPhotosManager, type ProductPhotoItem } from "./product-photos-manager";

interface ProductFormProps {
  initialProduct?: SeedProduct | null;
  categories: SeedCategory[];
}

interface ColorItem {
  id: string;
  name: string;
  colorHex: string;
}

export function ProductForm({ initialProduct, categories }: ProductFormProps) {
  const router = useRouter();

  const isEditing = Boolean(initialProduct);

  const defaultVariant = initialProduct?.variants[0];
  const initialBaseOpt = initialProduct?.options?.find((o) =>
    o.name.toLowerCase().includes("base")
  );
  const initialCupulaOpt = initialProduct?.options?.find(
    (o) =>
      o.name.toLowerCase().includes("cúpula") ||
      o.name.toLowerCase().includes("cupula")
  );
  const initialColorOpt = initialProduct?.options?.find((o) =>
    o.name.toLowerCase().includes("cor")
  );
  const primaryColor = initialColorOpt?.values[0];
  const hasBaseAndCupula = Boolean(initialBaseOpt && initialCupulaOpt);

  const [variantsList, setVariantsList] = useState<SeedVariant[]>(
    initialProduct?.variants || []
  );

  async function handleToggleVariant(variantId: string, currentActive: boolean) {
    if (!initialProduct) return;
    const newActive = !currentActive;
    setVariantsList((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, active: newActive } : v))
    );
    await toggleVariantActiveAction(initialProduct.id, variantId, newActive);
  }

  // Estados do formulário
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [description, setDescription] = useState(
    initialProduct?.description || ""
  );
  const [categorySlug, setCategorySlug] = useState(
    initialProduct?.categorySlug || categories[0]?.slug || "luminarias-de-mesa"
  );
  const [material, setMaterial] = useState<"PLA" | "PETG">(
    initialProduct?.material || "PLA"
  );
  const [isSustainable, setIsSustainable] = useState(
    initialProduct?.isSustainable ?? true
  );
  const [productionDays, setProductionDays] = useState(
    initialProduct?.productionDays || 3
  );

  // Ficha técnica
  const [dimensions, setDimensions] = useState(
    initialProduct?.dimensions || "24 × 20 × 20 cm"
  );
  const [weightGrams, setWeightGrams] = useState(
    initialProduct?.weightGrams || 380
  );
  const [socketType, setSocketType] = useState(
    initialProduct?.socketType || "E27"
  );
  const [maxWattage, setMaxWattage] = useState(
    initialProduct?.maxWattage || 15
  );
  const [bulbIncluded, setBulbIncluded] = useState(
    initialProduct?.bulbIncluded || false
  );
  const [cordLengthCm, setCordLengthCm] = useState(
    initialProduct?.cordLengthCm || 150
  );
  const [waterproof, setWaterproof] = useState(
    initialProduct?.waterproof || false
  );

  // Preço e Frete
  const [priceReais, setPriceReais] = useState(
    defaultVariant ? (defaultVariant.priceCents / 100).toFixed(2) : "149.00"
  );
  const [compareAtReais, setCompareAtReais] = useState(
    defaultVariant?.compareAtPriceCents
      ? (defaultVariant.compareAtPriceCents / 100).toFixed(2)
      : ""
  );
  const [packageHeightCm, setPackageHeightCm] = useState(
    defaultVariant?.packageHeightCm || 25
  );
  const [packageWidthCm, setPackageWidthCm] = useState(
    defaultVariant?.packageWidthCm || 25
  );
  const [packageDepthCm, setPackageDepthCm] = useState(
    defaultVariant?.packageDepthCm || 25
  );

  // Cores da Base e da Cúpula (para categoria luminarias-de-mesa)
  const [baseColors, setBaseColors] = useState<ColorItem[]>(() => {
    if (initialBaseOpt && initialBaseOpt.values.length > 0) {
      return initialBaseOpt.values.map((v) => ({
        id: v.id,
        name: v.name,
        colorHex: v.colorHex || "#D97A53",
      }));
    }
    return [
      { id: "base_1", name: "Terracota", colorHex: "#D97A53" },
      { id: "base_2", name: "Branco Marfim", colorHex: "#FAF8F5" },
      { id: "base_3", name: "Preto Fosco", colorHex: "#222222" },
    ];
  });

  const [cupulaColors, setCupulaColors] = useState<ColorItem[]>(() => {
    if (initialCupulaOpt && initialCupulaOpt.values.length > 0) {
      return initialCupulaOpt.values.map((v) => ({
        id: v.id,
        name: v.name,
        colorHex: v.colorHex || "#FAF8F5",
      }));
    }
    return [
      { id: "cupula_1", name: "Branco Marfim", colorHex: "#FAF8F5" },
      { id: "cupula_2", name: "Terracota", colorHex: "#D97A53" },
      { id: "cupula_3", name: "Preto Fosco", colorHex: "#222222" },
    ];
  });

  // Cor única (para categorias que não são luminarias-de-mesa, ou produtos legados de cor única)
  const [colorName, setColorName] = useState(primaryColor?.name || "Terracota");
  const [colorHex, setColorHex] = useState(primaryColor?.colorHex || "#D97A53");

  // Regra de exibição baseada na categoria estável (slug)
  const isTableLamp = categorySlug === "luminarias-de-mesa";
  const showBaseAndCupula = isTableLamp && (!isEditing || hasBaseAndCupula);

  function handleAddBaseColor() {
    setBaseColors((prev) => [
      ...prev,
      {
        id: `base_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        colorHex: "#FAF8F5",
      },
    ]);
  }

  function handleUpdateBaseColor(
    index: number,
    field: "name" | "colorHex",
    value: string
  ) {
    setBaseColors((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  }

  function handleRemoveBaseColor(index: number) {
    if (baseColors.length <= 1) return;
    setBaseColors((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleAddCupulaColor() {
    setCupulaColors((prev) => [
      ...prev,
      {
        id: `cupula_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        colorHex: "#D97A53",
      },
    ]);
  }

  function handleUpdateCupulaColor(
    index: number,
    field: "name" | "colorHex",
    value: string
  ) {
    setCupulaColors((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  }

  function handleRemoveCupulaColor(index: number) {
    if (cupulaColors.length <= 1) return;
    setCupulaColors((prev) => prev.filter((_, idx) => idx !== index));
  }

  // Fotos do Produto
  const [photos, setPhotos] = useState<ProductPhotoItem[]>(() => {
    if (initialProduct?.images && initialProduct.images.length > 0) {
      return initialProduct.images.map((img, idx) => ({
        id: img.id || `photo_init_${idx}`,
        url: img.url,
        name: img.url.split("/").pop() || `Foto ${idx + 1}`,
        alt: img.alt || "",
        displayOrder: img.displayOrder !== undefined ? img.displayOrder : idx,
        isPrimary: Boolean(img.isPrimary),
        isHover: Boolean(img.isHover),
        status: "success",
        progress: 100,
      }));
    }
    return [];
  });
  const [deletedBlobUrls, setDeletedBlobUrls] = useState<string[]>([]);

  function handleRemovePhoto(id: string, url: string) {
    if (url && (url.includes("blob.vercel-storage.com") || url.startsWith("https://"))) {
      setDeletedBlobUrls((prev) => [...prev, url]);
    }
    setPhotos((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      const hasPrimary = remaining.some((p) => p.isPrimary);
      if (!hasPrimary && remaining.length > 0) {
        return remaining.map((p, idx) => (idx === 0 ? { ...p, isPrimary: true } : p));
      }
      return remaining;
    });
  }

  const hasUploadingPhotos = photos.some((p) => p.status === "uploading");
  const hasErrorPhotos = photos.some((p) => p.status === "error");
  const isSaveBlocked = hasUploadingPhotos || hasErrorPhotos;

  // Status de Envio
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleNameChange(val: string) {
    setName(val);
    if (!isEditing || !slug) {
      setSlug(
        val
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (hasUploadingPhotos) {
      setError("Aguarde a conclusão do upload das fotos antes de salvar o produto.");
      return;
    }

    if (hasErrorPhotos) {
      setError("Existem fotos com falha de envio. Remova-as ou tente novamente antes de salvar.");
      return;
    }

    setLoading(true);

    try {
      const priceCents = Math.round(parseFloat(priceReais) * 100);
      const compareAtPriceCents = compareAtReais
        ? Math.round(parseFloat(compareAtReais) * 100)
        : null;

      const cleanSlug = slug.trim().toLowerCase();

      let optionsToSave: SeedOption[];
      let variantsToSave: SeedVariant[];

      if (showBaseAndCupula) {
        const validBase = baseColors.filter((b) => b.name.trim().length > 0);
        const validCupula = cupulaColors.filter((c) => c.name.trim().length > 0);

        if (validBase.length === 0 || validCupula.length === 0) {
          setError("Informe ao menos uma cor válida para a base e uma para a cúpula.");
          setLoading(false);
          return;
        }

        const baseOptId = initialBaseOpt?.id || `opt_${cleanSlug}_base`;
        const cupulaOptId = initialCupulaOpt?.id || `opt_${cleanSlug}_cupula`;

        const baseValues = validBase.map((b, idx) => ({
          id: b.id.startsWith("val_") ? b.id : `val_${cleanSlug}_base_${idx + 1}`,
          name: b.name.trim(),
          colorHex: b.colorHex || "#D97A53",
        }));

        const cupulaValues = validCupula.map((c, idx) => ({
          id: c.id.startsWith("val_") ? c.id : `val_${cleanSlug}_cupula_${idx + 1}`,
          name: c.name.trim(),
          colorHex: c.colorHex || "#FAF8F5",
        }));

        optionsToSave = [
          {
            id: baseOptId,
            name: "Cor da Base",
            values: baseValues,
          },
          {
            id: cupulaOptId,
            name: "Cor da Cúpula",
            values: cupulaValues,
          },
        ];

        // Se havia outras opções no produto existente (ex: Tamanho em Saturno), preserva
        if (initialProduct?.options) {
          const extraOptions = initialProduct.options.filter(
            (o) =>
              !o.name.toLowerCase().includes("base") &&
              !o.name.toLowerCase().includes("cúpula") &&
              !o.name.toLowerCase().includes("cupula") &&
              !o.name.toLowerCase().includes("cor")
          );
          optionsToSave.push(...extraOptions);
        }

        // Gera o produto cartesiano de todas as opções
        const optionArrays = optionsToSave.map((opt) => opt.values);
        const combos = optionArrays.reduce<Array<Array<{ id: string; name: string }>>>(
          (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
          [[]]
        );

        variantsToSave = combos.map((comboVals, idx) => {
          const comboIds = comboVals.map((v) => v.id);
          const existing = variantsList.find(
            (v) =>
              v.selectedOptionValueIds.length === comboIds.length &&
              comboIds.every((id) => v.selectedOptionValueIds.includes(id))
          );

          const skuSuffix = comboVals
            .map((v) =>
              v.name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9]/g, "")
                .slice(0, 3)
                .toUpperCase()
            )
            .join("-");

          const fallbackSku = `MKH-${cleanSlug.slice(0, 6).toUpperCase()}-${skuSuffix || idx + 1}`;
          const fallbackId = `var_${cleanSlug}_${comboVals.map((v) => v.id.replace(/^val_/, "")).join("_")}`;

          return {
            id: existing ? existing.id : fallbackId,
            sku: existing ? existing.sku : fallbackSku,
            priceCents: existing ? existing.priceCents : priceCents,
            compareAtPriceCents:
              existing !== undefined
                ? existing.compareAtPriceCents
                : compareAtPriceCents,
            weightGrams: existing ? existing.weightGrams : Number(weightGrams),
            packageHeightCm: existing
              ? existing.packageHeightCm
              : Number(packageHeightCm),
            packageWidthCm: existing
              ? existing.packageWidthCm
              : Number(packageWidthCm),
            packageDepthCm: existing
              ? existing.packageDepthCm
              : Number(packageDepthCm),
            active: existing ? existing.active : true,
            selectedOptionValueIds: comboIds,
          };
        });
      } else {
        const colorOptId = initialColorOpt?.id || `opt_${cleanSlug}_cor`;
        const valId = initialColorOpt?.values[0]?.id || `val_${cleanSlug}_c1`;
        const valName = colorName.trim() || "Padrão";

        optionsToSave = [
          {
            id: colorOptId,
            name: "Cor",
            values: [
              {
                id: valId,
                name: valName,
                colorHex: colorHex || "#D97A53",
              },
            ],
          },
        ];

        if (initialProduct?.options && initialProduct.options.length > 1) {
          const extra = initialProduct.options.filter(
            (o) => !o.name.toLowerCase().includes("cor")
          );
          optionsToSave.push(...extra);
        }

        const existing = variantsList[0] || initialProduct?.variants[0];
        variantsToSave = [
          {
            id: existing ? existing.id : `var_${cleanSlug}_main`,
            sku:
              existing?.sku ||
              `MKH-${cleanSlug.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            priceCents: existing ? existing.priceCents : priceCents,
            compareAtPriceCents:
              existing !== undefined
                ? existing.compareAtPriceCents
                : compareAtPriceCents,
            weightGrams: Number(weightGrams),
            packageHeightCm: Number(packageHeightCm),
            packageWidthCm: Number(packageWidthCm),
            packageDepthCm: Number(packageDepthCm),
            active: existing ? existing.active : true,
            selectedOptionValueIds: [valId],
          },
        ];
      }

      const res = await saveProductAction({
        id: initialProduct?.id,
        name,
        slug,
        description,
        categorySlug,
        material,
        isSustainable,
        productionDays: Number(productionDays),
        dimensions,
        weightGrams: Number(weightGrams),
        socketType: socketType || undefined,
        maxWattage: maxWattage ? Number(maxWattage) : undefined,
        bulbIncluded,
        cordLengthCm: cordLengthCm ? Number(cordLengthCm) : undefined,
        waterproof,
        priceCents,
        compareAtPriceCents,
        packageHeightCm: Number(packageHeightCm),
        packageWidthCm: Number(packageWidthCm),
        packageDepthCm: Number(packageDepthCm),
        colorName,
        colorHex,
        // Garante fotos válidas e exatamente uma foto principal
        images: (() => {
          const validPhotos = photos.filter(
            (p) => p.status === "success" || (!p.status && p.url)
          );
          const hasPrimary = validPhotos.some((p) => p.isPrimary);
          return validPhotos.map((p, idx) => ({
            id: p.id,
            url: p.url,
            alt: p.alt.trim(),
            displayOrder: idx,
            isPrimary: hasPrimary ? p.isPrimary : idx === 0,
            isHover: p.isHover,
          }));
        })(),
        deletedImageUrls: deletedBlobUrls,
        imageUrl:
          photos.find((p) => p.isPrimary)?.url ||
          photos.find((p) => p.status === "success" || (!p.status && p.url))?.url,
        hoverImageUrl: photos.find((p) => p.isHover)?.url,
        options: optionsToSave,
        variants: variantsToSave,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/produtos");
          router.refresh();
        }, 1000);
      } else {
        setError(res.error || "Erro ao salvar produto.");
      }
    } catch {
      setError("Erro inesperado no servidor ao salvar produto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Barra de Ações do Topo */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/produtos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para lista</span>
        </Link>

        <div className="flex items-center gap-3">
          {hasUploadingPhotos && (
            <span className="text-xs text-amarelo font-medium animate-pulse">
              Enviando fotos...
            </span>
          )}
          {hasErrorPhotos && (
            <span className="text-xs text-red-600 font-medium">
              Fotos com erro pendente
            </span>
          )}
          <Button
            type="submit"
            variant="primary"
            size="default"
            isLoading={loading}
            disabled={isSaveBlocked || loading}
            className="gap-2 text-xs font-semibold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? "Atualizar Produto" : "Criar Produto"}</span>
          </Button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Produto salvo com sucesso! Redirecionando...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Dados Principais */}
          <div className="bg-surface rounded-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-bold text-ink font-mono uppercase tracking-wider">
              Informações Gerais
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                Nome da Peça *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Luminária de Mesa Saturno"
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Slug da URL *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="luminaria-saturno"
                  className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm font-mono text-xs focus:outline-none focus:border-ink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Categoria *
                </label>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                Descrição do Produto
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a inspiração de design, o efeito da luz e as especificações..."
                className="w-full p-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink leading-relaxed"
              />
            </div>
          </div>

          {/* 2. Fotos do Produto */}
          <ProductPhotosManager
            photos={photos}
            onChange={setPhotos}
            onRemove={handleRemovePhoto}
          />

          {/* 3. Preço e Variação Base */}
          <div className="bg-surface rounded-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-bold text-ink font-mono uppercase tracking-wider">
              Preço e Variação Principal (D-011)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Preço de Venda (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceReais}
                  onChange={(e) => setPriceReais(e.target.value)}
                  placeholder="149.00"
                  className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink font-bold"
                />
                <span className="text-[11px] text-text-muted">
                  Convertido para centavos no servidor.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Preço Comparativo &quot;De&quot; (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={compareAtReais}
                  onChange={(e) => setCompareAtReais(e.target.value)}
                  placeholder="189.00"
                  className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
                />
                <span className="text-[11px] text-text-muted">
                  Exibe preço riscado na vitrine.
                </span>
              </div>
            </div>

            {/* Opções de Cor baseadas na categoria */}
            {showBaseAndCupula ? (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-surface-alt/70 rounded-lg border border-border text-xs text-text-muted">
                  💡 <strong>Configuração Bicolor:</strong> Esta luminária permite cadastrar cores independentes para a base e para a cúpula, gerando todas as combinações vendáveis automaticamente.
                </div>

                {/* Grade responsiva fluida dos painéis de Base e Cúpula (auto-fit baseado na largura real disponível) */}
                <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5 pt-1">
                  {/* Painel: Cores da Base */}
                  <div className="space-y-3 p-4 rounded-card border border-border bg-surface-alt/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                        Cores da Base ({baseColors.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddBaseColor}
                        aria-label="Adicionar nova cor da base"
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg text-xs font-semibold text-ink bg-surface border border-border hover:border-ink hover:text-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>Adicionar Cor</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {baseColors.map((bColor, idx) => (
                        <div
                          key={bColor.id || idx}
                          className="flex items-center gap-2 p-2 rounded-lg border border-border bg-surface shadow-xs transition-colors focus-within:border-ink"
                        >
                          {/* Controles de edição (swatch, nome e código hex) com quebra fluida em painel estreito */}
                          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                            {/* Swatch + Nome */}
                            <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                              <input
                                type="color"
                                value={bColor.colorHex}
                                onChange={(e) =>
                                  handleUpdateBaseColor(idx, "colorHex", e.target.value)
                                }
                                aria-label={`Amostra de cor da Base ${idx + 1}`}
                                title="Escolher cor visual"
                                className="w-10 h-10 rounded border border-border cursor-pointer p-0.5 shrink-0 bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
                              />
                              <input
                                type="text"
                                value={bColor.name}
                                onChange={(e) =>
                                  handleUpdateBaseColor(idx, "name", e.target.value)
                                }
                                placeholder={`Ex: Base ${idx + 1}`}
                                aria-label={`Nome da cor da Base ${idx + 1}`}
                                className="w-full min-w-0 h-10 px-3 rounded-input border border-border bg-surface text-xs focus:outline-none focus:border-ink font-medium"
                              />
                            </div>

                            {/* Código HEX */}
                            <div className="w-24 shrink-0 flex-1 sm:flex-initial min-w-[90px]">
                              <input
                                type="text"
                                value={bColor.colorHex}
                                onChange={(e) =>
                                  handleUpdateBaseColor(idx, "colorHex", e.target.value)
                                }
                                placeholder="#D97A53"
                                aria-label={`Código hexadecimal da Base ${idx + 1}`}
                                className="w-full h-10 px-2 rounded-input border border-border bg-surface text-[11px] font-mono focus:outline-none focus:border-ink text-center uppercase"
                              />
                            </div>
                          </div>

                          {/* Coluna fixa reservada para a lixeira: área de clique mínima de 44 × 44 px */}
                          <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                            {baseColors.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveBaseColor(idx)}
                                aria-label={`Remover cor da base: ${bColor.name || `Cor ${idx + 1}`}`}
                                title={`Remover cor da base: ${bColor.name || `Cor ${idx + 1}`}`}
                                className="w-11 h-11 rounded-lg flex items-center justify-center text-text-muted hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                aria-disabled="true"
                                aria-label="Não é possível remover a única cor da base"
                                title="O produto precisa de pelo menos uma cor da base"
                                className="w-11 h-11 rounded-lg flex items-center justify-center text-text-muted/30 cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Painel: Cores da Cúpula */}
                  <div className="space-y-3 p-4 rounded-card border border-border bg-surface-alt/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                        Cores da Cúpula ({cupulaColors.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddCupulaColor}
                        aria-label="Adicionar nova cor da cúpula"
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg text-xs font-semibold text-ink bg-surface border border-border hover:border-ink hover:text-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>Adicionar Cor</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {cupulaColors.map((cColor, idx) => (
                        <div
                          key={cColor.id || idx}
                          className="flex items-center gap-2 p-2 rounded-lg border border-border bg-surface shadow-xs transition-colors focus-within:border-ink"
                        >
                          {/* Controles de edição (swatch, nome e código hex) com quebra fluida em painel estreito */}
                          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                            {/* Swatch + Nome */}
                            <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                              <input
                                type="color"
                                value={cColor.colorHex}
                                onChange={(e) =>
                                  handleUpdateCupulaColor(idx, "colorHex", e.target.value)
                                }
                                aria-label={`Amostra de cor da Cúpula ${idx + 1}`}
                                title="Escolher cor visual"
                                className="w-10 h-10 rounded border border-border cursor-pointer p-0.5 shrink-0 bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
                              />
                              <input
                                type="text"
                                value={cColor.name}
                                onChange={(e) =>
                                  handleUpdateCupulaColor(idx, "name", e.target.value)
                                }
                                placeholder={`Ex: Cúpula ${idx + 1}`}
                                aria-label={`Nome da cor da Cúpula ${idx + 1}`}
                                className="w-full min-w-0 h-10 px-3 rounded-input border border-border bg-surface text-xs focus:outline-none focus:border-ink font-medium"
                              />
                            </div>

                            {/* Código HEX */}
                            <div className="w-24 shrink-0 flex-1 sm:flex-initial min-w-[90px]">
                              <input
                                type="text"
                                value={cColor.colorHex}
                                onChange={(e) =>
                                  handleUpdateCupulaColor(idx, "colorHex", e.target.value)
                                }
                                placeholder="#FAF8F5"
                                aria-label={`Código hexadecimal da Cúpula ${idx + 1}`}
                                className="w-full h-10 px-2 rounded-input border border-border bg-surface text-[11px] font-mono focus:outline-none focus:border-ink text-center uppercase"
                              />
                            </div>
                          </div>

                          {/* Coluna fixa reservada para a lixeira: área de clique mínima de 44 × 44 px */}
                          <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                            {cupulaColors.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveCupulaColor(idx)}
                                aria-label={`Remover cor da cúpula: ${cColor.name || `Cor ${idx + 1}`}`}
                                title={`Remover cor da cúpula: ${cColor.name || `Cor ${idx + 1}`}`}
                                className="w-11 h-11 rounded-lg flex items-center justify-center text-text-muted hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                aria-disabled="true"
                                aria-label="Não é possível remover a única cor da cúpula"
                                title="O produto precisa de pelo menos uma cor da cúpula"
                                className="w-11 h-11 rounded-lg flex items-center justify-center text-text-muted/30 cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-text-muted bg-surface-alt/40 p-2.5 rounded border border-border/80 flex items-center justify-between">
                  <span>
                    Combinações estimadas: <strong>{baseColors.filter(b => b.name.trim().length > 0).length} bases × {cupulaColors.filter(c => c.name.trim().length > 0).length} cúpulas = {baseColors.filter(b => b.name.trim().length > 0).length * cupulaColors.filter(c => c.name.trim().length > 0).length} variantes</strong>.
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    IDs estáveis e SKUs automáticos
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text">
                      Nome da Cor Principal
                    </label>
                    <input
                      type="text"
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      placeholder="Ex: Terracota Mate"
                      className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text">
                      Código Hex da Cor
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-10 h-10 rounded border border-border cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        placeholder="#D97A53"
                        className="flex-1 h-10 px-3 rounded-input border border-border bg-surface text-sm font-mono focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-text-muted">
                  Esta categoria utiliza uma única opção de cor para a peça.
                </div>
              </div>
            )}
          </div>

          {/* Opções e Variantes Vendáveis (exibido na edição ou quando há variantes cadastradas) */}
          {variantsList.length > 0 && initialProduct && (
            <div className="bg-surface rounded-card border border-border p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-ink font-mono uppercase tracking-wider">
                    Opções e Combinações Vendáveis Atuais
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {initialProduct.options
                      .map((o) => `${o.name} (${o.values.length})`)
                      .join(" · ")}
                  </p>
                </div>
                <span className="text-xs font-mono text-text-muted bg-surface-alt px-2.5 py-1 rounded-full border border-border self-start sm:self-auto">
                  {variantsList.length} combinações cadastradas
                </span>
              </div>

              {/* Grupos de opções com amostras */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-surface-alt/50 rounded-lg border border-border text-xs">
                {initialProduct.options.map((opt) => (
                  <div key={opt.id} className="space-y-1.5">
                    <span className="font-semibold text-text block font-mono text-[11px] uppercase tracking-wider">
                      {opt.name}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {opt.values.map((val) => (
                        <span
                          key={val.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border text-[11px]"
                        >
                          {val.colorHex && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: val.colorHex }}
                            />
                          )}
                          <span>{val.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela de variantes vendáveis */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-alt text-text-muted uppercase font-mono text-[10px] sticky top-0 border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3">Combinação</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Preço Base</th>
                        <th className="py-2.5 px-3 text-right">Disponibilidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {variantsList.map((variant) => {
                        const displayName = formatVariantDisplayName(
                          initialProduct,
                          variant
                        );
                        return (
                          <tr
                            key={variant.id}
                            className="hover:bg-surface-alt/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-medium text-text">
                              {displayName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-text-muted text-[11px]">
                              {variant.sku}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-ink">
                              {formatCents(variant.priceCents)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleVariant(variant.id, variant.active)
                                }
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                                  variant.active
                                    ? "bg-verde/15 text-verde hover:bg-verde/25"
                                    : "bg-red-50 text-red-600 hover:bg-red-100"
                                }`}
                              >
                                {variant.active ? "Ativo" : "Pausado"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. Ficha Técnica */}
          <div className="bg-surface rounded-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-bold text-ink font-mono uppercase tracking-wider">
              Ficha Técnica
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Dimensões (A × L × P em cm)
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="24 × 18 × 18 cm"
                  className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Peso da Peça (g)
                </label>
                <input
                  type="number"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(Number(e.target.value))}
                  placeholder="350"
                  className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            {/* Parâmetros para Luminárias */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Soquete
                </label>
                <input
                  type="text"
                  value={socketType}
                  onChange={(e) => setSocketType(e.target.value)}
                  placeholder="E27"
                  className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Potência Máx (W LED)
                </label>
                <input
                  type="number"
                  value={maxWattage}
                  onChange={(e) => setMaxWattage(Number(e.target.value))}
                  placeholder="15"
                  className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Cabo (cm)
                </label>
                <input
                  type="number"
                  value={cordLengthCm}
                  onChange={(e) => setCordLengthCm(Number(e.target.value))}
                  placeholder="150"
                  className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text">
                <input
                  type="checkbox"
                  checked={bulbIncluded}
                  onChange={(e) => setBulbIncluded(e.target.checked)}
                  className="rounded border-border text-ink focus:ring-magenta"
                />
                <span>Lâmpada inclusa</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text">
                <input
                  type="checkbox"
                  checked={waterproof}
                  onChange={(e) => setWaterproof(e.target.checked)}
                  className="rounded border-border text-ink focus:ring-magenta"
                />
                <span>Vedação para água (vasos com reservatório)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Coluna Lateral (1/3) */}
        <div className="space-y-6">
          {/* Parâmetros de Frete (Obrigatórios P-006) */}
          <div className="bg-surface rounded-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-bold text-ink font-mono uppercase tracking-wider">
              Embalagem e Frete (P-006)
            </h2>
            <p className="text-[11px] text-text-muted">
              Necessário para cálculo de frete do Melhor Envio sem erros.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">
                  Altura da Caixa (cm) *
                </label>
                <input
                  type="number"
                  required
                  value={packageHeightCm}
                  onChange={(e) => setPackageHeightCm(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-input border border-border bg-surface text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">
                  Largura da Caixa (cm) *
                </label>
                <input
                  type="number"
                  required
                  value={packageWidthCm}
                  onChange={(e) => setPackageWidthCm(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-input border border-border bg-surface text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">
                  Profundidade da Caixa (cm) *
                </label>
                <input
                  type="number"
                  required
                  value={packageDepthCm}
                  onChange={(e) => setPackageDepthCm(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-input border border-border bg-surface text-sm"
                />
              </div>
            </div>
          </div>

          {/* Material e Produção */}
          <div className="bg-surface rounded-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-bold text-ink font-mono uppercase tracking-wider">
              Material e Fabricação
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                Tipo de Filamento
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as "PLA" | "PETG")}
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm"
              >
                <option value="PLA">PLA Botânico Biodegradável</option>
                <option value="PETG">PETG de Alta Resistência</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                Prazo de Produção (dias úteis)
              </label>
              <input
                type="number"
                value={productionDays}
                onChange={(e) => setProductionDays(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text pt-1">
              <input
                type="checkbox"
                checked={isSustainable}
                onChange={(e) => setIsSustainable(e.target.checked)}
                className="rounded border-border text-verde focus:ring-verde"
              />
              <span>Selo Eco Sustentável</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
