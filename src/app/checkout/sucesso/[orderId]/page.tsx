import type { Metadata } from "next";
import Link from "next/link";
import { getOrderById } from "@/lib/orders-repository";
import { OrderSuccessClient } from "@/components/checkout/order-success-client";

export const metadata: Metadata = {
  title: "Pedido Confirmado | Markah Brasil",
  description: "Acompanhe o pagamento e o prazo de produção do seu pedido na Markah Brasil.",
};

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold font-display text-ink">
          Pedido não encontrado
        </h1>
        <p className="text-xs text-text-muted">
          Não conseguimos localizar as informações deste pedido. Se você acabou de finalizar a compra, aguarde alguns instantes.
        </p>
        <Link
          href="/produtos"
          className="inline-block py-2.5 px-6 rounded-full bg-ink text-white text-xs font-semibold"
        >
          Voltar ao Catálogo
        </Link>
      </div>
    );
  }

  return <OrderSuccessClient initialOrder={order} />;
}
