import { requireAdmin } from "@/lib/auth";
import { listAllReviews } from "@/lib/social-proof-repository";
import { ReviewsModerationView } from "@/components/admin/reviews-moderation-view";

export const metadata = {
  title: "Moderação de Avaliações — Admin Markah Brasil",
};

export default async function AdminAvaliacoesPage() {
  await requireAdmin();
  const reviews = await listAllReviews();

  return (
    <div className="max-w-6xl mx-auto">
      <ReviewsModerationView initialReviews={reviews} />
    </div>
  );
}
