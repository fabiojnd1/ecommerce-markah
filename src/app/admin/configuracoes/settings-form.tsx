"use client";

import { useState } from "react";
import { Save, CheckCircle2, Store, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveStoreSettingsAction } from "@/server/admin-actions";
import type { StoreSettingsData } from "@/lib/settings-repository";

interface AdminConfiguracoesFormProps {
  initialSettings: StoreSettingsData;
}

export function AdminConfiguracoesForm({
  initialSettings,
}: AdminConfiguracoesFormProps) {
  const [storeName, setStoreName] = useState(initialSettings.storeName);
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber);
  const [instagramHandle, setInstagramHandle] = useState(initialSettings.instagramHandle);
  const [originPostalCode, setOriginPostalCode] = useState(initialSettings.originPostalCode);
  const [pixDiscountPercent, setPixDiscountPercent] = useState(initialSettings.pixDiscountPercent);
  const [maxInstallmentsFree, setMaxInstallmentsFree] = useState(initialSettings.maxInstallmentsFree);
  const [freeShippingThresholdReais, setFreeShippingThresholdReais] = useState(
    (initialSettings.freeShippingThresholdCents / 100).toFixed(2)
  );
  const [defaultProductionDays, setDefaultProductionDays] = useState(initialSettings.defaultProductionDays);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const freeShippingThresholdCents = Math.round(
        parseFloat(freeShippingThresholdReais) * 100
      );

      const res = await saveStoreSettingsAction({
        storeName,
        whatsappNumber,
        instagramHandle,
        originPostalCode,
        pixDiscountPercent: Number(pixDiscountPercent),
        maxInstallmentsFree: Number(maxInstallmentsFree),
        freeShippingThresholdCents,
        defaultProductionDays: Number(defaultProductionDays),
      });

      if (res.success && res.settings) {
        setStoreName(res.settings.storeName);
        setWhatsappNumber(res.settings.whatsappNumber);
        setInstagramHandle(res.settings.instagramHandle);
        setOriginPostalCode(res.settings.originPostalCode);
        setPixDiscountPercent(res.settings.pixDiscountPercent);
        setMaxInstallmentsFree(res.settings.maxInstallmentsFree);
        setFreeShippingThresholdReais(
          (res.settings.freeShippingThresholdCents / 100).toFixed(2)
        );
        setDefaultProductionDays(res.settings.defaultProductionDays);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ink font-display">
          Configurações da Loja
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Parâmetros comerciais, canais de atendimento e regras de frete e produção
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-xs font-semibold text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          <span>Configurações salvas e aplicadas com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Canais e Identidade da Loja */}
        <div className="bg-surface rounded-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-text uppercase tracking-wider font-mono">
            <Store className="w-4 h-4 text-magenta" />
            <span>Dados da Loja & Atendimento</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Nome da Marca
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                WhatsApp Oficial (com DDI e DDD)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="5511999999999"
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Instagram (@)
              </label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="markah_br"
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                CEP de Origem (Melhor Envio)
              </label>
              <input
                type="text"
                value={originPostalCode}
                onChange={(e) => setOriginPostalCode(e.target.value)}
                placeholder="01001000"
                maxLength={8}
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. Regras Comerciais e Pagamento */}
        <div className="bg-surface rounded-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-text uppercase tracking-wider font-mono">
            <Percent className="w-4 h-4 text-verde" />
            <span>Condições de Pagamento e Frete</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Desconto à vista no Pix (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={pixDiscountPercent}
                onChange={(e) => setPixDiscountPercent(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink font-bold"
              />
              <span className="text-[11px] text-text-muted">
                Calculado em centavos inteiros via pricing.ts (D-011).
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Máximo de Parcelas sem Juros (Cartão)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={maxInstallmentsFree}
                onChange={(e) => setMaxInstallmentsFree(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Valor Mínimo para Frete Grátis (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={freeShippingThresholdReais}
                onChange={(e) => setFreeShippingThresholdReais(e.target.value)}
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
              />
              <span className="text-[11px] text-text-muted">
                Padrão PRD §5.2: R$ 200,00 (20000 centavos).
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">
                Prazo Padrão de Produção 3D (dias úteis)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={defaultProductionDays}
                onChange={(e) => setDefaultProductionDays(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-input border border-border bg-surface text-sm focus:outline-none focus:border-ink"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="default"
            isLoading={loading}
            className="gap-2 text-xs font-semibold"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
