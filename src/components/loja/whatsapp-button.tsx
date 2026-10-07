"use client";

import { usePathname } from "next/navigation";
import { WHATSAPP_NUMBER } from "@/lib/site-config";

import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppButton({
  phoneNumber = WHATSAPP_NUMBER,
  defaultMessage = "Olá! Gostaria de tirar uma dúvida sobre as peças da Markah Brasil.",
}: WhatsAppButtonProps) {
  const pathname = usePathname();
  const browsePaths = [
    "/",
    "/produtos",
    "/lancamentos",
    "/mais-vendidos",
    "/favoritos",
    "/luminarias-de-mesa",
    "/pendentes",
    "/vasos",
    "/cachepos",
    "/plantarios",
    "/organizadores",
  ];
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    defaultMessage
  )}`;

  // Keep the floating contact control clear of product grids and purchase actions.
  if (
    browsePaths.includes(pathname) ||
    pathname.startsWith("/produtos/") ||
    pathname === "/carrinho"
  ) return null;

  return (
    <aside aria-label="Atendimento via WhatsApp">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Atendimento via WhatsApp"
        className="fixed bottom-6 right-4 sm:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-[1.08] hover:shadow-xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366] group"
      >
        {/* Efeito de pulso suave */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping -z-10 group-hover:hidden" />

        <MessageCircle className="w-7 h-7 fill-current stroke-none" />

        {/* Tooltip no desktop */}
        <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-ink text-white text-xs font-semibold rounded-lg shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap hidden sm:block">
          Fale Conosco
        </span>
      </a>
    </aside>
  );
}
