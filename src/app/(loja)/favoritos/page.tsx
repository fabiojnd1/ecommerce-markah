import type { Metadata } from "next";
import { WishlistView } from "@/components/loja/wishlist-view";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Meus Favoritos | Markah Brasil",
  description:
    "Acompanhe suas peças de iluminação e decoração autoral favoritas em impressão 3D na Markah Brasil.",
};

export default async function FavoritosPage() {
  const products = await getProducts();

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
      <WishlistView products={products} />
    </div>
  );
}
