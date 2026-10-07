import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders-repository";
import { OrderDetailView } from "@/components/admin/order-detail-view";

interface AdminPedidoDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminPedidoDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return { title: "Pedido Não Encontrado — Admin Markah" };
  }
  return {
    title: `Pedido #${order.orderNumber} — Admin Markah Brasil`,
  };
}

export default async function AdminPedidoDetailPage({
  params,
}: AdminPedidoDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailView initialOrder={order} />;
}
