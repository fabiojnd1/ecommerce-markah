import { BenefitBar } from "@/components/loja/benefit-bar";
import { Header } from "@/components/loja/header";
import { Footer } from "@/components/loja/footer";
import { WhatsAppButton } from "@/components/loja/whatsapp-button";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CartDrawer } from "@/components/loja/cart-drawer";
import { CookieConsentBanner } from "@/components/loja/cookie-consent-banner";

export default function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WishlistProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <BenefitBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
          <CartDrawer />
          <CookieConsentBanner />
        </div>
      </CartProvider>
    </WishlistProvider>
  );
}
