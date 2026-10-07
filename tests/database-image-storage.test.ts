import { describe, it, expect } from "vitest";
import {
  saveImageToDatabase,
  getImageFromDatabase,
  deleteImageFromDatabase,
  isDatabaseImageUrl,
  extractDatabaseImageId,
} from "@/lib/database-image-storage";

describe("Armazenamento de Imagens no Banco de Dados", () => {
  it("salva imagem, gera URL /api/images/[id] e permite recuperação íntegra", async () => {
    const dummyBuffer = Buffer.from("fake-binary-image-data-for-testing");
    const result = await saveImageToDatabase(
      dummyBuffer,
      "foto-luminaria.jpg",
      "image/jpeg",
      800,
      1000
    );

    expect(result.id).toBeDefined();
    expect(result.url).toBe(`/api/images/${result.id}`);
    expect(result.sizeBytes).toBe(dummyBuffer.length);
    expect(isDatabaseImageUrl(result.url)).toBe(true);
    expect(extractDatabaseImageId(result.url)).toBe(result.id);

    const loaded = await getImageFromDatabase(result.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.mimeType).toBe("image/jpeg");
    expect(loaded?.buffer.toString()).toBe(dummyBuffer.toString());
    expect(loaded?.sizeBytes).toBe(dummyBuffer.length);

    const deleted = await deleteImageFromDatabase(result.id);
    expect(deleted).toBe(true);

    const afterDelete = await getImageFromDatabase(result.id);
    expect(afterDelete).toBeNull();
  });

  it("reconhece URLs válidas de banco e ignora URLs externas", () => {
    expect(isDatabaseImageUrl("/api/images/cuid123456")).toBe(true);
    expect(isDatabaseImageUrl("https://markah.com.br/api/images/cuid123456")).toBe(true);
    expect(isDatabaseImageUrl("https://abc.public.blob.vercel-storage.com/prod.jpg")).toBe(false);
    expect(isDatabaseImageUrl("/products/saturno.svg")).toBe(false);
  });
});
