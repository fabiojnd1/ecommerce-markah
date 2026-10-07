"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Card Payment Brick do Mercado Pago (D-006).
 * O formulário do cartão é renderizado pelo próprio Mercado Pago dentro de um iframe:
 * número, validade e CVV nunca passam pelo nosso código nem pelo nosso servidor.
 * O checkout recebe apenas um token de uso único.
 */

export interface CardBrickData {
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
}

export interface MercadoPagoCardBrickHandle {
  getCardData: () => Promise<CardBrickData>;
}

interface Props {
  amountCents: number;
  payerEmail?: string;
}

interface BrickController {
  getFormData: () => Promise<{
    token: string;
    installments: number;
    payment_method_id: string;
    issuer_id?: string | number;
  } | null>;
  unmount: () => void;
}

interface MercadoPagoInstance {
  bricks: () => {
    create: (type: string, containerId: string, settings: unknown) => Promise<BrickController>;
  };
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

const SDK_URL = "https://sdk.mercadopago.com/js/v2";
const CONTAINER_ID = "markah-card-payment-brick";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";
const HAS_PUBLIC_KEY = Boolean(PUBLIC_KEY && !PUBLIC_KEY.includes("00000000-0000"));

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
    const script = existing || document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Falha ao carregar o SDK do Mercado Pago")));
    if (!existing) {
      script.src = SDK_URL;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export const MercadoPagoCardBrick = forwardRef<MercadoPagoCardBrickHandle, Props>(
  function MercadoPagoCardBrick({ amountCents, payerEmail }, ref) {
    const controllerRef = useRef<BrickController | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

    useEffect(() => {
      if (!HAS_PUBLIC_KEY || amountCents <= 0) return;
      let cancelled = false;
      setStatus("loading");

      loadSdk()
        .then(async () => {
          if (cancelled || !window.MercadoPago) return;
          controllerRef.current?.unmount();
          const mp = new window.MercadoPago(PUBLIC_KEY, { locale: "pt-BR" });
          const controller = await mp.bricks().create("cardPayment", CONTAINER_ID, {
            initialization: {
              amount: amountCents / 100,
              payer: payerEmail ? { email: payerEmail } : undefined,
            },
            customization: {
              visual: { hidePaymentButton: true, hideFormTitle: true },
              paymentMethods: { maxInstallments: 12 },
            },
            callbacks: {
              onReady: () => !cancelled && setStatus("ready"),
              onError: () => !cancelled && setStatus("error"),
              onSubmit: async () => undefined,
            },
          });
          if (cancelled) {
            controller.unmount();
          } else {
            controllerRef.current = controller;
          }
        })
        .catch(() => !cancelled && setStatus("error"));

      return () => {
        cancelled = true;
        controllerRef.current?.unmount();
        controllerRef.current = null;
      };
      // O e-mail só é usado na criação; recriar a cada tecla seria desnecessário.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amountCents]);

    useImperativeHandle(ref, () => ({
      async getCardData() {
        if (!HAS_PUBLIC_KEY) {
          if (process.env.NODE_ENV !== "production") {
            // Desenvolvimento local sem credenciais: o servidor simula a aprovação.
            return { token: "mock_card_dev", installments: 1, paymentMethodId: "master" };
          }
          throw new Error("Pagamento com cartão indisponível no momento.");
        }
        const data = await controllerRef.current?.getFormData();
        if (!data?.token) {
          throw new Error("Confira os dados do cartão.");
        }
        return {
          token: data.token,
          installments: Number(data.installments) || 1,
          paymentMethodId: data.payment_method_id,
          issuerId: data.issuer_id != null ? String(data.issuer_id) : undefined,
        };
      },
    }));

    if (!HAS_PUBLIC_KEY) {
      return (
        <div className="p-4 rounded-lg bg-amarelo/10 border border-amarelo/40 text-xs text-text space-y-1">
          <p className="font-semibold">Modo desenvolvimento</p>
          <p className="text-text-muted">
            Defina NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY para exibir o formulário seguro de cartão do
            Mercado Pago. Sem ela, o pagamento com cartão é apenas simulado localmente.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Carregando formulário seguro do Mercado Pago...</span>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span>Não foi possível carregar o formulário do cartão. Recarregue a página ou pague com Pix.</span>
          </div>
        )}
        <div id={CONTAINER_ID} />
      </div>
    );
  }
);
