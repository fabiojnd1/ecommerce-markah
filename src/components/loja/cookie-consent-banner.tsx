"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "markah_cookie_consent";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se já houve escolha prévia
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    const hasCookie = document.cookie.includes(`${COOKIE_CONSENT_KEY}=`);

    if (!stored && !hasCookie) {
      // Pequeno delay para entrada suave após o carregamento da página
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAcceptAll() {
    saveConsent("all");
  }

  function handleAcceptEssential() {
    saveConsent("essential");
  }

  function saveConsent(type: "all" | "essential") {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, type);
      // Cookie de 365 dias
      const maxAge = 365 * 24 * 60 * 60;
      document.cookie = `${COOKIE_CONSENT_KEY}=${type}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch {
      // Fallback
    }
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Consentimento de Cookies e Privacidade"
      className="fixed bottom-4 inset-x-4 sm:bottom-6 sm:right-6 sm:left-auto z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-5 sm:p-6 rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-2xl space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-magenta/10 text-magenta flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 flex-1 pr-1">
            <h3 className="text-sm font-display font-bold text-ink">
              Privacidade & Cookies (LGPD)
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Utilizamos cookies essenciais para o carrinho, cálculo de frete e para lembrar seus itens favoritos. Respeitamos a sua privacidade conforme a Lei Geral de Proteção de Dados (LGPD).
            </p>
          </div>

          <button
            type="button"
            onClick={handleAcceptEssential}
            aria-label="Fechar e aceitar essenciais"
            className="flex h-11 w-11 shrink-0 items-center justify-center text-text-muted hover:text-ink rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1 border-t border-border">
          <Link
            href="/privacidade"
            className="inline-flex min-h-11 items-center px-2 text-xs text-text-muted hover:text-ink underline self-center sm:self-auto sm:mr-auto"
          >
            Ler Política de Privacidade
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAcceptEssential}
            className="min-h-11 text-xs font-semibold"
          >
            Apenas Essenciais
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAcceptAll}
            className="min-h-11 text-xs font-semibold"
          >
            Aceitar Todos
          </Button>
        </div>
      </div>
    </aside>
  );
}
