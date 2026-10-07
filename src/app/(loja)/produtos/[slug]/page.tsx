import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { listProductReviews, getProductRatingStats } from "@/lib/social-proof-repository";
import { ProductDetailsClient } from "@/components/loja/product-details-client";
import { ProductReviewsSection } from "@/components/loja/product-reviews-section";
import { ProductGrid } from "@/components/loja/product-grid";
import { JsonLd } from "@/components/loja/json-ld";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produto não encontrado",
    };
  }

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  return {
    title: `${product.name} — Markah Brasil`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [
        {
          url: primaryImage.url,
          width: 800,
          height: 1000,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, reviews, ratingStats] = await Promise.all([
    getRelatedProducts(product.id, 4),
    listProductReviews(product.slug),
    getProductRatingStats(product.slug),
  ]);

  const primaryVariant = product.variants[0];
  const priceReais = (primaryVariant.priceCents / 100).toFixed(2);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://markah.com.br";

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) =>
      img.url.startsWith("http") ? img.url : `${baseUrl}${img.url}`
    ),
    sku: primaryVariant.sku,
    brand: {
      "@type": "Brand",
      name: "Markah Brasil",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/produtos/${product.slug}`,
      priceCurrency: "BRL",
      price: priceReais,
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Markah Brasil",
      },
    },
  };

  if (ratingStats.totalReviews > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingStats.average,
      reviewCount: ratingStats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Produtos",
        item: `${baseUrl}/produtos`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.categorySlug.replace(/-/g, " "),
        item: `${baseUrl}/${product.categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `${baseUrl}/produtos/${product.slug}`,
      },
    ],
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <JsonLd schema={productSchema} />
      <JsonLd schema={breadcrumbSchema} />
      {/* Breadcrumbs de Navegação */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-text-muted mb-6 overflow-x-auto whitespace-nowrap"
      >
        <Link href="/" className="hover:text-ink transition-colors">
          Início
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href="/produtos" className="hover:text-ink transition-colors">
          Produtos
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link
          href={`/${product.categorySlug}`}
          className="hover:text-ink transition-colors capitalize"
        >
          {product.categorySlug.replace(/-/g, " ")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-text font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Conteúdo Principal do Produto */}
      <ProductDetailsClient product={product} />

      {/* Avaliações de Clientes */}
      <ProductReviewsSection
        productSlug={product.slug}
        productName={product.name}
        initialReviews={reviews}
        initialStats={ratingStats}
      />

      {/* Produtos Relacionados */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 sm:mt-24 pt-12 border-t border-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted font-mono">
                Combine e decore
              </span>
              <h2 className="text-2xl font-bold text-ink font-display mt-1">
                Você também pode gostar
              </h2>
            </div>
            <Link
              href="/produtos"
              className="text-xs sm:text-sm font-semibold text-text hover:text-magenta transition-colors"
            >
              Ver todas as peças →
            </Link>
          </div>

          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
