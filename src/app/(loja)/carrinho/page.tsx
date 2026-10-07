import type { Metadata } from "next";
import { CartPageClient } from "@/components/loja/cart-page-client";

export const metadata: Metadata = {
  title: "Meu Carrinho de Compras | Markah Brasil",
  description:
    "Confira as peças selecionadas, calcule o frete e prazo de produção sob demanda e finalize sua compra com segurança na Markah Brasil.",
};

export default function CarrinhoPage() {
  return <CartPageClient />;
}
