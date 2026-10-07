import { getCustomerUser } from "@/lib/auth";
import { listOrdersByCustomerEmail } from "@/lib/orders-repository";
import { CustomerPortal } from "@/components/loja/customer-portal";

export const metadata = {
  title: "Minha Conta — Markah Brasil",
  description: "Acesse seus pedidos e histórico de compras na Markah Brasil.",
};

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const user = await getCustomerUser();
  const orders = user ? await listOrdersByCustomerEmail(user.email) : [];

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-container mx-auto">
      <CustomerPortal
        initialUser={user ? { name: user.name, email: user.email } : null}
        initialOrders={orders}
        linkError={erro === "link-invalido"}
      />
    </div>
  );
}
