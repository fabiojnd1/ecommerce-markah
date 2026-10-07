"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Sun,
  AlertTriangle,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  MAX_IMAGE_FILE_SIZE_BYTES,
  ALLOWED_IMAGE_EXTENSIONS,
  RECOMMENDED_WIDTH_PX,
  RECOMMENDED_HEIGHT_PX,
  RECOMMENDED_ASPECT_RATIO,
  ASPECT_RATIO_TOLERANCE,
} from "@/lib/storage-config";

export interface ProductPhotoItem {
  id: string;
  url: string;
  file?: File;
  name: string;
  alt: string;
  displayOrder: number;
  isPrimary: boolean;
  isHover: boolean;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  errorMessage?: string;
  width?: number;
  height?: number;
  isRatioNonStandard?: boolean;
}

interface ProductPhotosManagerProps {
  photos: ProductPhotoItem[];
  onChange: (photos: ProductPhotoItem[]) => void;
  onRemove: (id: string, url: string) => void;
}

export function ProductPhotosManager({
  photos,
  onChange,
  onRemove,
}: ProductPhotosManagerProps) {
  const [isDragOverZone, setIsDragOverZone] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [dragOverPhotoId, setDragOverPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função interna de upload usando XMLHttpRequest para progresso real
  const uploadPhotoFile = useCallback(
    (photoId: string, file: File) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onChange(
            photos.map((item) =>
              item.id === photoId
                ? { ...item, progress: Math.min(percent, 95) }
                : item
            )
          );
        }
      };

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && response.success) {
            onChange(
              photos.map((item) =>
                item.id === photoId
                  ? {
                      ...item,
                      url: response.url,
                      status: "success",
                      progress: 100,
                      width: response.width || item.width,
                      height: response.height || item.height,
                    }
                  : item
              )
            );
          } else {
            const errorMsg =
              response.error || "Erro desconhecido ao processar upload.";
            onChange(
              photos.map((item) =>
                item.id === photoId
                  ? {
                      ...item,
                      status: "error",
                      errorMessage: errorMsg,
                      progress: 0,
                    }
                  : item
              )
            );
          }
        } catch {
          onChange(
            photos.map((item) =>
              item.id === photoId
                ? {
                    ...item,
                    status: "error",
                    errorMessage: "Resposta inválida do servidor de upload.",
                    progress: 0,
                  }
                : item
            )
          );
        }
      };

      xhr.onerror = () => {
        onChange(
          photos.map((item) =>
            item.id === photoId
              ? {
                  ...item,
                  status: "error",
                  errorMessage: "Falha de rede ao conectar com o servidor.",
                  progress: 0,
                }
              : item
          )
        );
      };

      xhr.open("POST", "/api/admin/upload-blob");
      xhr.send(formData);
    },
    [photos, onChange]
  );

  // Processa novos arquivos adicionados
  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const newPhotos: ProductPhotoItem[] = [];
      const filesToUpload: { id: string; file: File }[] = [];

      files.forEach((file, index) => {
        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        const isExtValid = ALLOWED_IMAGE_EXTENSIONS.some((e) => e === ext);

        const tempId = `photo_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`;
        const localPreviewUrl = URL.createObjectURL(file);
        const hasExistingPrimary =
          photos.some((p) => p.isPrimary) ||
          newPhotos.some((p) => p.isPrimary);
        const shouldBePrimary = !hasExistingPrimary && index === 0;

        if (!isExtValid) {
          newPhotos.push({
            id: tempId,
            url: localPreviewUrl,
            file,
            name: file.name,
            alt: "",
            displayOrder: photos.length + newPhotos.length,
            isPrimary: shouldBePrimary,
            isHover: false,
            status: "error",
            progress: 0,
            errorMessage: `Formato "${ext}" não suportado. Aceita PNG, JPG ou JPEG.`,
          });
          return;
        }

        if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
          const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
          newPhotos.push({
            id: tempId,
            url: localPreviewUrl,
            file,
            name: file.name,
            alt: "",
            displayOrder: photos.length + newPhotos.length,
            isPrimary: shouldBePrimary,
            isHover: false,
            status: "error",
            progress: 0,
            errorMessage: `Arquivo com ${sizeMb} MB excede o limite de ${MAX_IMAGE_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
          });
          return;
        }

        const photoItem: ProductPhotoItem = {
          id: tempId,
          url: localPreviewUrl,
          file,
          name: file.name,
          alt: "",
          displayOrder: photos.length + newPhotos.length,
          isPrimary: shouldBePrimary,
          isHover: false,
          status: "uploading",
          progress: 5,
        };

        // Inspeciona proporção e dimensões no navegador
        const img = new window.Image();
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const ratio = w / h;
          const isNonStandard =
            Math.abs(ratio - RECOMMENDED_ASPECT_RATIO) > ASPECT_RATIO_TOLERANCE;

          photoItem.width = w;
          photoItem.height = h;
          photoItem.isRatioNonStandard = isNonStandard;
        };
        img.src = localPreviewUrl;

        newPhotos.push(photoItem);
        filesToUpload.push({ id: tempId, file });
      });

      const updatedList = [...photos, ...newPhotos];
      onChange(updatedList);

      // Inicia upload dos arquivos válidos
      filesToUpload.forEach(({ id, file }) => {
        uploadPhotoFile(id, file);
      });
    },
    [photos, onChange, uploadPhotoFile]
  );

  // Ações de ordenação
  function movePhoto(index: number, direction: "left" | "right") {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const newList = [...photos];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    const reordered = newList.map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }));
    onChange(reordered);
  }

  // Definir foto principal (exatamente uma)
  function setPrimaryPhoto(id: string) {
    const updated = photos.map((item) => {
      if (item.id === id) {
        return { ...item, isPrimary: true, isHover: false };
      }
      return { ...item, isPrimary: false };
    });
    onChange(updated);
  }

  // Alternar foto de hover / iluminada (no máximo uma)
  function toggleHoverPhoto(id: string) {
    const updated = photos.map((item) => {
      if (item.id === id) {
        // Se já era hover, desmarca. Se não era, marca como hover (e remove primary se tiver)
        const nextHover = !item.isHover;
        return {
          ...item,
          isHover: nextHover,
          isPrimary: nextHover ? false : item.isPrimary,
        };
      }
      return { ...item, isHover: false };
    });
    onChange(updated);
  }

  // Atualizar texto alternativo
  function updateAltText(id: string, altText: string) {
    const updated = photos.map((item) =>
      item.id === id ? { ...item, alt: altText } : item
    );
    onChange(updated);
  }

  // Re-tentar upload em caso de falha
  function retryUpload(photo: ProductPhotoItem) {
    if (!photo.file) return;

    onChange(
      photos.map((item) =>
        item.id === photo.id
          ? { ...item, status: "uploading", progress: 5, errorMessage: undefined }
          : item
      )
    );
    uploadPhotoFile(photo.id, photo.file);
  }

  // Drag and drop entre cards de fotos para reordenar
  function handleCardDrop(targetPhotoId: string) {
    if (!draggedPhotoId || draggedPhotoId === targetPhotoId) {
      setDraggedPhotoId(null);
      setDragOverPhotoId(null);
      return;
    }

    const sourceIndex = photos.findIndex((p) => p.id === draggedPhotoId);
    const targetIndex = photos.findIndex((p) => p.id === targetPhotoId);

    if (sourceIndex >= 0 && targetIndex >= 0) {
      const newList = [...photos];
      const [moved] = newList.splice(sourceIndex, 1);
      newList.splice(targetIndex, 0, moved);

      const reordered = newList.map((item, idx) => ({
        ...item,
        displayOrder: idx,
      }));
      onChange(reordered);
    }

    setDraggedPhotoId(null);
    setDragOverPhotoId(null);
  }

  return (
    <div className="bg-surface rounded-card border border-border p-6 space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h2 className="text-sm font-bold text-ink font-mono uppercase tracking-wider flex items-center gap-2">
            <span>Fotos do Produto</span>
            {photos.length > 0 && (
              <span className="text-xs font-normal text-text-muted">
                ({photos.length} {photos.length === 1 ? "foto" : "fotos"})
              </span>
            )}
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Galeria da vitrine da loja. A foto principal e a foto de hover definem
            a experiência no catálogo.
          </p>
        </div>

        {/* Botão de Adicionar Mais */}
        {photos.length > 0 && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
              className="sr-only"
              id="admin-add-more-photos"
            />
            <label
              htmlFor="admin-add-more-photos"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-button bg-surface-alt hover:bg-border text-ink text-xs font-medium cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-magenta min-h-[44px]"
            >
              <Upload className="w-4 h-4 text-magenta shrink-0" />
              <span>Adicionar fotos</span>
            </label>
          </div>
        )}
      </div>

      {/* Caixa de Recomendação e Dicas de Enquadramento 4:5 */}
      <div className="rounded-lg bg-surface-alt/70 border border-border p-3.5 flex items-start gap-3 text-xs text-text">
        <Info className="w-4 h-4 text-ink shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-ink">
            Padrão visual da loja Markah: proporção 4:5 (ex: {RECOMMENDED_WIDTH_PX} × {RECOMMENDED_HEIGHT_PX} px ou superior)
          </p>
          <p className="text-text-muted text-[11px] leading-relaxed">
            Formatos aceitos: <strong>PNG, JPG e JPEG</strong> (até {MAX_IMAGE_FILE_SIZE_BYTES / (1024 * 1024)} MB).
            Fotos enviadas em proporções diferentes são exibidas na moldura 4:5 com corte centralizado na loja — confira a prévia abaixo.
          </p>
        </div>
      </div>

      {/* Área de Upload / Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOverZone(true);
        }}
        onDragLeave={() => setIsDragOverZone(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOverZone(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-card border-2 border-dashed transition-all p-8 text-center flex flex-col items-center justify-center gap-3 ${
          isDragOverZone
            ? "border-magenta bg-magenta/5 scale-[0.99]"
            : "border-border hover:border-text-muted/60 bg-surface-alt/30"
        } ${photos.length === 0 ? "min-h-[220px]" : "py-6"}`}
      >
        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-magenta shadow-subtle">
          <Upload className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-semibold text-ink">
            Arraste fotos para esta área ou escolha do computador
          </p>
          <p className="text-[11px] text-text-muted">
            Selecione múltiplos arquivos PNG, JPG ou JPEG de uma só vez
          </p>
        </div>

        <div>
          <input
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="sr-only"
            id="admin-primary-file-input"
          />
          <label
            htmlFor="admin-primary-file-input"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-button bg-ink hover:bg-black text-white text-xs font-semibold cursor-pointer transition-all shadow-subtle min-h-[44px] min-w-[160px] focus-within:ring-2 focus-within:ring-magenta"
          >
            <Upload className="w-4 h-4" />
            <span>Selecionar arquivos</span>
          </label>
        </div>
      </div>

      {/* Grade de Fotos Cadastradas */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              Arraste os cards ou use as setas para reordenar a galeria:
            </span>
            <span>
              {photos.filter((p) => p.isPrimary).length === 1 ? (
                <span className="text-verde font-medium">✓ Foto principal definida</span>
              ) : (
                <span className="text-red-600 font-medium">⚠️ Defina a foto principal</span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {photos.map((photo, index) => {
              const isFirst = index === 0;
              const isLast = index === photos.length - 1;
              const isUploading = photo.status === "uploading";
              const isError = photo.status === "error";

              return (
                <div
                  key={photo.id}
                  draggable={!isUploading}
                  onDragStart={() => setDraggedPhotoId(photo.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverPhotoId !== photo.id) {
                      setDragOverPhotoId(photo.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverPhotoId === photo.id) setDragOverPhotoId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleCardDrop(photo.id);
                  }}
                  className={`group relative rounded-card border bg-surface flex flex-col overflow-hidden transition-all duration-200 ${
                    photo.isPrimary
                      ? "border-magenta shadow-subtle ring-1 ring-magenta/30"
                      : "border-border hover:border-text-muted"
                  } ${dragOverPhotoId === photo.id ? "scale-[0.98] border-dashed border-magenta" : ""}`}
                >
                  {/* Moldura 4:5 da Imagem com Corte Real da Loja */}
                  <div className="relative aspect-[4/5] w-full bg-surface-alt overflow-hidden">
                    <Image
                      src={photo.url}
                      alt={photo.alt || photo.name || "Foto do produto"}
                      fill
                      unoptimized={photo.url.startsWith("blob:") || photo.url.endsWith(".svg")}
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className={`object-cover transition-transform duration-300 group-hover:scale-102 ${
                        isUploading ? "opacity-40 blur-[1px]" : ""
                      }`}
                    />

                    {/* Barra de Progresso no Upload */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-white z-10">
                        <div className="w-full bg-white/20 rounded-full h-2 mb-2 overflow-hidden">
                          <div
                            className="bg-magenta h-full transition-all duration-200"
                            style={{ width: `${photo.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-medium">
                          Enviando... {photo.progress}%
                        </span>
                      </div>
                    )}

                    {/* Overlay de Erro no Upload */}
                    {isError && (
                      <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center text-white z-10">
                        <AlertTriangle className="w-6 h-6 text-red-400 mb-1 shrink-0" />
                        <span className="text-xs font-semibold text-red-200 line-clamp-2 mb-2">
                          {photo.errorMessage || "Erro no upload."}
                        </span>
                        {photo.file && (
                          <button
                            type="button"
                            onClick={() => retryUpload(photo)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-white text-ink text-xs font-semibold hover:bg-neutral-100 transition-colors min-h-[44px]"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Tentar novamente</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Selos de Status: Principal e Hover */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                      {photo.isPrimary && (
                        <span className="px-2 py-0.5 rounded-md bg-magenta text-white text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-white" />
                          <span>Principal</span>
                        </span>
                      )}

                      {photo.isHover && (
                        <span className="px-2 py-0.5 rounded-md bg-amarelo text-ink text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                          <Sun className="w-3 h-3 text-ink" />
                          <span>Hover / Acesa</span>
                        </span>
                      )}
                    </div>

                    {/* Botão de Excluir Foto (44x44px touch target) */}
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <button
                        type="button"
                        onClick={() => onRemove(photo.id, photo.url)}
                        aria-label={`Remover foto ${photo.name || index + 1}`}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-red-600 text-white transition-all backdrop-blur-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Alerta de proporção não-4:5 */}
                    {photo.isRatioNonStandard && !isUploading && !isError && (
                      <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/75 backdrop-blur-xs text-amarelo text-[10px] font-medium flex items-center gap-1.5 z-10">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          Formato não é 4:5 (corte preview)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Informações e Controles da Foto */}
                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      {/* Nome do arquivo e dimensões */}
                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <span className="font-mono truncate max-w-[140px]" title={photo.name}>
                          {photo.name}
                        </span>
                        {photo.width && photo.height && (
                          <span className="font-mono shrink-0">
                            {photo.width}×{photo.height}
                          </span>
                        )}
                      </div>

                      {/* Campo de Texto Alternativo (Alt) */}
                      <div className="space-y-1">
                        <label
                          htmlFor={`photo-alt-${photo.id}`}
                          className="text-[11px] font-medium text-text block"
                        >
                          Texto alternativo (alt)
                        </label>
                        <input
                          id={`photo-alt-${photo.id}`}
                          type="text"
                          value={photo.alt}
                          onChange={(e) => updateAltText(photo.id, e.target.value)}
                          placeholder="Ex: Foto da luminária desligada"
                          className="w-full h-8 px-2.5 rounded-input border border-border bg-surface text-xs focus:outline-none focus:border-ink"
                        />
                      </div>
                    </div>

                    {/* Botões de Ação: Principal, Hover e Reordenação */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      {/* Botões de Tipo de Foto (Principal / Hover) */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryPhoto(photo.id)}
                          disabled={photo.isPrimary}
                          aria-label={`Definir como foto principal da vitrine`}
                          className={`min-h-[44px] px-2 py-1.5 rounded-button text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta ${
                            photo.isPrimary
                              ? "bg-magenta text-white cursor-default"
                              : "bg-surface-alt hover:bg-border text-ink"
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 shrink-0" />
                          <span>{photo.isPrimary ? "Principal" : "Tornar Princ."}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleHoverPhoto(photo.id)}
                          aria-label={`Alternar foto de hover/iluminada`}
                          className={`min-h-[44px] px-2 py-1.5 rounded-button text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta ${
                            photo.isHover
                              ? "bg-amarelo text-ink font-bold"
                              : "bg-surface-alt hover:bg-border text-ink"
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5 shrink-0" />
                          <span>{photo.isHover ? "Hover Ativo" : "Usar Hover"}</span>
                        </button>
                      </div>

                      {/* Botões de Reordenação Acessível (44x44px touch target) */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-text-muted">
                          Posição {index + 1} de {photos.length}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => movePhoto(index, "left")}
                            disabled={isFirst}
                            aria-label={`Mover foto ${index + 1} para a esquerda`}
                            className="w-11 h-11 flex items-center justify-center rounded-button bg-surface-alt hover:bg-border text-ink disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => movePhoto(index, "right")}
                            disabled={isLast}
                            aria-label={`Mover foto ${index + 1} para a direita`}
                            className="w-11 h-11 flex items-center justify-center rounded-button bg-surface-alt hover:bg-border text-ink disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
