import Image from "next/image";
import { WHATSAPP_NUMBER } from "@/lib/site-config";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, PackageCheck, Palette, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/loja/product-card";
import { CustomerGallerySection } from "@/components/loja/customer-gallery-section";
import { getProducts, getCategories } from "@/lib/catalog";
import { listGalleryPosts } from "@/lib/social-proof-repository";

export const dynamic = "force-dynamic";

const categoryImages: Record<string, { src: string; alt: string }> = {
  "luminarias-de-mesa": { src: "/products/luminaria-saturno-off.svg", alt: "Luminária Saturno em terracota" },
  pendentes: { src: "/products/pendente-origami-off.svg", alt: "Pendente Origami" },
  vasos: { src: "/products/vaso-facetado-hera-1.svg", alt: "Vaso facetado Hera" },
  cachepos: { src: "/products/cachepo-torus-1.svg", alt: "Cachepô Torus" },
  plantarios: { src: "/products/plantario-oasis-1.svg", alt: "Plantário Oasis" },
  organizadores: { src: "/products/organizador-wave-1.svg", alt: "Organizador Wave" },
};

export default async function HomePage() {
  const [categories, lancamentos, maisVendidos, galleryPosts] = await Promise.all([
    getCategories(),
    getProducts({ collectionSlug: "lancamentos", limit: 4 }),
    getProducts({ collectionSlug: "mais-vendidos", limit: 4 }),
    listGalleryPosts(true),
  ]);

  return (
    <div className="pb-16 md:pb-20">
      {/* Hero editorial */}
      <section className="relative overflow-hidden border-b border-border bg-[#F5F0E9]">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
        <div className="max-w-container mx-auto grid items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-8 lg:py-14">
          <div className="relative z-10 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-text shadow-subtle">
              <span className="h-2 w-2 rounded-full bg-magenta" />
              Design autoral impresso em 3D
            </div>

            <div className="space-y-4">
              <h1 className="max-w-[620px] font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[54px]">
                Design autoral, feito camada por camada.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-text-muted sm:text-lg">
                Peças impressas em 3D no Brasil para iluminar sua casa e deixar cada ambiente com a sua cara.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/produtos">
                <Button variant="primary" size="lg" className="gap-2">
                  Explorar peças <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sobre">
                <Button variant="outline" size="lg">Conheça a Markah</Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs font-medium text-text-muted sm:text-sm">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-verde" />Produzido no Brasil</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-verde" />Feito sob encomenda</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-verde" />Design autoral</span>
            </div>
          </div>

          <div className="relative aspect-[1024/764] w-full overflow-hidden rounded-2xl bg-[#24211E] shadow-hover">
            <Image
              src="/hero-banner.webp"
              alt="Luminária de mesa Markah com iluminação acolhedora e design autoral impresso em 3D"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <div className="space-y-12 pt-10 md:space-y-24 md:pt-16">
        {/* Categorias visuais */}
        <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Encontre a peça certa</span>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">Explore por categoria</h2>
            </div>
            <Link href="/produtos" className="inline-flex items-center gap-1 text-sm font-semibold text-text hover:text-magenta">
              Ver catálogo completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
            {categories.map((cat) => {
              const visual = categoryImages[cat.slug];
              return (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  className="group overflow-hidden rounded-card border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-offset-4"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface-alt">
                    {visual ? (
                      <Image src={visual.src} alt={visual.alt} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-magenta"><Sparkles className="h-8 w-8" /></div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
                    <h3 className="font-display text-sm font-semibold text-ink sm:text-base">{cat.name}</h3>
                    <ArrowRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-magenta" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Lançamentos */}
        {lancamentos.length > 0 && (
          <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-magenta">Recém saídos da impressora</span>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">Novidades para sua casa</h2>
              </div>
              <Link href="/lancamentos" className="inline-flex items-center gap-1 text-sm font-semibold text-text hover:text-magenta">
                Ver todos os lançamentos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {lancamentos.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}

        {/* Personalização */}
        <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative grid overflow-hidden rounded-2xl bg-ink text-white lg:grid-cols-[1fr_0.8fr]">
            <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-violeta/25 blur-3xl" />
            <div className="relative z-10 space-y-5 p-7 sm:p-10 lg:p-14">
              <span className="inline-flex items-center gap-2 rounded-full bg-violeta px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5" /> Feito para você
              </span>
              <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl">Uma ideia sua pode virar uma peça única.</h2>
              <p className="max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                Criamos letras-caixa, logotipos e letreiros em 3D sob medida para marcas, eventos e espaços especiais.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/letras-caixa"><Button variant="primary" className="gap-2 border-0 bg-violeta text-white hover:bg-violeta/90">Peça um orçamento <ArrowRight className="h-4 w-4" /></Button></Link>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Gostaria%20de%20um%20or%C3%A7amento%20de%20letras-caixa.`} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="border-white/30 text-white hover:bg-white/10">Fale com a gente</Button>
                </a>
              </div>
            </div>
            <div className="relative min-h-[230px] overflow-hidden bg-gradient-to-br from-violeta/35 via-ink to-[#28212b] lg:min-h-full">
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                <div className="max-w-xs space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white"><Sparkles className="h-7 w-7" /></div>
                  <p className="font-display text-2xl font-semibold">Sua marca em 3D</p>
                  <p className="text-sm leading-relaxed text-white/70">Forma, cor e iluminação pensadas para o seu projeto.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mais vendidos */}
        {maisVendidos.length > 0 && (
          <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-laranja">Escolhas de quem já levou Markah para casa</span>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">Mais queridos pelos clientes</h2>
              </div>
              <Link href="/mais-vendidos" className="inline-flex items-center gap-1 text-sm font-semibold text-text hover:text-laranja">
                Ver mais favoritos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {maisVendidos.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}

        {/* Prova social */}
        <CustomerGallerySection posts={galleryPosts} />

        {/* Como fazemos */}
        <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-verde">Design encontra tecnologia</span>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">Feita com cuidado, do primeiro desenho ao acabamento.</h2>
              <p className="mt-4 text-sm leading-relaxed text-text-muted sm:text-base">
                Cada peça é modelada e impressa sob demanda no Brasil. Assim, cuidamos dos detalhes e produzimos somente o que vai encontrar um lugar especial na sua casa.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-alt/70 p-5 text-center">
                <Palette className="mx-auto h-6 w-6 text-magenta" />
                <h3 className="mt-3 font-display font-semibold text-ink">Design autoral</h3>
                <p className="mt-1 text-sm text-text-muted">Formas pensadas para trazer personalidade ao ambiente.</p>
              </div>
              <div className="rounded-xl bg-surface-alt/70 p-5 text-center">
                <Printer className="mx-auto h-6 w-6 text-ciano" />
                <h3 className="mt-3 font-display font-semibold text-ink">Impressão 3D</h3>
                <p className="mt-1 text-sm text-text-muted">Tecnologia e atenção em cada camada da peça.</p>
              </div>
              <div className="rounded-xl bg-surface-alt/70 p-5 text-center">
                <PackageCheck className="mx-auto h-6 w-6 text-verde" />
                <h3 className="mt-3 font-display font-semibold text-ink">Feita sob encomenda</h3>
                <p className="mt-1 text-sm text-text-muted">Produção cuidadosa, com prazo informado na compra.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
