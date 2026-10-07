import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";

const IMAGE_MAP: Record<string, string> = {
  "luminaria-saturno.webp": "luminaria-saturno-on.svg",
  "luminaria-saturno-off.webp": "luminaria-saturno-off.svg",
  "luminaria-saturno.svg": "luminaria-saturno-on.svg",
  "luminaria-aurora.webp": "luminaria-coluna-duna-on.svg",
  "luminaria-coluna-duna.webp": "luminaria-coluna-duna-on.svg",
  "vaso-origami.webp": "vaso-facetado-hera-1.svg",
  "vaso-facetado-hera.webp": "vaso-facetado-hera-1.svg",
  "abajur-colmeia.webp": "pendente-origami-on.svg",
  "pendente-origami.webp": "pendente-origami-on.svg",
  "suporte-headphone.webp": "organizador-wave-1.svg",
  "organizador-wave.webp": "organizador-wave-1.svg",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await context.params;
  const rawFilename = pathSegments?.[pathSegments.length - 1] || "";
  const filename = decodeURIComponent(rawFilename).toLowerCase();

  const targetSvg = IMAGE_MAP[filename] || "luminaria-saturno-off.svg";
  const filePath = path.join(process.cwd(), "public", "products", targetSvg);

  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new NextResponse(null, { status: 404 });
}
