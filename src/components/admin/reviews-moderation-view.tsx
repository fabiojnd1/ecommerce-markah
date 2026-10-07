"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Check,
} from "lucide-react";
import {
  updateReviewStatusAction,
  deleteReviewAction,
} from "@/server/social-proof-actions";
import type { ReviewRecord } from "@/lib/social-proof-repository";

interface ReviewsModerationViewProps {
  initialReviews: ReviewRecord[];
}

type TabFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export function ReviewsModerationView({
  initialReviews,
}: ReviewsModerationViewProps) {
  const [reviews, setReviews] = useState<ReviewRecord[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Contagens
  const counts = {
    ALL: reviews.length,
    PENDING: reviews.filter((r) => r.status === "PENDING").length,
    APPROVED: reviews.filter((r) => r.status === "APPROVED").length,
    REJECTED: reviews.filter((r) => r.status === "REJECTED").length,
  };

  // Filtragem
  const filteredReviews = reviews.filter((r) => {
    if (activeTab !== "ALL" && r.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProduct = r.productName.toLowerCase().includes(q);
      const matchCustomer = r.customerName.toLowerCase().includes(q);
      const matchComment = r.comment.toLowerCase().includes(q);
      const matchTitle = r.title?.toLowerCase().includes(q);
      return matchProduct || matchCustomer || matchComment || matchTitle;
    }
    return true;
  });

  function handleStatusChange(
    reviewId: string,
    newStatus: "PENDING" | "APPROVED" | "REJECTED"
  ) {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateReviewStatusAction(reviewId, newStatus);
      if (res.success && res.review) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? res.review! : r))
        );
        const statusLabel =
          newStatus === "APPROVED"
            ? "aprovada"
            : newStatus === "REJECTED"
            ? "rejeitada"
            : "marcada como pendente";
        setFeedback({
          type: "success",
          message: `Avaliação ${statusLabel} com sucesso.`,
        });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Erro ao atualizar status da avaliação.",
        });
      }
    });
  }

  function handleDelete(reviewId: string) {
    if (!window.confirm("Deseja realmente excluir permanentemente esta avaliação?")) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await deleteReviewAction(reviewId);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        setFeedback({
          type: "success",
          message: "Avaliação excluída com sucesso.",
        });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Erro ao excluir avaliação.",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">
            Moderação de Avaliações
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Gerencie opiniões de clientes, valide compras verificadas e garanta a integridade da prova social.
          </p>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-verde/10 border-verde/30 text-verde"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border">
        {/* Abas de Status */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-ink text-white"
                : "text-text hover:bg-surface-alt"
            }`}
          >
            <span>Todas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "ALL" ? "bg-white/20 text-white" : "bg-surface-alt text-text-muted"
              }`}
            >
              {counts.ALL}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "PENDING"
                ? "bg-amber-600 text-white"
                : "text-text hover:bg-surface-alt"
            }`}
          >
            <span>Pendentes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "PENDING" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
              }`}
            >
              {counts.PENDING}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("APPROVED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "APPROVED"
                ? "bg-verde text-white"
                : "text-text hover:bg-surface-alt"
            }`}
          >
            <span>Aprovadas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "APPROVED" ? "bg-white/25 text-white" : "bg-verde/15 text-verde"
              }`}
            >
              {counts.APPROVED}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("REJECTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "REJECTED"
                ? "bg-red-600 text-white"
                : "text-text hover:bg-surface-alt"
            }`}
          >
            <span>Rejeitadas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "REJECTED" ? "bg-white/25 text-white" : "bg-red-100 text-red-700"
              }`}
            >
              {counts.REJECTED}
            </span>
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por produto, cliente ou texto..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border text-xs focus:outline-none focus:border-ink bg-surface"
          />
        </div>
      </div>

      {/* Lista / Tabela de Avaliações */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-surface border border-dashed border-border text-text-muted space-y-2">
          <Filter className="w-8 h-8 mx-auto text-text-muted stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-text">
            Nenhuma avaliação encontrada
          </h3>
          <p className="text-xs">
            {searchQuery
              ? "Tente ajustar seus termos de busca."
              : "Não há avaliações neste status no momento."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 rounded-xl border bg-surface transition-all ${
                rev.status === "PENDING"
                  ? "border-amber-300/80 bg-amber-50/20"
                  : rev.status === "REJECTED"
                  ? "border-red-200/80 opacity-75 bg-red-50/10"
                  : "border-border"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Dados Principais */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Badge de Status */}
                    {rev.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-verde bg-verde/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aprovada</span>
                      </span>
                    )}
                    {rev.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        <span>Pendente</span>
                      </span>
                    )}
                    {rev.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <XCircle className="w-3 h-3" />
                        <span>Rejeitada</span>
                      </span>
                    )}

                    {/* Produto */}
                    <Link
                      href={`/produtos/${rev.productSlug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:text-magenta transition-colors"
                    >
                      <span>{rev.productName}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {/* Compra Verificada */}
                    {rev.verifiedPurchase && (
                      <span className="text-[10px] font-bold text-verde bg-verde/10 px-1.5 py-0.2 rounded">
                        Compra Verificada
                      </span>
                    )}
                  </div>

                  {/* Estrelas + Título */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-neutral-200"
                          }`}
                        />
                      ))}
                    </div>
                    {rev.title && (
                      <h4 className="text-sm font-bold text-ink">{rev.title}</h4>
                    )}
                  </div>

                  {/* Comentário */}
                  <p className="text-xs sm:text-sm text-text leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </p>

                  {/* Metadados: Autor, Email, Data */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
                    <span className="font-semibold text-text">
                      {rev.customerName}
                    </span>
                    {rev.customerEmail && (
                      <span className="font-mono">{rev.customerEmail}</span>
                    )}
                    <span className="font-mono">
                      {new Date(rev.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Ações de Moderação */}
                <div className="flex lg:flex-col items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                  {rev.status !== "APPROVED" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleStatusChange(rev.id, "APPROVED")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-verde/15 text-verde hover:bg-verde hover:text-white transition-colors flex items-center gap-1.5 w-full justify-center"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aprovar</span>
                    </button>
                  )}

                  {rev.status !== "REJECTED" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleStatusChange(rev.id, "REJECTED")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-600 hover:text-white transition-colors flex items-center gap-1.5 w-full justify-center"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rejeitar</span>
                    </button>
                  )}

                  {rev.status !== "PENDING" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleStatusChange(rev.id, "PENDING")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:bg-surface-alt transition-colors flex items-center gap-1.5 w-full justify-center"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pendente</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(rev.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Excluir avaliação permanentemente"
                    aria-label="Excluir avaliação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
