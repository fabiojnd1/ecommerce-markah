/**
 * Configurações e limites de armazenamento e upload de imagens da Markah.
 * P-009: Limitar tamanho no upload do admin para manter performance da loja.
 */

// Limite configurável em um único local (10 MB por arquivo)
export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Extensões e tipos MIME permitidos para novos uploads
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

// Limites razoáveis de dimensões de imagem (em pixels)
export const MIN_IMAGE_DIMENSION = 100;
export const MAX_IMAGE_DIMENSION = 8000;

// Recomendações de proporção e resolução da Markah
export const RECOMMENDED_ASPECT_RATIO = 4 / 5; // 0.8
export const RECOMMENDED_WIDTH_PX = 1200;
export const RECOMMENDED_HEIGHT_PX = 1500;
export const ASPECT_RATIO_TOLERANCE = 0.05; // 5% de tolerância antes de exibir aviso
