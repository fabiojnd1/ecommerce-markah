import { requireAdmin } from "@/lib/auth";
import { listAllCoupons } from "@/lib/promotions-repository";
import { PromotionsManagementView } from "@/components/admin/promotions-management-view";

export const metadata = {
  title: "Promoções & Cupons — Admin Markah Brasil",
};

export default async function AdminPromocoesPage() {
  await requireAdmin();
  const coupons = await listAllCoupons();

  return <PromotionsManagementView initialCoupons={coupons} />;
}
