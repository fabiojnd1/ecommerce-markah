import { type OrderStatus } from "@prisma/client";

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  size?: "sm" | "md";
}

export const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando Pagamento",
  PAGO: "Pago",
  EM_PRODUCAO: "Em Produção",
  PRONTO_PARA_ENVIO: "Pronto para Envio",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
  REEMBOLSADO: "Reembolsado",
};

export const STATUS_STYLES: Record<string, string> = {
  // Amarelo
  AGUARDANDO_PAGAMENTO: "bg-amber-50 text-amber-800 border-amber-300",
  // Verde
  PAGO: "bg-emerald-50 text-emerald-700 border-emerald-300",
  // Ciano (impressão 3D ativa)
  EM_PRODUCAO: "bg-cyan-50 text-cyan-800 border-cyan-300",
  // Azul suave
  PRONTO_PARA_ENVIO: "bg-sky-50 text-sky-800 border-sky-300",
  // Violeta
  ENVIADO: "bg-purple-50 text-purple-800 border-purple-300",
  // Verde escuro
  ENTREGUE: "bg-green-100 text-green-900 border-green-400 font-semibold",
  // Cinza
  CANCELADO: "bg-neutral-100 text-neutral-600 border-neutral-300",
  REEMBOLSADO: "bg-neutral-100 text-neutral-600 border-neutral-300",
};

export function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const label = STATUS_LABELS[status] || status;
  const style = STATUS_STYLES[status] || "bg-neutral-100 text-neutral-700 border-neutral-300";

  return (
    <span
      className={`inline-flex items-center border rounded-full font-medium tracking-wide transition-colors ${style} ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 bg-current opacity-70" />
      {label}
    </span>
  );
}
