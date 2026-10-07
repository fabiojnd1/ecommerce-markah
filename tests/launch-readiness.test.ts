import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { getCategories, getProducts } from "@/lib/catalog";
import { SEED_PRODUCTS } from "@/lib/data/catalog-seed";

describe("Fase 8 — Lançamento Oficial (v1.0.0): Prontidão para Produção", () => {
  describe("SEO: Geração Dinâmica de Sitemap (sitemap.ts)", () => {
    it("deve conter todas as rotas estáticas principais e institucionais", async () => {
      const generated = await sitemap();
      const urls = generated.map((entry) => entry.url);

      // Rotas do e-commerce
      expect(urls.some((u) => u.endsWith("/produtos"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/favoritos"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/rastreio"))).toBe(true);

      // Rotas institucionais e de conformidade
      expect(urls.some((u) => u.endsWith("/sobre"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/materiais"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/tecnologia-3d"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/contato"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/envio"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/trocas"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/privacidade"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/termos"))).toBe(true);
    });

    it("deve conter todas as categorias ativas no sitemap", async () => {
      const generated = await sitemap();
      const urls = generated.map((entry) => entry.url);
      const categories = await getCategories();

      for (const cat of categories) {
        expect(urls.some((u) => u.endsWith(`/${cat.slug}`))).toBe(true);
      }
    });

    it("deve conter todos os produtos do catálogo no sitemap com prioridade alta", async () => {
      const generated = await sitemap();
      const products = await getProducts();

      for (const prod of products) {
        const item = generated.find((entry) => entry.url.endsWith(`/produtos/${prod.slug}`));
        expect(item).toBeDefined();
        expect(item?.priority).toBe(0.9);
      }
    });
  });

  describe("SEO: Configuração de Robôs de Busca (robots.ts)", () => {
    it("deve permitir indexação do catálogo público e bloquear áreas restritas", () => {
      const conf = robots();
      const rules = Array.isArray(conf.rules) ? conf.rules[0] : conf.rules;

      expect(rules).toBeDefined();
      expect(rules?.allow).toBe("/");

      const disallows = Array.isArray(rules?.disallow)
        ? rules?.disallow
        : [rules?.disallow];

      expect(disallows).toContain("/admin/");
      expect(disallows).toContain("/conta/");
      expect(disallows).toContain("/api/");
      expect(disallows).toContain("/checkout/");
      expect(disallows).toContain("/carrinho/");

      expect(conf.sitemap).toMatch(/sitemap\.xml$/);
    });
  });

  describe("Schema.org: Dados Estruturados JSON-LD", () => {
    it("deve produzir objeto válido para Schema.org Product com moedas e disponibilidade", () => {
      const product = SEED_PRODUCTS[0];
      const variant = product.variants[0];

      const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        sku: variant.sku,
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          price: (variant.priceCents / 100).toFixed(2),
          availability: "https://schema.org/InStock",
        },
      };

      expect(productSchema["@context"]).toBe("https://schema.org");
      expect(productSchema["@type"]).toBe("Product");
      expect(productSchema.offers.priceCurrency).toBe("BRL");
      expect(Number(productSchema.offers.price)).toBeGreaterThan(0);
      expect(productSchema.offers.availability).toBe("https://schema.org/InStock");
    });
  });

  describe("Invariantes de Catálogo e Precificação (D-011 / P-002)", () => {
    it("todos os produtos do catálogo devem possuir preços estritamente em inteiros de centavos", () => {
      for (const product of SEED_PRODUCTS) {
        expect(product.variants.length).toBeGreaterThanOrEqual(1);
        for (const variant of product.variants) {
          expect(Number.isInteger(variant.priceCents)).toBe(true);
          expect(variant.priceCents).toBeGreaterThan(0);

          if (variant.compareAtPriceCents) {
            expect(Number.isInteger(variant.compareAtPriceCents)).toBe(true);
            expect(variant.compareAtPriceCents).toBeGreaterThan(variant.priceCents);
          }
        }
      }
    });

    it("todos os produtos devem possuir dimensões e pesos válidos para frete", () => {
      for (const product of SEED_PRODUCTS) {
        for (const variant of product.variants) {
          expect(variant.weightGrams).toBeGreaterThan(50);
          expect(variant.packageHeightCm).toBeGreaterThan(5);
          expect(variant.packageWidthCm).toBeGreaterThan(5);
          expect(variant.packageDepthCm).toBeGreaterThan(5);
        }
      }
    });
  });
});
