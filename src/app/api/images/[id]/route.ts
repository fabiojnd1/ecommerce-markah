import { NextRequest, NextResponse } from "next/server";
import { getImageFromDatabase } from "@/lib/database-image-storage";

export const dynamic = "force-dynamic";

/**
 * Endpoint para servir imagens armazenadas no banco de dados da Markah.
 * Inclui cabeçalhos de cache imutável (1 ano) e validação de ETag / 304 Not Modified.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return new NextResponse("ID de imagem inválido", { status: 400 });
  }

  const image = await getImageFromDatabase(id);

  if (!image) {
    return new NextResponse("Imagem não encontrada", { status: 404 });
  }

  const etag = `W/"${id}-${image.sizeBytes}"`;
  const ifNoneMatch = req.headers.get("if-none-match");

  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 });
  }

  return new NextResponse(new Uint8Array(image.buffer), {
    status: 200,
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.sizeBytes),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
    },
  });
}
