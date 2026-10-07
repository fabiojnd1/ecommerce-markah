import type { Metadata } from "next";
import { WishlistView } from "@/components/loja/wishlist-view";

export const metadata: Metadata = {
  title: "Meus Favoritos | Markah Brasil",
  description:
    "Acompanhe suas peças de iluminação e decoração autoral favoritas em impressão 3D na Markah Brasil.",
};

export default function FavoritosPage() {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
      <WishlistView />
    </div>
  );
}
