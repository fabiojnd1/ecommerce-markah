import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "@/lib/auth";
import {
  getAdminOrdersAction,
  getAdminOrderDetailsAction,
  updateOrderStatusAction,
  updateOrderTrackingAction,
  saveInternalNotesAction,
  refundOrderAction,
  getAdminMetricsAction,
} from "@/server/admin-order-actions";
import {
  trackOrderPublicAction,
  customerLoginAction,
} from "@/server/tracking-actions";
import { saveOrder, type OrderRecord, type OrderItemRecord } from "@/lib/orders-repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Fase 5 — Gestão de Pedidos, Produção 3D e Rastreamento (v0.6.0)", () => {
  const mockAdminUser = {
    id: "admin_test",
    name: "Admin Markah",
    email: "admin@markah.com.br",
    role: "ADMIN" as const,
  };

  const sampleOrder: OrderRecord = {
    id: "ord_fase5_test_01",
    orderNumber: "MKB-50001",
    customerName: "Mariana Souza",
    customerEmail: "mariana.souza@exemplo.com",
    customerPhone: "11999998888",
    customerCpf: "11122233344",
    status: "PAGO",
    subtotalCents: 21990,
    couponDiscountCents: 0,
    discountedSubtotalCents: 21990,
    shippingCarrier: "Sedex (Correios)",
    shippingPriceCents: 2490,
    shippingOriginalPriceCents: 2490,
    isFreeShipping: false,
    carrierDays: 2,
    productionDays: 3,
    totalDeliveryDays: 5,
    totalCents: 24480,
    pixDiscountAmountCents: 1100,
    finalAmountCents: 23380,
    paymentMethod: "PIX",
    paymentStatus: "APPROVED",
    paymentId: "pix_test_50001",
    shippingPostalCode: "04571010",
    shippingStreet: "Avenida Engenheiro Luís Carlos Berrini",
    shippingNumber: "500",
    shippingNeighborhood: "Itaim Bibi",
    shippingCity: "São Paulo",
    shippingState: "SP",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleItems: OrderItemRecord[] = [
    {
      id: "item_fase5_01",
      orderId: sampleOrder.id,
      productId: "prod_saturno",
      variantId: "var_saturno_areia",
      productName: "Luminária Saturno",
      productSlug: "luminaria-saturno",
      variantSku: "SAT-ARE-01",
      variantName: "Areia",
      colorHex: "#D8C7B5",
      imageUrl: "/products/luminaria-saturno-off.svg",
      unitPriceCents: 21990,
      quantity: 1,
      totalPriceCents: 21990,
    },
  ];

  beforeEach(async () => {
    vi.restoreAllMocks();
    await saveOrder(sampleOrder, sampleItems);
  });

  describe("Regra P-007: Proteção obrigatória no servidor para ações administrativas", () => {
    it("deve rejeitar listagem ou mutação de pedidos se o usuário não for administrador", async () => {
      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(getAdminOrdersAction()).rejects.toThrow(/Acesso não autorizado/);

      vi.spyOn(auth, "requireAdmin").mockRejectedValueOnce(
        new Error("Acesso não autorizado: privilégio de administrador necessário (P-007).")
      );

      await expect(
        updateOrderStatusAction(sampleOrder.id, "EM_PRODUCAO")
      ).rejects.toThrow(/Acesso não autorizado/);
    });
  });

  describe("Ciclo de vida e transições de status da manufatura sob demanda", () => {
    beforeEach(() => {
      vi.spyOn(auth, "requireAdmin").mockResolvedValue(mockAdminUser);
    });

    it("deve transicionar de PAGO para EM_PRODUCAO e depois PRONTO_PARA_ENVIO", async () => {
      const step1 = await updateOrderStatusAction(sampleOrder.id, "EM_PRODUCAO");
      expect(step1.success).toBe(true);
      expect(step1.order?.status).toBe("EM_PRODUCAO");

      const step2 = await updateOrderStatusAction(sampleOrder.id, "PRONTO_PARA_ENVIO");
      expect(step2.success).toBe(true);
      expect(step2.order?.status).toBe("PRONTO_PARA_ENVIO");
    });

    it("deve recusar transicionar para ENVIADO sem código de rastreamento", async () => {
      const res = await updateOrderStatusAction(sampleOrder.id, "ENVIADO");
      expect(res.success).toBe(false);
      expect(res.error).toContain("código de rastreamento é obrigatório");
    });

    it("deve permitir marcar como ENVIADO fornecendo o código de rastreamento", async () => {
      const res = await updateOrderStatusAction(sampleOrder.id, "ENVIADO", {
        trackingCode: "BR998877665BR",
      });

      expect(res.success).toBe(true);
      expect(res.order?.status).toBe("ENVIADO");
      expect(res.order?.trackingCode).toBe("BR998877665BR");
      expect(res.order?.shippedAt).toBeDefined();
    });

    it("deve permitir despachar diretamente via updateOrderTrackingAction", async () => {
      const res = await updateOrderTrackingAction(sampleOrder.id, "NL123456789BR");
      expect(res.success).toBe(true);
      expect(res.order?.status).toBe("ENVIADO");
      expect(res.order?.trackingCode).toBe("NL123456789BR");
    });

    it("deve transicionar para ENTREGUE e registrar deliveredAt", async () => {
      const res = await updateOrderStatusAction(sampleOrder.id, "ENTREGUE");
      expect(res.success).toBe(true);
      expect(res.order?.status).toBe("ENTREGUE");
      expect(res.order?.deliveredAt).toBeDefined();
    });
  });

  describe("Anotações internas da oficina e Reembolso", () => {
    beforeEach(() => {
      vi.spyOn(auth, "requireAdmin").mockResolvedValue(mockAdminUser);
    });

    it("deve salvar anotações técnicas da equipe de produção 3D", async () => {
      const res = await saveInternalNotesAction(
        sampleOrder.id,
        "Impressão com bico 0.4mm em altura de camada 0.16mm. Cor perfeitamente uniforme."
      );

      expect(res.success).toBe(true);
      expect(res.order?.internalNotes).toContain("altura de camada 0.16mm");
    });

    it("deve cancelar/reembolsar pedido e registrar justificativa nas anotações", async () => {
      const res = await refundOrderAction(sampleOrder.id, "Cliente solicitou troca de projeto");

      expect(res.success).toBe(true);
      expect(res.order?.status).toBe("REEMBOLSADO");
      expect(res.order?.paymentStatus).toBe("REFUNDED");
      expect(res.order?.internalNotes).toContain("Cliente solicitou troca de projeto");
    });
  });

  describe("Rastreamento Público e Privacidade (/rastreio)", () => {
    it("deve rejeitar rastreio se o número do pedido não existir", async () => {
      const res = await trackOrderPublicAction("MKB-99999", "qualquer@email.com");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Pedido não localizado");
    });

    it("deve bloquear acesso se e-mail ou CPF não conferirem com o pedido (Privacidade)", async () => {
      const res = await trackOrderPublicAction("MKB-50001", "outro.email@exemplo.com");
      expect(res.success).toBe(false);
      expect(res.error).toContain("dados de verificação não conferem");
    });

    it("deve retornar informações seguras de rastreamento com validação por e-mail", async () => {
      const res = await trackOrderPublicAction(
        "MKB-50001",
        "mariana.souza@exemplo.com"
      );

      expect(res.success).toBe(true);
      expect(res.data?.orderNumber).toBe("MKB-50001");
      expect(res.data?.customerFirstName).toBe("Mariana");
      expect(res.data?.shippingCity).toBe("São Paulo");
      expect(res.data?.shippingState).toBe("SP");
      expect(res.data?.productionDays).toBe(3);
      expect(res.data?.items).toHaveLength(1);
      expect(res.data?.items[0].productName).toBe("Luminária Saturno");
    });

    it("deve retornar informações de rastreamento com validação por CPF", async () => {
      const res = await trackOrderPublicAction("MKB-50001", "111.222.333-44");

      expect(res.success).toBe(true);
      expect(res.data?.orderNumber).toBe("MKB-50001");
    });
  });

  describe("Métricas Consolidadas (Admin Dashboard)", () => {
    beforeEach(() => {
      vi.spyOn(auth, "requireAdmin").mockResolvedValue(mockAdminUser);
    });

    it("deve calcular métricas de pedidos e faturamento", async () => {
      const metrics = await getAdminMetricsAction();
      expect(metrics.totalOrders).toBeGreaterThanOrEqual(1);
      expect(metrics.totalRevenueCents).toBeGreaterThan(0);
    });
  });
});
