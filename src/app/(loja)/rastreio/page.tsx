import { TrackingView } from "@/components/loja/tracking-view";

export const metadata = {
  title: "Rastrear Pedido — Markah Brasil",
  description:
    "Acompanhe em tempo real o ciclo de impressão 3D sob demanda e a entrega do seu pedido Markah Brasil.",
};

interface RastreioPageProps {
  searchParams: Promise<{ codigo?: string }>;
}

export default async function RastreioPage({ searchParams }: RastreioPageProps) {
  const { codigo } = await searchParams;

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-container mx-auto">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted font-mono block mb-2">
          Transparência & Logística
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-display tracking-tight">
          Rastreie seu Pedido
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-2 leading-relaxed">
          Acompanhe cada etapa: da modelagem e impressão 3D sustentável até a postagem e entrega no seu endereço.
        </p>
      </div>

      <TrackingView initialCode={codigo || ""} />
    </div>
  );
}
