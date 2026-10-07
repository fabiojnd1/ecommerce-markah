import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  isBlobConfigured,
  inspectImageBuffer,
  uploadCatalogImageToBlob,
} from "@/lib/blob-storage";
import { saveImageToDatabase } from "@/lib/database-image-storage";
import { isDatabaseConfigured } from "@/lib/runtime";
import { MAX_IMAGE_FILE_SIZE_BYTES } from "@/lib/storage-config";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const dynamic = "force-dynamic";

/**
 * Rota de Upload do Painel Administrativo.
 * Regra P-007: Exige privilégio ADMIN verificado no servidor.
 * Regra P-009: Valida tamanho máximo de 10 MB e dimensões razoáveis.
 * Segurança: Validação de assinatura binária (magic bytes) no servidor.
 */
export async function POST(req: NextRequest) {
  // 1. Verificação de permissão de administrador no servidor (P-007)
  try {
    await requireAdmin();
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Acesso não autorizado: privilégio de administrador necessário (P-007).";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  // 2. Determinação de disponibilidade de armazenamento (Banco de dados e Vercel Blob)
  const preferDatabase = process.env.IMAGE_STORAGE_PREFERENCE !== "blob";
  let canUseDatabase = false;
  try {
    canUseDatabase = isDatabaseConfigured();
  } catch {
    canUseDatabase = false;
  }
  const canUseBlob = isBlobConfigured();

  if (!canUseDatabase && !canUseBlob) {
    return NextResponse.json(
      {
        error:
          "Configuração ausente: BLOB_READ_WRITE_TOKEN não foi configurado no servidor e nenhuma conexão com banco de dados ativa para armazenamento de fotos. Configure uma das variáveis para habilitar uploads.",
      },
      { status: 500 }
    );
  }

  const contentType = req.headers.get("content-type") || "";

  // Caso 1: Upload direto multipart/form-data com validação completa de magic bytes
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: "Nenhum arquivo de imagem válido foi recebido no upload." },
          { status: 400 }
        );
      }

      // Converte para Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validação detalhada: tamanho, extensão, MIME e assinatura binária real
      const inspection = inspectImageBuffer(buffer, file.name, file.type);
      if (!inspection.valid) {
        return NextResponse.json(
          { error: inspection.error || "Arquivo de imagem inválido." },
          { status: 400 }
        );
      }

      // Preferência: Salva diretamente na base de dados PostgreSQL
      if ((preferDatabase && canUseDatabase) || !canUseBlob) {
        const stored = await saveImageToDatabase(
          buffer,
          file.name,
          inspection.mimeType!,
          inspection.width,
          inspection.height
        );

        return NextResponse.json({
          success: true,
          url: stored.url,
          pathname: stored.pathname,
          storage: "database",
          width: inspection.width,
          height: inspection.height,
        });
      }

      // Fallback: Envia para o Vercel Blob com nome gerado no servidor
      const blob = await uploadCatalogImageToBlob(
        buffer,
        inspection.extension!,
        inspection.mimeType!
      );

      return NextResponse.json({
        success: true,
        url: blob.url,
        pathname: blob.pathname,
        storage: "blob",
        width: inspection.width,
        height: inspection.height,
      });
    } catch (err: unknown) {
      console.error("[upload-blob] Erro durante o processamento do upload:", err);
      const message =
        err instanceof Error ? err.message : "Erro interno ao processar upload de imagem.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Caso 2: Geração de token cliente (@vercel/blob/client handleUpload)
  if (contentType.includes("application/json")) {
    try {
      const body = (await req.json()) as HandleUploadBody;
      const jsonResponse = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async () => {
          await requireAdmin();
          if (!isBlobConfigured()) {
            throw new Error(
              "Configuração ausente: BLOB_READ_WRITE_TOKEN não foi configurado no servidor. Configure a variável no arquivo .env.local para habilitar uploads no Vercel Blob."
            );
          }
          return {
            allowedContentTypes: ["image/jpeg", "image/png"],
            maximumSizeInBytes: MAX_IMAGE_FILE_SIZE_BYTES,
          };
        },
        onUploadCompleted: async () => {},
      });

      return NextResponse.json(jsonResponse);
    } catch (err: unknown) {
      console.error("[upload-blob] Erro na autorização de token cliente:", err);
      const message =
        err instanceof Error ? err.message : "Erro ao gerar autorização de upload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json(
    { error: "Content-Type não suportado para upload." },
    { status: 415 }
  );
}
