import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina nomes de classes do Tailwind garantindo resolução correta de conflitos.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formata valores monetários em centavos (inteiros) para o padrão BRL (R$ 0,00).
 * Conforme D-011: todo dinheiro em centavos e formatação apenas na exibição.
 */
export function formatCurrency(priceCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}
