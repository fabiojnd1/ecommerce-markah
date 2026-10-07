"use client";

import { useState, useTransition } from "react";
import { Star, CheckCircle2, MessageSquarePlus, ThumbsUp, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  submitProductReviewAction,
  type SubmitReviewInput,
} from "@/server/social-proof-actions";
import type { ReviewRecord, ProductRatingStats } from "@/lib/social-proof-repository";

interface ProductReviewsSectionProps {
  productSlug: string;
  productName: string;
  initialReviews: ReviewRecord[];
  initialStats: ProductRatingStats;
}

const STAR_LABELS: Record<number, string> = {
  1: "Muito insatisfeito",
  2: "Poderia ser melhor",
  3: "Bom",
  4: "Muito bom",
  5: "Excelente! Adorei a peça",
};

export function ProductReviewsSection({
  productSlug,
  productName,
  initialReviews,
  initialStats,
}: ProductReviewsSectionProps) {
  const [reviews] = useState<ReviewRecord[]>(initialReviews);
  const [stats] = useState<ProductRatingStats>(initialStats);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("Por favor, preencha seu nome (mínimo 2 caracteres).");
      return;
    }

    if (!comment.trim() || comment.trim().length < 8) {
      setErrorMessage("Por favor, deixe um comentário com pelo menos 8 caracteres.");
      return;
    }

    const payload: SubmitReviewInput = {
      productSlug,
      productName,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim(),
    };

    startTransition(async () => {
      const res = await submitProductReviewAction(payload);
      if (res.success && res.review) {
        setSuccessMessage(res.message || "Avaliação enviada com sucesso!");
        // A avaliação entra como PENDENTE e só aparece após aprovação no admin (PRD §7.3)

        // Limpa o form após breve intervalo
        setTimeout(() => {
          setIsFormOpen(false);
          setCustomerName("");
          setCustomerEmail("");
          setTitle("");
          setComment("");
          setSuccessMessage(null);
        }, 4000);
      } else {
        setErrorMessage(res.error || "Ocorreu um erro ao enviar sua avaliação.");
      }
    });
  }

  const activeStar = hoverRating || rating;

  return (
    <section className="py-12 border-t border-border mt-16" id="avaliacoes">
      <div className="space-y-8">
        {/* Cabeçalho da seção */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-magenta font-mono">
              Opiniões Reais
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink mt-1">
              Avaliações de Clientes
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Veja a opinião de quem já transformou seu espaço com as peças Markah.
            </p>
          </div>

          {!isFormOpen && (
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsFormOpen(true)}
              className="gap-2 self-start sm:self-auto border-magenta/30 text-magenta hover:bg-magenta/5"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Avaliar este produto</span>
            </Button>
          )}
        </div>

        {/* Resumo Numérico + Barras de Distribuição */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-8 rounded-2xl bg-surface-alt/70 border border-border">
          {/* Média e Recomendação */}
          <div className="md:col-span-4 flex flex-col justify-center items-center md:items-start text-center md:text-left md:border-r md:border-border md:pr-8 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-display font-extrabold text-ink tracking-tight">
                {stats.totalReviews > 0 ? stats.average.toFixed(1) : "5.0"}
              </span>
              <span className="text-lg font-medium text-text-muted">/ 5.0</span>
            </div>

            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(stats.average)
                      ? "fill-amber-400 text-amber-400"
                      : "text-neutral-300"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-text-muted">
              Com base em {stats.totalReviews}{" "}
              {stats.totalReviews === 1 ? "avaliação" : "avaliações"}
            </p>

            {stats.totalReviews > 0 && (
              <div className="inline-flex items-center gap-1.5 pt-2 text-xs font-semibold text-verde">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{stats.recommendationPercentage}% recomendam este produto</span>
              </div>
            )}
          </div>

          {/* Barras de Distribuição de Estrelas */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.distribution[stars] || 0;
              const percentage =
                stats.totalReviews > 0
                  ? Math.round((count / stats.totalReviews) * 100)
                  : 0;

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 font-medium text-text justify-end shrink-0">
                    <span>{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-10 text-right text-text-muted font-mono shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formulário Retrátil de Avaliação */}
        {isFormOpen && (
          <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-magenta/30 shadow-card animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-magenta" />
                <h3 className="text-lg font-display font-bold text-ink">
                  Sua Avaliação sobre {productName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-full text-text-muted hover:text-ink hover:bg-surface-alt transition-colors"
                aria-label="Fechar formulário"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMessage ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-verde/15 flex items-center justify-center text-verde">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-ink">
                  {successMessage}
                </h4>
                <p className="text-xs text-text-muted">
                  Obrigado por ajudar a comunidade Markah a escolher com confiança!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 pt-4">
                {/* Seleção de Estrelas Interativa */}
                <div>
                  <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                    Sua Nota *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 rounded-md hover:bg-amber-50 transition-colors"
                          aria-label={`${starValue} de 5 estrelas`}
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              starValue <= activeStar
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-text-muted ml-2">
                      {STAR_LABELS[activeStar]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Mariana Silva"
                      className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-ink bg-surface"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                      E-mail (opcional)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Ex: mariana@exemplo.com"
                      className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-ink bg-surface"
                    />
                  </div>
                </div>

                {/* Título opcional */}
                <div>
                  <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                    Título da Avaliação (opcional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Iluminação incrível e design impecável!"
                    className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-ink bg-surface"
                  />
                </div>

                {/* Comentário */}
                <div>
                  <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                    Seu Comentário *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Conte o que achou da peça, da qualidade da impressão 3D, da iluminação ou da embalagem..."
                    className="w-full p-3 rounded-lg border border-border text-sm focus:outline-none focus:border-ink bg-surface resize-none"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-500 font-medium">
                    {errorMessage}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="default"
                    disabled={isPending}
                    className="gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Publicar Avaliação</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Lista de Avaliações */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-surface border border-dashed border-border text-text-muted">
              <p className="text-sm">
                Seja a primeira pessoa a avaliar a peça {productName}!
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <article
                key={rev.id}
                className="p-5 sm:p-6 rounded-xl bg-surface border border-border space-y-3 transition-colors hover:border-neutral-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-magenta/10 text-magenta font-bold flex items-center justify-center text-xs font-mono">
                      {rev.customerName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {rev.customerName}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-verde bg-verde/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Compra Verificada</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-text-muted font-mono">
                    {new Date(rev.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Estrelas */}
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= rev.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-neutral-200"
                      }`}
                    />
                  ))}
                </div>

                {/* Título e Comentário */}
                {rev.title && (
                  <h4 className="text-sm font-bold text-ink">{rev.title}</h4>
                )}
                <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
