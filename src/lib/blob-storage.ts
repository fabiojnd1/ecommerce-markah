import { put, del } from "@vercel/blob";
import {
  MAX_IMAGE_FILE_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
  MIN_IMAGE_DIMENSION,
  MAX_IMAGE_DIMENSION,
} from "./storage-config";

export interface ImageInspectionResult {
  valid: boolean;
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
  extension?: "png" | "jpg" | "webp";
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Verifica se a variável BLOB_READ_WRITE_TOKEN está configurada no servidor.
 */
export function isBlobConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return Boolean(token && token.trim().length > 0 && !token.includes("0000000000000000000000"));
}

/**
 * Inspeciona a assinatura real (magic bytes) e dimensões do buffer da imagem.
 * Não confia no tipo MIME ou extensão informados pelo cliente.
 */
export function inspectImageBuffer(
  buffer: Buffer,
  filename?: string,
  declaredMimeType?: string
): ImageInspectionResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Arquivo vazio ou inválido." };
  }

  if (buffer.length > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Tamanho do arquivo (${sizeMb} MB) excede o limite permitido de ${MAX_IMAGE_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
    };
  }

  // Validação de extensão se nome fornecido
  if (filename) {
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    const isAllowedExt = ALLOWED_IMAGE_EXTENSIONS.some((allowed) => allowed === ext);
    if (!isAllowedExt) {
      return {
        valid: false,
        error: `Extensão de arquivo não permitida (${ext}). Envie imagens nos formatos PNG, JPG ou JPEG.`,
      };
    }
  }

  // Validação de tipo MIME se fornecido
  if (declaredMimeType) {
    const isAllowedMime = ALLOWED_IMAGE_MIME_TYPES.some((m) => m === declaredMimeType);
    if (!isAllowedMime) {
      return {
        valid: false,
        error: `Tipo MIME inválido (${declaredMimeType}). Permitidos: image/png, image/jpeg.`,
      };
    }
  }

  if (buffer.length < 24) {
    return { valid: false, error: "Arquivo muito pequeno para conter cabeçalho de imagem válido." };
  }

  // 1. Verificação de PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    if (
      width < MIN_IMAGE_DIMENSION ||
      height < MIN_IMAGE_DIMENSION ||
      width > MAX_IMAGE_DIMENSION ||
      height > MAX_IMAGE_DIMENSION
    ) {
      return {
        valid: false,
        error: `Dimensões da imagem (${width} × ${height} px) fora dos limites suportados (${MIN_IMAGE_DIMENSION}px a ${MAX_IMAGE_DIMENSION}px).`,
      };
    }

    return {
      valid: true,
      mimeType: "image/png",
      extension: "png",
      width,
      height,
    };
  }

  // 2. Verificação de JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    let offset = 2;
    let width: number | undefined;
    let height: number | undefined;

    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // Final de imagem (EOI) ou início de dados (SOS)
      if (marker === 0xd9 || marker === 0xda) break;

      if (offset + 4 > buffer.length) break;
      const len = buffer.readUInt16BE(offset + 2);

      // Marcadores de início de quadro (SOF): 0xC0 a 0xCF (exceto DHT 0xC4, JPG 0xC8, DAC 0xCC)
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        if (offset + 9 <= buffer.length) {
          height = buffer.readUInt16BE(offset + 5);
          width = buffer.readUInt16BE(offset + 7);
          break;
        }
      }
      offset += 2 + len;
    }

    if (width && height) {
      if (
        width < MIN_IMAGE_DIMENSION ||
        height < MIN_IMAGE_DIMENSION ||
        width > MAX_IMAGE_DIMENSION ||
        height > MAX_IMAGE_DIMENSION
      ) {
        return {
          valid: false,
          error: `Dimensões da imagem (${width} × ${height} px) fora dos limites suportados (${MIN_IMAGE_DIMENSION}px a ${MAX_IMAGE_DIMENSION}px).`,
        };
      }

      return {
        valid: true,
        mimeType: "image/jpeg",
        extension: "jpg",
        width,
        height,
      };
    }

    return {
      valid: true,
      mimeType: "image/jpeg",
      extension: "jpg",
    };
  }

  // 3. Verificação de WEBP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return {
      valid: true,
      mimeType: "image/webp",
      extension: "webp",
    };
  }

  return {
    valid: false,
    error: "Assinatura de imagem inválida. O arquivo enviado não é um JPEG, PNG ou WEBP autêntico.",
  };
}

/**
 * Envia uma imagem validada para o Vercel Blob com nome gerado pela aplicação.
 * Nunca confia no nome fornecido pelo usuário.
 */
export async function uploadCatalogImageToBlob(
  buffer: Buffer,
  extension: "png" | "jpg" | "webp",
  mimeType: "image/png" | "image/jpeg" | "image/webp"
) {
  if (!isBlobConfigured()) {
    throw new Error(
      "Configuração ausente: BLOB_READ_WRITE_TOKEN não foi configurado no servidor. Configure a variável no arquivo .env.local para habilitar uploads no Vercel Blob."
    );
  }

  const randomId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const safeFilename = `products/prod_${Date.now()}_${randomId}.${extension}`;

  const blob = await put(safeFilename, buffer, {
    access: "public",
    contentType: mimeType,
  });

  return blob;
}

/**
 * Verifica se uma URL pertence ao armazenamento Vercel Blob.
 */
export function isVercelBlobUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes(".public.blob.vercel-storage.com") ||
    url.includes("blob.vercel-storage.com")
  );
}

import {
  isDatabaseImageUrl,
  extractDatabaseImageId,
  deleteImageFromDatabase,
} from "./database-image-storage";

/**
 * Remove fotos do armazenamento (banco de dados ou Vercel Blob) após confirmação.
 * Ignora URLs legadas (ex: SVGs locais) e captura falhas sem quebrar o fluxo.
 */
export async function deleteBlobsSafely(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;

  // 1. Limpeza de fotos hospedadas no banco de dados
  const dbImageIds = urls
    .filter((u) => isDatabaseImageUrl(u))
    .map((u) => extractDatabaseImageId(u))
    .filter(Boolean) as string[];

  for (const id of dbImageIds) {
    try {
      await deleteImageFromDatabase(id);
    } catch (err) {
      console.error("[blob-storage] Erro ao remover imagem do banco:", err);
    }
  }

  // 2. Limpeza de fotos hospedadas no Vercel Blob
  if (!isBlobConfigured()) return;

  const validBlobUrls = urls.filter((url) => isVercelBlobUrl(url));
  if (validBlobUrls.length === 0) return;

  try {
    await del(validBlobUrls);
  } catch (err) {
    console.error("[blob-storage] Erro ao remover blobs obsoletos do storage:", err);
  }
}
