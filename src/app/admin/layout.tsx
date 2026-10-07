import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

// Painel sempre renderizado sob demanda (nunca estático): dados privados e sessão.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Se não estiver autenticado como ADMIN, permite renderizar apenas a tela de login
  // Caso contrário, redireciona para /admin/login
  if (!user || user.role !== "ADMIN") {
    // Permitir páginas públicas de auth dentro de /admin (como /admin/login)
    return <div className="min-h-screen bg-surface-alt">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-surface-alt flex">
      {/* Barra Lateral Funcional */}
      <AdminSidebar />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader userEmail={user.email} />
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
