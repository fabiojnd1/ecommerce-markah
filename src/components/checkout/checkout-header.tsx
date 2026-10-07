import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";

export function CheckoutHeader() {
  return (
    <header className="w-full bg-surface border-b border-border py-4 px-4 sm:px-8">
      <div className="max-w-container mx-auto flex items-center justify-between">
        {/* Logotipo Oficial Markah Brasil */}
        <Link href="/" className="inline-flex items-center gap-2 group">
          <Image
            src="/brand/markah-logo.png"
            alt="Markah Brasil"
            width={89}
            height={44}
            className="h-10 sm:h-11 w-auto"
            priority
          />
        </Link>

        {/* Selo de Segurança e Criptografia */}
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted bg-surface-alt/70 px-3 py-1.5 rounded-full border border-border">
          <Lock className="w-3.5 h-3.5 text-verde" />
          <span className="hidden sm:inline">Checkout Seguro</span>
          <span className="text-[11px] font-mono text-verde font-bold">SSL 256-bit</span>
        </div>
      </div>
    </header>
  );
}
