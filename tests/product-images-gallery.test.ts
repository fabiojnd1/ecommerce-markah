import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  inspectImageBuffer,
  isBlobConfigured,
  isVercelBlobUrl,
} from "@/lib/blob-storage";
import {
  MAX_IMAGE_FILE_SIZE_BYTES,
  MIN_IMAGE_DIMENSION,
  MAX_IMAGE_DIMENSION,
} from "@/lib/storage-config";
import { saveProductAction } from "@/server/admin-actions";
import * as auth from "@/lib/auth";
import { NextRequest } from "next/server";
import { POST as uploadBlobHandler } from "@/app/api/admin/upload-blob/route";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Helper para construir buffer PNG válido com dimensões específicas
function createPngBuffer(width: number, height: number): Buffer {
  const buf = Buffer.alloc(33);
  // PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  buf.writeUInt32BE(13, 8); // IHDR length
  buf.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  buf.set([0x08, 0x06, 0x00, 0x00, 0x00], 24); // 8-bit truecolor+alpha
  return buf;
}

// Helper para construir buffer JPEG válido com marcador SOF0 e dimensões
function createJpegBuffer(width: number, height: number): Buffer {
  const buf = Buffer.alloc(30);
  // JPEG Magic Bytes: FF D8 FF
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0; // APP0
  buf.writeUInt16BE(16, 4); // length
  // SOF0 Marker: FF C0
  buf[20] = 0xff;
  buf[21] = 0xc0;
  buf.writeUInt16BE(11, 22); // length
  buf[24] = 8; // precision
  buf.writeUInt16BE(height, 25);
  buf.writeUInt16BE(width, 27);
  return buf;
}

describe("Fase 2 & Fase 8.5 — Gestão e Upload de Fotos de Produtos (Vercel Blob, D-013, P-009)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validação e Segurança de Imagens no Servidor (P-009)", () => {
    it("deve aceitar imagem PNG com assinatura autêntica e dimensões recomendadas 4:5", () => {
      const pngBuffer = createPngBuffer(1200, 1500);
      const res = inspectImageBuffer(pngBuffer, "luminaria-saturno.png", "image/png");

      expect(res.valid).toBe(true);
      expect(res.mimeType).toBe("image/png");
      expect(res.extension).toBe("png");
      expect(res.width).toBe(1200);
      expect(res.height).toBe(1500);
    });

    it("deve aceitar imagem JPEG com cabeçalho autêntico e dimensões válidas", () => {
      const jpegBuffer = createJpegBuffer(1200, 1500);
      const res = inspectImageBuffer(jpegBuffer, "luminaria.jpg", "image/jpeg");

      expect(res.valid).toBe(true);
      expect(res.mimeType).toBe("image/jpeg");
      expect(res.extension).toBe("jpg");
      expect(res.width).toBe(1200);
      expect(res.height).toBe(1500);
    });

    it("deve rejeitar arquivos falsificados com extensão PNG mas sem magic bytes reais", () => {
      const fakeBuffer = Buffer.from("Este texto nao e uma imagem valida de verdade");
      const res = inspectImageBuffer(fakeBuffer, "fake.png", "image/png");

      expect(res.valid).toBe(false);
      expect(res.error).toContain("Assinatura de imagem inválida");
    });

    it("deve rejeitar extensões não permitidas mesmo que o MIME informe imagem", () => {
      const pngBuffer = createPngBuffer(1200, 1500);
      const res = inspectImageBuffer(pngBuffer, "script.exe", "image/png");

      expect(res.valid).toBe(false);
      expect(res.error).toContain("Extensão de arquivo não permitida");
    });

    it("deve rejeitar arquivos acima do limite de 10 MB (P-009)", () => {
      // Buffer simulando 11 MB
      const oversizedBuffer = Buffer.alloc(MAX_IMAGE_FILE_SIZE_BYTES + 1024);
      const res = inspectImageBuffer(oversizedBuffer, "foto-gigante.png", "image/png");

      expect(res.valid).toBe(false);
      expect(res.error).toContain("excede o limite permitido de 10 MB");
    });

    it("deve rejeitar imagens com dimensões anômalas (< 100px ou > 8000px)", () => {
      const tinyPng = createPngBuffer(50, 50);
      const resTiny = inspectImageBuffer(tinyPng, "miniatura.png", "image/png");
      expect(resTiny.valid).toBe(false);
      expect(resTiny.error).toContain("fora dos limites suportados");

      const hugePng = createPngBuffer(9000, 9000);
      const resHuge = inspectImageBuffer(hugePng, "gigante.png", "image/png");
      expect(resHuge.valid).toBe(false);
      expect(resHuge.error).toContain("fora dos limites suportados");
    });

    it("deve identificar URLs pertencentes ao Vercel Blob e ignorar URLs locais legadas", () => {
      expect(
        isVercelBlobUrl("https://abc123xyz.public.blob.vercel-storage.com/products/saturno.jpg")
      ).toBe(true);
      expect(
        isVercelBlobUrl("https://blob.vercel-storage.com/products/saturno.jpg")
      ).toBe(true);
      expect(isVercelBlobUrl("/products/luminaria-saturno-off.svg")).toBe(false);
      expect(isVercelBlobUrl("")).toBe(false);
    });

    it("deve acusar erro de configuração caso BLOB_READ_WRITE_TOKEN esteja ausente", () => {
      const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
      delete process.env.BLOB_READ_WRITE_TOKEN;

      expect(isBlobConfigured()).toBe(false);

      process.env.BLOB_READ_WRITE_TOKEN = originalToken;
    });
  });

  describe("Rota de Upload do Admin (POST /api/admin/upload-blob)", () => {
    it("deve barrar requisições sem credencial de administrador (P-007)", async () => {
      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      const req = new NextRequest("http://localhost:3000/api/admin/upload-blob", {
        method: "POST",
      });

      const res = await uploadBlobHandler(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain("Acesso não autorizado");
    });

    it("deve retornar 500 com mensagem clara quando BLOB_READ_WRITE_TOKEN não estiver configurado", async () => {
      vi.spyOn(auth, "requireAdmin").mockResolvedValue({
        id: "admin_test",
        name: "Admin",
        email: "admin@markah.com.br",
        role: "ADMIN",
      });

      const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
      delete process.env.BLOB_READ_WRITE_TOKEN;

      const req = new NextRequest("http://localhost:3000/api/admin/upload-blob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blob.generate-client-token" }),
      });

      const res = await uploadBlobHandler(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toContain("BLOB_READ_WRITE_TOKEN não foi configurado no servidor");

      process.env.BLOB_READ_WRITE_TOKEN = originalToken;
    });
  });

  describe("Persistência da Galeria em saveProductAction", () => {
    beforeEach(() => {
      vi.spyOn(auth, "requireAdmin").mockResolvedValue({
        id: "admin_test",
        name: "Admin",
        email: "admin@markah.com.br",
        role: "ADMIN",
      });
    });

    it("deve exigir exatamente uma imagem principal quando imagens forem fornecidas", async () => {
      // Caso 1: Nenhuma imagem principal marcada
      const resNoPrimary = await saveProductAction({
        name: "Luminária Sem Principal",
        slug: "luminaria-sem-principal",
        description: "Teste",
        categorySlug: "luminarias-de-mesa",
        material: "PLA",
        isSustainable: true,
        productionDays: 3,
        dimensions: "20 × 20 × 20 cm",
        weightGrams: 350,
        priceCents: 15000,
        packageHeightCm: 25,
        packageWidthCm: 25,
        packageDepthCm: 25,
        images: [
          {
            url: "https://blob.vercel-storage.com/foto1.jpg",
            isPrimary: false,
            isHover: false,
          },
          {
            url: "https://blob.vercel-storage.com/foto2.jpg",
            isPrimary: false,
            isHover: true,
          },
        ],
      });

      expect(resNoPrimary.success).toBe(false);
      expect(resNoPrimary.error).toContain("É obrigatório definir exatamente uma imagem principal");

      // Caso 2: Duas imagens principais marcadas
      const resTwoPrimaries = await saveProductAction({
        name: "Luminária Duas Principais",
        slug: "luminaria-duas-principais",
        description: "Teste",
        categorySlug: "luminarias-de-mesa",
        material: "PLA",
        isSustainable: true,
        productionDays: 3,
        dimensions: "20 × 20 × 20 cm",
        weightGrams: 350,
        priceCents: 15000,
        packageHeightCm: 25,
        packageWidthCm: 25,
        packageDepthCm: 25,
        images: [
          {
            url: "https://blob.vercel-storage.com/foto1.jpg",
            isPrimary: true,
            isHover: false,
          },
          {
            url: "https://blob.vercel-storage.com/foto2.jpg",
            isPrimary: true,
            isHover: false,
          },
        ],
      });

      expect(resTwoPrimaries.success).toBe(false);
      expect(resTwoPrimaries.error).toContain("no máximo uma imagem principal");
    });

    it("deve validar no máximo uma imagem de hover / iluminada", async () => {
      const resTwoHovers = await saveProductAction({
        name: "Luminária Dois Hovers",
        slug: "luminaria-dois-hovers",
        description: "Teste",
        categorySlug: "luminarias-de-mesa",
        material: "PLA",
        isSustainable: true,
        productionDays: 3,
        dimensions: "20 × 20 × 20 cm",
        weightGrams: 350,
        priceCents: 15000,
        packageHeightCm: 25,
        packageWidthCm: 25,
        packageDepthCm: 25,
        images: [
          {
            url: "https://blob.vercel-storage.com/foto1.jpg",
            isPrimary: true,
            isHover: false,
          },
          {
            url: "https://blob.vercel-storage.com/foto2.jpg",
            isPrimary: false,
            isHover: true,
          },
          {
            url: "https://blob.vercel-storage.com/foto3.jpg",
            isPrimary: false,
            isHover: true,
          },
        ],
      });

      expect(resTwoHovers.success).toBe(false);
      expect(resTwoHovers.error).toContain("no máximo uma imagem de hover");
    });

    it("deve persistir galeria ordenada por displayOrder com textos alternativos e sinalizações", async () => {
      const res = await saveProductAction({
        name: "Luminária Galeria Completa",
        slug: "luminaria-galeria-completa",
        description: "Teste galeria múltipla",
        categorySlug: "luminarias-de-mesa",
        material: "PLA",
        isSustainable: true,
        productionDays: 3,
        dimensions: "20 × 20 × 20 cm",
        weightGrams: 350,
        priceCents: 18900,
        packageHeightCm: 25,
        packageWidthCm: 25,
        packageDepthCm: 25,
        images: [
          {
            url: "https://blob.vercel-storage.com/foto2.jpg",
            alt: "Foto ambiente na sala",
            displayOrder: 1,
            isPrimary: false,
            isHover: true,
          },
          {
            url: "https://blob.vercel-storage.com/foto1.jpg",
            alt: "Foto isolada fundo branco",
            displayOrder: 0,
            isPrimary: true,
            isHover: false,
          },
          {
            url: "https://blob.vercel-storage.com/foto3.jpg",
            alt: "Detalhe da cúpula em PLA",
            displayOrder: 2,
            isPrimary: false,
            isHover: false,
          },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.product?.images).toHaveLength(3);
      // Confere se foram ordenados pelo displayOrder
      expect(res.product?.images[0].url).toBe("https://blob.vercel-storage.com/foto1.jpg");
      expect(res.product?.images[0].isPrimary).toBe(true);
      expect(res.product?.images[1].url).toBe("https://blob.vercel-storage.com/foto2.jpg");
      expect(res.product?.images[1].isHover).toBe(true);
      expect(res.product?.images[2].url).toBe("https://blob.vercel-storage.com/foto3.jpg");
      expect(res.product?.images[2].alt).toBe("Detalhe da cúpula em PLA");
    });

    it("deve manter compatibilidade com produtos legados que enviem apenas imageUrl e hoverImageUrl", async () => {
      const res = await saveProductAction({
        name: "Luminária Legada URLs",
        slug: "luminaria-legada-urls",
        description: "Teste legado",
        categorySlug: "luminarias-de-mesa",
        material: "PLA",
        isSustainable: true,
        productionDays: 3,
        dimensions: "20 × 20 × 20 cm",
        weightGrams: 350,
        priceCents: 15900,
        packageHeightCm: 25,
        packageWidthCm: 25,
        packageDepthCm: 25,
        imageUrl: "/products/luminaria-saturno-off.svg",
        hoverImageUrl: "/products/luminaria-saturno-on.svg",
      });

      expect(res.success).toBe(true);
      expect(res.product?.images).toHaveLength(2);
      expect(res.product?.images[0].url).toBe("/products/luminaria-saturno-off.svg");
      expect(res.product?.images[0].isPrimary).toBe(true);
      expect(res.product?.images[1].url).toBe("/products/luminaria-saturno-on.svg");
      expect(res.product?.images[1].isHover).toBe(true);
    });
  });

  describe("Experiência da Loja — ProductGallery e ProductCard", () => {
    it("ProductGallery deve abrir inicialmente na imagem marcada como isPrimary mesmo quando não estiver no índice zero", async () => {
      const { render, screen } = await import("@testing-library/react");
      const { ProductGallery } = await import("@/components/loja/product-gallery");

      const images = [
        {
          id: "img_0",
          url: "/products/foto-secundaria-off.svg",
          alt: "Foto Secundária",
          isPrimary: false,
          isHover: false,
        },
        {
          id: "img_1",
          url: "/products/foto-principal.svg",
          alt: "Foto Principal Destacada",
          isPrimary: true,
          isHover: false,
        },
        {
          id: "img_2",
          url: "/products/foto-hover.svg",
          alt: "Foto Hover",
          isPrimary: false,
          isHover: true,
        },
      ];

      const React = (await import("react")).default;
      render(React.createElement(ProductGallery, { images, productName: "Luminária Teste" }));

      const activeMainImg = screen.getByAltText("Foto Principal Destacada");
      expect(activeMainImg).toBeDefined();
    });
  });
});
