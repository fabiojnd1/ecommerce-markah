"use client";
import { useStoreSettings } from "@/lib/store-settings-context";

import { WHATSAPP_NUMBER } from "@/lib/site-config";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Truck,
  Printer,
  CheckCircle2,
  Clock,
  Package,
  Copy,
  Check,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  QrCode,
} from "lucide-react";
import {
  trackOrderPublicAction,
  type PublicTrackingResult,
} from "@/server/tracking-actions";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatCents } from "@/lib/pricing";

interface TrackingViewProps {
  initialCode?: string;
}

const TRACKING_STEPS = [
  { key: "CRIADO", label: "Pedido Recebido", icon: Clock },
  { key: "PAGO", label: "Pagamento Aprovado", icon: CheckCircle2 },
  { key: "EM_PRODUCAO", label: "Em ProduÃ§Ã£o 3D", icon: Printer },
  { key: "PRONTO_PARA_ENVIO", label: "Pronto p/ Envio", icon: Package },
  { key: "ENVIADO", label: "Em TrÃ¢nsito", icon: Truck },
  { key: "ENTREGUE", label: "Entregue", icon: CheckCircle2 },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "AGUARDANDO_PAGAMENTO":
      return 0;
    case "PAGO":
      return 1;
    case "EM_PRODUCAO":
      return 2;
    case "PRONTO_PARA_ENVIO":
      return 3;
    case "ENVIADO":
      return 4;
    case "ENTREGUE":
      return 5;
    default:
      return 0;
  }
}

export function TrackingView({ initialCode = "" }: TrackingViewProps) {
  const storeSettings = useStoreSettings();
  const activeWhatsapp = storeSettings.whatsappNumber || WHATSAPP_NUMBER;
  const [orderNumber, setOrderNumber] = useState(initialCode);
  const [verificationKey, setVerificationKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<PublicTrackingResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setOrderNumber(initialCode);
    }
  }, [initialCode]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !verificationKey.trim()) {
      setError("Preencha o nÃºmero do pedido e o e-mail ou CPF da compra.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await trackOrderPublicAction(orderNumber, verificationKey);
    setLoading(false);

    if (res.success && res.data) {
      setTrackingData(res.data);
    } else {
      setError(res.error || "Pedido nÃ£o encontrado.");
      setTrackingData(null);
    }
  }

  function handleCopyTracking() {
    if (!trackingData?.trackingCode) return;
    navigator.clipboard.writeText(trackingData.trackingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyPix() {
    if (!trackingData?.pixQrCode) return;
    navigator.clipboard.writeText(trackingData.pixQrCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  }

  const currentStep = trackingData ? getStepIndex(trackingData.status) : 0;
  const isCanceled = trackingData?.status === "CANCELADO" || trackingData?.status === "REEMBOLSADO";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* FormulÃ¡rio de Busca */}
      <div className="bg-surface rounded-card border border-border p-6 sm:p-8 shadow-subtle">
        <h2 className="text-base font-bold text-ink mb-1 font-display">
          Localize seu pedido
        </h2>
        <p className="text-xs text-text-muted mb-6">
          Insira o nÃºmero do seu pedido e o e-mail ou CPF cadastrado no momento da compra.
        </p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="orderNumberInput"
                className="block text-xs font-semibold text-text mb-1.5"
              >
                NÃºmero do Pedido
              </label>
              <input
                id="orderNumberInput"
                type="text"
                placeholder="Ex: MKB-10025"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border bg-surface font-mono uppercase focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink placeholder:text-text-muted"
                required
              />
            </div>

            <div>
              <label
                htmlFor="verificationKeyInput"
                className="block text-xs font-semibold text-text mb-1.5"
              >
                E-mail ou CPF do Comprador
              </label>
              <input
                id="verificationKeyInput"
                type="text"
                placeholder="seu.email@exemplo.com ou CPF"
                value={verificationKey}
                onChange={(e) => setVerificationKey(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink placeholder:text-text-muted"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 w-full sm:w-auto shadow-subtle"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? "Localizando..." : "Rastrear Pedido"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Resultado do Rastreamento */}
      {trackingData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Card Principal de Status */}
          <div className="bg-surface rounded-card border border-border p-6 sm:p-8 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-bold font-mono text-ink">
                    #{trackingData.orderNumber}
                  </h3>
                  <OrderStatusBadge status={trackingData.status} />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  OlÃ¡, <strong>{trackingData.customerFirstName}</strong>! Acompanhe o ciclo de fabricaÃ§Ã£o e despacho das suas peÃ§as.
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-[11px] text-text-muted block">
                  Destino
                </span>
                <span className="text-xs font-semibold text-text">
                  {trackingData.shippingCity}/{trackingData.shippingState}
                </span>
              </div>
            </div>

            {/* Stepper / Timeline do Pedido */}
            {isCanceled ? (
              <div className="p-4 rounded-lg bg-neutral-100 text-neutral-700 text-xs">
                Este pedido foi cancelado ou reembolsado. Em caso de dÃºvidas, contate nosso suporte.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {TRACKING_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isPassed = currentStep >= idx;
                    const isCurrent = currentStep === idx;

                    return (
                      <div
                        key={step.key}
                        className={`flex flex-col items-center text-center p-3 rounded-lg border transition-all ${
                          isCurrent
                            ? "bg-ink text-white border-ink shadow-sm"
                            : isPassed
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-surface-alt/40 border-border text-text-muted"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mb-1.5 ${
                            isCurrent
                              ? "text-white"
                              : isPassed
                              ? "text-emerald-600"
                              : "text-text-muted/50"
                          }`}
                        />
                        <span className="text-[10px] font-semibold leading-tight">
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-surface-alt/50 rounded-lg border border-border text-xs text-text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong>Prazos:</strong> {trackingData.productionDays} dias de produÃ§Ã£o 3D + {trackingData.carrierDays} dias de frete ({trackingData.shippingCarrier})
                  </div>
                  <div className="text-ink font-semibold">
                    Prazo total estimado: {trackingData.totalDeliveryDays} dias Ãºteis
                  </div>
                </div>
              </div>
            )}

            {/* CÃ³digo de Rastreamento (se despachado) */}
            {trackingData.trackingCode && (
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-purple-700 font-bold block">
                      CÃ³digo de Rastreamento ({trackingData.shippingCarrier})
                    </span>
                    <span className="text-xl font-bold font-mono text-purple-950 tracking-wider">
                      {trackingData.trackingCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyTracking}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-xs font-semibold text-purple-900 hover:bg-purple-100 transition-colors shadow-xs"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-purple-700" />
                          <span>Copiar CÃ³digo</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`https://rastreamento.correios.com.br/app/index.php?codigo=${trackingData.trackingCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition-colors shadow-xs"
                    >
                      <span>Rastrear na Transportadora</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Aviso quando em ProduÃ§Ã£o 3D */}
            {trackingData.status === "EM_PRODUCAO" && (
              <div className="p-4 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-950 text-xs leading-relaxed flex items-start gap-3">
                <Printer className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-1">
                    Suas peÃ§as estÃ£o sendo impressas em 3D!
                  </h4>
                  <p className="text-cyan-900/80">
                    Na Markah Brasil, cada objeto Ã© impresso sob demanda com filamento premium biodegradÃ¡vel. O acabamento fino e a inspeÃ§Ã£o manual levam atÃ© {trackingData.productionDays} dias Ãºteis. Assim que o pacote for entregue Ã  transportadora, o cÃ³digo de rastreamento aparecerÃ¡ aqui e enviaremos um e-mail a vocÃª.
                  </p>
                </div>
              </div>
            )}

            {/* Aviso quando Aguardando Pagamento com Pix */}
            {trackingData.status === "AGUARDANDO_PAGAMENTO" && trackingData.pixQrCode && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <QrCode className="w-4 h-4 text-amber-700" />
                  <span>Aguardando Pagamento Pix (5% de Desconto)</span>
                </div>
                <p className="text-amber-900/80">
                  Total: <strong>{formatCents(trackingData.finalAmountCents)}</strong>. Copie o cÃ³digo abaixo e pague no app do seu banco para que a impressÃ£o comece imediatamente:
                </p>
                <div className="p-2.5 bg-white border border-dashed border-amber-300 rounded font-mono text-[11px] break-all">
                  {trackingData.pixQrCode}
                </div>
                <button
                  onClick={handleCopyPix}
                  className="px-4 py-2 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 text-xs flex items-center gap-1.5"
                >
                  {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPix ? "CÃ³digo Pix Copiado!" : "Copiar CÃ³digo Pix"}</span>
                </button>
              </div>
            )}

            {/* Itens do Pedido */}
            <div className="border-t border-border pt-5">
              <h4 className="text-xs uppercase font-mono tracking-wider text-text-muted mb-3">
                Itens deste Pedido
              </h4>
              <div className="divide-y divide-border">
                {trackingData.items.map((item, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-12 rounded border border-border overflow-hidden shrink-0 bg-surface-alt">
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-semibold text-ink block">
                          {item.productName}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {item.variantName} â€¢ {item.quantity}x
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-ink">
                      {formatCents(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suporte no WhatsApp */}
            <div className="border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-text-muted">
                Alguma dÃºvida sobre a produÃ§Ã£o ou envio do seu pedido?
              </span>
              <a
                href={`https://wa.me/${activeWhatsapp}?text=${encodeURIComponent(
                  `OlÃ¡, gostaria de informaÃ§Ãµes sobre meu pedido #${trackingData.orderNumber}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text hover:bg-surface-alt transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Falar no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
