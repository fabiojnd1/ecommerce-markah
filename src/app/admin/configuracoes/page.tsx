import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings-repository";
import { AdminConfiguracoesForm } from "./settings-form";

export const metadata = {
  title: "Configurações da Loja | Admin Markah",
};

export default async function AdminConfiguracoesPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return <AdminConfiguracoesForm initialSettings={settings} />;
}
