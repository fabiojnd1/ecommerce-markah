"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProductAction } from "@/server/admin-actions";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        `Tem certeza que deseja excluir "${productName}" do catálogo?\n\nEsta alteração será salva imediatamente no banco de dados.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteProductAction(productId);
      if (res && !res.success) {
        alert(res.error || "Não foi possível excluir o produto.");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      title="Excluir produto permanentemente"
      className="p-1.5 rounded hover:bg-red-50 text-text-muted hover:text-red-600 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
