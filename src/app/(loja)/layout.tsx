import { BenefitBar } from "@/components/loja/benefit-bar";
import { Header } from "@/components/loja/header";
import { Footer } from "@/components/loja/footer";
import { WhatsAppButton } from "@/components/loja/whatsapp-button";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CartDrawer } from "@/components/loja/cart-drawer";
import { CookieConsentBanner } from "@/components/loja/cookie-consent-banner";
import { getStoreSettings } from "@/lib/settings-repository";
import { StoreSettingsProvider } from "@/lib/store-settings-context";

export default async function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings();

  return (
    <StoreSettingsProvider settings={settings}>
      <WishlistProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <BenefitBar />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer
              whatsappNumber={settings.whatsappNumber}
              instagramHandle={settings.instagramHandle}
              pixDiscountPercent={settings.pixDiscountPercent}
              maxInstallmentsFree={settings.maxInstallmentsFree}
              freeShippingThresholdCents={settings.freeShippingThresholdCents}
            />
            <WhatsAppButton phoneNumber={settings.whatsappNumber} />
            <CartDrawer />
            <CookieConsentBanner />
          </div>
        </CartProvider>
      </WishlistProvider>
    </StoreSettingsProvider>
  );
}
