import { db } from "./db";
import { isDatabaseConfigured } from "./runtime";

// Armazenamento em memória para dev/testes quando banco de dados não estiver ativo
const devMemoryImageStore = new Map<
  string,
  {
    buffer: Buffer;
    mimeType: string;
    filename: string;
    sizeBytes: number;
    width?: number;
    height?: number;
  }
>();

/**
 * Salva um buffer de imagem diretamente na tabela stored_images do PostgreSQL.
 * Retorna a URL pública interna /api/images/[id] para ser consumida pelo frontend.
 */
export async function saveImageToDatabase(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  width?: number,
  height?: number
): Promise<{ id: string; url: string; sizeBytes: number; pathname: string }> {
  const base64Data = buffer.toString("base64");
  const sizeBytes = buffer.length;

  if (isDatabaseConfigured()) {
    const record = await db.storedImage.create({
      data: {
        filename,
        mimeType,
        data: base64Data,
        sizeBytes,
        width,
        height,
      },
    });

    return {
      id: record.id,
      url: `/api/images/${record.id}`,
      pathname: `images/${record.id}`,
      sizeBytes,
    };
  }

  // Fallback em memória para desenvolvimento quando o banco não estiver configurado
  const memoryId = `dev_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  devMemoryImageStore.set(memoryId, {
    buffer,
    mimeType,
    filename,
    sizeBytes,
    width,
    height,
  });

  return {
    id: memoryId,
    url: `/api/images/${memoryId}`,
    pathname: `images/${memoryId}`,
    sizeBytes,
  };
}

/**
 * Recupera o buffer e metadados de uma imagem do banco de dados (ou memória dev).
 */
export async function getImageFromDatabase(
  id: string
): Promise<{ buffer: Buffer; mimeType: string; filename: string; sizeBytes: number } | null> {
  if (devMemoryImageStore.has(id)) {
    const mem = devMemoryImageStore.get(id)!;
    return {
      buffer: mem.buffer,
      mimeType: mem.mimeType,
      filename: mem.filename,
      sizeBytes: mem.sizeBytes,
    };
  }

  if (!isDatabaseConfigured()) return null;

  try {
    const record = await db.storedImage.findUnique({
      where: { id },
    });

    if (!record) return null;

    const buffer = Buffer.from(record.data, "base64");
    return {
      buffer,
      mimeType: record.mimeType,
      filename: record.filename,
      sizeBytes: record.sizeBytes,
    };
  } catch (err) {
    console.error("[database-image-storage] Erro ao carregar imagem do banco:", err);
    return null;
  }
}

/**
 * Remove uma imagem armazenada do banco de dados.
 */
export async function deleteImageFromDatabase(id: string): Promise<boolean> {
  if (devMemoryImageStore.has(id)) {
    devMemoryImageStore.delete(id);
    return true;
  }

  if (!isDatabaseConfigured()) return false;

  try {
    await db.storedImage.delete({
      where: { id },
    });
    return true;
  } catch (err) {
    console.error("[database-image-storage] Erro ao excluir imagem do banco:", err);
    return false;
  }
}

/**
 * Verifica se uma URL pertence ao armazenamento de fotos no banco de dados.
 */
export function isDatabaseImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("/api/images/") || url.includes("/api/images/");
}

/**
 * Extrai o ID da imagem a partir da URL /api/images/[id].
 */
export function extractDatabaseImageId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/images\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
