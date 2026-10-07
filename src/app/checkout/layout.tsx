import type { Metadata } from "next";
import { CheckoutHeader } from "@/components/checkout/checkout-header";
import { CartProvider } from "@/lib/cart-context";

export const metadata: Metadata = {
  title: "Checkout Seguro | Markah Brasil",
  description: "Finalize sua compra de luminárias e peças de design 3D com segurança na Markah Brasil.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-bg flex flex-col">
        <CheckoutHeader />
        <main className="flex-1">{children}</main>
        <footer className="py-6 border-t border-border bg-surface text-center text-xs text-text-muted">
          <p>© {new Date().getFullYear()} Markah Brasil. Todos os direitos reservados.</p>
        </footer>
      </div>
    </CartProvider>
  );
}
