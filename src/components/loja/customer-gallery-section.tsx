import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { GalleryPostRecord } from "@/lib/social-proof-repository";

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={`${className} fill-none stroke-current stroke-2`}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface CustomerGallerySectionProps {
  posts: GalleryPostRecord[];
}

export function CustomerGallerySection({ posts }: CustomerGallerySectionProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-magenta/10 text-magenta text-xs font-semibold uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comunidade Markah</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink mt-2 font-display">
            Markah em Casa
          </h2>
          <p className="text-sm text-text-muted mt-1 max-w-xl">
            Inspire-se em como nossos clientes decoram, iluminam e dão personalidade aos seus lares com peças autorais em impressão 3D.
          </p>
        </div>

        <a
          href="https://instagram.com/markah_br"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 text-xs sm:text-sm font-semibold text-magenta hover:opacity-80 transition-opacity self-start sm:self-auto py-1.5 px-3 rounded-full bg-surface-alt border border-border"
        >
          <InstagramIcon className="w-4 h-4" />
          <span>Marque @markah_br</span>
        </a>
      </div>

      {/* Grid de Fotos de Clientes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {posts.slice(0, 4).map((post) => (
          <article
            key={post.id}
            className="group relative aspect-square sm:aspect-[4/5] rounded-2xl overflow-hidden bg-surface-alt border border-border shadow-subtle hover:shadow-card transition-all duration-300"
          >
            <Image
              src={post.imageUrl}
              alt={post.caption || `Ambiente de ${post.customerName}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Overlay em Gradiente com dados do Cliente */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity flex flex-col justify-end p-4 text-white">
              {post.customerInstagram && (
                <div className="inline-flex items-center gap-1 text-[11px] font-mono text-white/80">
                  <InstagramIcon className="w-3 h-3" />
                  <span>{post.customerInstagram}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm font-semibold line-clamp-1 mt-0.5">
                {post.customerName}
              </p>

              {post.caption && (
                <p className="text-[11px] text-white/70 line-clamp-2 mt-1 leading-snug">
                  &ldquo;{post.caption}&rdquo;
                </p>
              )}

              {post.productSlug && (
                <div className="mt-3 pt-2 border-t border-white/20">
                  <Link
                    href={`/produtos/${post.productSlug}`}
                    className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-white hover:text-white/85 bg-white/20 hover:bg-white/30 backdrop-blur-xs px-2.5 py-1 rounded-md transition-colors w-full justify-between"
                  >
                    <span className="truncate">{post.productName || "Ver Peça"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
