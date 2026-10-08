"use client";

import { WHATSAPP_NUMBER } from "@/lib/site-config";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Clock,
  Truck,
  MessageCircle,
  ShoppingBag,
  Check,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { formatCents } from "@/lib/pricing";
import { getOrderStatusAction } from "@/server/checkout-actions";
import { Button } from "@/components/ui/button";
import type { OrderRecord } from "@/lib/orders-repository";

interface OrderSuccessClientProps {
  initialOrder: OrderRecord;
  whatsappNumber?: string;
}

export function OrderSuccessClient({ initialOrder, whatsappNumber }: OrderSuccessClientProps) {
  const activeWhatsapp = (whatsappNumber || WHATSAPP_NUMBER).replace(/\D/g, "");
  const [order, setOrder] = useState<OrderRecord>(initialOrder);
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(1800); // 30 minutos

  const isPix = order.paymentMethod === "PIX";
  const isPaid = order.status === "PAGO" || order.paymentStatus === "APPROVED";

  // Contador regressivo de 30 minutos para o Pix
  useEffect(() => {
    if (isPaid || !isPix) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaid, isPix]);

  // Polling automÃ¡tico de status a cada 5 segundos para o Pix (PRD Â§5.4)
  useEffect(() => {
    if (isPaid) return;

    const interval = setInterval(async () => {
      const res = await getOrderStatusAction(order.id);
      if (res.success && res.order) {
        if (res.order.status === "PAGO" || res.order.paymentStatus === "APPROVED") {
          setOrder((prev) => ({
            ...prev,
            status: "PAGO",
            paymentStatus: "APPROVED",
          }));
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order.id, isPaid]);

  function handleCopyPix() {
    if (order.pixQrCode) {
      navigator.clipboard.writeText(order.pixQrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const whatsappSupportUrl = `https://wa.me/${activeWhatsapp}?text=${encodeURIComponent(
    `OlÃ¡! Gostaria de falar sobre o meu pedido #${order.orderNumber} na Markah Brasil.`
  )}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      {/* Banner Superior de Sucesso */}
      <div className="text-center space-y-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md transition-all ${
            isPaid ? "bg-verde/15 text-verde" : "bg-verde/10 text-verde"
          }`}
        >
          {isPaid ? (
            <PackageCheck className="w-9 h-9 stroke-[2]" />
          ) : (
            <CheckCircle2 className="w-9 h-9 stroke-[2]" />
          )}
        </div>

        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            Pedido Confirmado
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink mt-0.5">
            #{order.orderNumber}
          </h1>
        </div>

        {isPaid ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-verde/10 text-verde font-semibold text-xs animate-in fade-in duration-300">
            <Check className="w-4 h-4" />
            <span>Pagamento Aprovado â€” ProduÃ§Ã£o sob demanda iniciada!</span>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
            {isPix
              ? "Aguardando pagamento via Pix. Pague agora para iniciar a produÃ§Ã£o da sua peÃ§a."
              : "Seu pedido foi registrado e estÃ¡ sendo processado."}
          </p>
        )}
      </div>

      {/* Bloco Exclusivo de CobranÃ§a Pix */}
      {isPix && !isPaid && order.pixQrCode && (
        <div className="bg-surface rounded-card border border-border p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-verde bg-verde/10 px-2.5 py-0.5 rounded-full uppercase">
              5% de Desconto Aplicado
            </div>
            <h2 className="text-xl font-bold text-ink font-display pt-1">
              Pague com Pix: {formatCents(order.finalAmountCents)}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted pt-1">
              <Clock className="w-3.5 h-3.5 text-laranja" />
              <span>
                Expira em: <strong className="font-mono text-ink">{formattedCountdown}</strong>
              </span>
            </div>
          </div>

          {/* Imagem do QR Code */}
          {order.pixQrCodeUrl && (
            <div className="flex justify-center py-2">
              <div className="p-3 bg-white border-2 border-dashed border-border rounded-xl shadow-xs">
                <Image
                  src={order.pixQrCodeUrl}
                  alt="QR Code Pix"
                  width={200}
                  height={200}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Campo Copia e Cola */}
          <div className="space-y-2 max-w-md mx-auto">
            <label className="block text-xs font-semibold text-text uppercase tracking-wider font-mono text-center">
              CÃ³digo Pix Copia e Cola
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={order.pixQrCode}
                className="flex-1 h-10 px-3 rounded-input border border-border bg-surface-alt/60 text-xs font-mono text-text truncate focus:outline-none"
              />
              <Button
                type="button"
                onClick={handleCopyPix}
                variant="primary"
                size="sm"
                className="h-10 px-4 gap-1.5 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-verde" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-text-muted text-center">
              Abra o app do seu banco, escolha &quot;Pagar com Pix&quot; e selecione &quot;Pix Copia e Cola&quot;.
            </p>
          </div>
        </div>
      )}

      {/* Linha do Tempo e Prazos Transparentes (PRD Â§5.3) */}
      <div className="bg-surface rounded-card border border-border p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold font-display text-ink uppercase tracking-wider font-mono flex items-center gap-2">
          <Truck className="w-4 h-4 text-laranja" />
          <span>Prazo de ProduÃ§Ã£o & Entrega</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-surface-alt/70 space-y-1">
            <span className="text-text-muted font-medium block">
              1. FabricaÃ§Ã£o Sob Demanda
            </span>
            <p className="font-bold text-ink text-sm">
              {order.productionDays} dias Ãºteis
            </p>
            <p className="text-[11px] text-text-muted">
              ImpressÃ£o 3D de alta precisÃ£o com materiais sustentÃ¡veis (PLA/PETG).
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-alt/70 space-y-1">
            <span className="text-text-muted font-medium block">
              2. Envio ({order.shippingCarrier})
            </span>
            <p className="font-bold text-ink text-sm">
              {order.carrierDays} dias Ãºteis
            </p>
            <p className="text-[11px] text-text-muted">
              Prazo total estimado: <strong>{order.totalDeliveryDays} dias Ãºteis</strong> apÃ³s a confirmaÃ§Ã£o.
            </p>
          </div>
        </div>
      </div>

      {/* Resumo dos Itens e EndereÃ§o */}
      <div className="bg-surface rounded-card border border-border p-6 space-y-5 shadow-xs">
        <h3 className="text-sm font-bold font-display text-ink uppercase tracking-wider font-mono border-b border-border pb-3">
          Detalhes do Pedido
        </h3>

        {/* Itens */}
        <div className="divide-y divide-border">
          {order.items?.map((item) => (
            <div key={item.id} className="py-3 flex items-center gap-3 text-xs">
              <div className="relative w-12 h-14 rounded bg-surface-alt shrink-0 overflow-hidden border border-border">
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate">{item.productName}</p>
                <p className="text-[11px] text-text-muted">
                  {item.variantName} Â· Qtd: {item.quantity}
                </p>
              </div>
              <span className="font-mono font-medium text-text">
                {formatCents(item.totalPriceCents)}
              </span>
            </div>
          ))}
        </div>

        {/* EndereÃ§o de Entrega */}
        <div className="pt-3 border-t border-border text-xs text-text-muted space-y-1">
          <p className="font-semibold text-ink">EndereÃ§o de Entrega:</p>
          <p>
            {order.shippingStreet}, {order.shippingNumber}{" "}
            {order.shippingComplement ? `(${order.shippingComplement})` : ""}
          </p>
          <p>
            {order.shippingNeighborhood} â€” {order.shippingCity}/{order.shippingState} Â· CEP: {order.shippingPostalCode}
          </p>
        </div>

        {/* Valores Consolidados */}
        <div className="pt-3 border-t border-border space-y-1.5 text-xs text-text">
          <div className="flex justify-between">
            <span className="text-text-muted">Subtotal dos produtos</span>
            <span className="font-mono">{formatCents(order.subtotalCents)}</span>
          </div>

          {order.couponDiscountCents > 0 && (
            <div className="flex justify-between text-verde">
              <span>Cupom de desconto ({order.couponCode})</span>
              <span className="font-mono">-{formatCents(order.couponDiscountCents)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-text-muted">Frete ({order.shippingCarrier})</span>
            <span className="font-mono">
              {order.isFreeShipping ? "GrÃ¡tis" : formatCents(order.shippingPriceCents)}
            </span>
          </div>

          {order.pixDiscountAmountCents > 0 && (
            <div className="flex justify-between text-verde font-semibold">
              <span>Desconto Pix (5% OFF)</span>
              <span className="font-mono">-{formatCents(order.pixDiscountAmountCents)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-border flex justify-between items-baseline font-bold text-sm text-ink">
            <span>Total Pago</span>
            <span className="font-mono text-base">{formatCents(order.finalAmountCents)}</span>
          </div>
        </div>
      </div>

      {/* AÃ§Ãµes Finais: Suporte WhatsApp e Continuar Comprando */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href={whatsappSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 border-verde/30 text-verde hover:bg-verde/5 font-semibold text-xs"
          >
            <MessageCircle className="w-4 h-4 fill-verde stroke-none" />
            <span>Falar no WhatsApp sobre este pedido</span>
          </Button>
        </a>

        <Link href="/produtos" className="flex-1">
          <Button
            variant="primary"
            size="lg"
            className="w-full gap-2 font-semibold text-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continuar Comprando</span>
          </Button>
        </Link>
      </div>

      <div className="text-center pt-2">
        <p className="text-[11px] text-text-muted flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-verde" />
          <span>ConfirmaÃ§Ã£o enviada para {order.customerEmail}</span>
        </p>
      </div>
    </div>
  );
}
