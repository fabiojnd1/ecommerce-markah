import { requireAdmin } from "@/lib/auth";
import { SEED_COLLECTIONS } from "@/lib/data/catalog-seed";
import { BookmarkCheck } from "lucide-react";

export default async function AdminColecoesPage() {
  await requireAdmin();
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ink font-display">
          Coleções e Vitrines
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Agrupamentos editoriais de produtos destacados na página inicial
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SEED_COLLECTIONS.map((col) => (
          <div
            key={col.id}
            className="bg-surface rounded-card border border-border p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-lg bg-magenta/10 text-magenta flex items-center justify-center">
                <BookmarkCheck className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-bold uppercase">
                /{col.slug}
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-ink">{col.name}</h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {col.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
