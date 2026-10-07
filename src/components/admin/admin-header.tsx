"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { logoutAdminAction } from "@/server/admin-actions";

interface AdminHeaderProps {
  userEmail: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAdminAction();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>Painel de Controle</span>
        <span>/</span>
        <span className="text-text font-semibold">Markah Brasil</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Identificação do Usuário */}
        <div className="flex items-center gap-2 text-xs">
          <UserCircle className="w-5 h-5 text-text-muted" />
          <span className="font-semibold text-text hidden sm:inline">
            {userEmail}
          </span>
        </div>

        {/* Botão de Logout */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Encerrar sessão administrativa"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
