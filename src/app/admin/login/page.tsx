"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginAdminAction } from "@/server/admin-actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginAdminAction(formData);
      if (res.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error || "Falha na autenticação.");
      }
    } catch {
      setError("Erro inesperado ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-surface rounded-card border border-border p-8 shadow-hover">
        {/* Topo: Logo Markah */}
        <div className="text-center mb-8">
          <div className="inline-block p-1 mb-2">
            <Image
              src="/brand/markah-logo.png"
              alt="Markah Brasil"
              width={129}
              height={64}
              className="h-16 w-auto mx-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-ink font-display mt-2">
            Painel Administrativo
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Área restrita para gestão de catálogo e configurações da loja
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-text uppercase tracking-wider font-mono block"
            >
              E-mail Administrativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue="admin@markah.com.br"
                className="w-full h-11 pl-10 pr-4 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-text uppercase tracking-wider font-mono block"
            >
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="markah2026"
                className="w-full h-11 pl-10 pr-4 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full gap-2 text-sm font-semibold"
            >
              <span>Acessar Painel</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Dica de Desenvolvimento */}
        <div className="mt-6 pt-6 border-t border-border/60 text-center text-xs text-text-muted">
          <div className="inline-flex items-center gap-1.5 text-verde font-medium mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Ambiente seguro de autenticação (P-007)</span>
          </div>
          <p className="text-[11px] text-text-muted">
            Credenciais padrão: <code className="text-text font-mono">admin@markah.com.br</code> / <code className="text-text font-mono">markah2026</code>
          </p>
        </div>
      </div>
    </div>
  );
}
