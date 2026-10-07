import { describe, it, expect, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { POST } from "@/app/api/webhooks/mercadopago/route";
import * as mp from "@/lib/payments/mercadopago";
import { saveOrder, getOrderById, type OrderRecord } from "@/lib/orders-repository";

function buildOrder(overrides: Partial<OrderRecord>): OrderRecord {
  return {
    id: "ord_webhook_base",
    orderNumber: "MKB-WH0000",
    customerName: "Carlos Souza",
    customerEmail: "carlos@example.com",
    customerPhone: "11999999999",
    customerCpf: "11122233344",
    status: "AGUARDANDO_PAGAMENTO",
    subtotalCents: 18900,
    couponDiscountCents: 0,
    discountedSubtotalCents: 18900,
    shippingCarrier: "Correios PAC",
    shippingPriceCents: 1490,
    shippingOriginalPriceCents: 1490,
    isFreeShipping: false,
    carrierDays: 3,
    productionDays: 3,
    totalDeliveryDays: 6,
    totalCents: 20390,
    pixDiscountAmountCents: 945,
    finalAmountCents: 19445,
    paymentMethod: "PIX",
    paymentStatus: "PENDING",
    shippingPostalCode: "01310100",
    shippingStreet: "Av Paulista",
    shippingNumber: "100",
    shippingNeighborhood: "Bela Vista",
    shippingCity: "São Paulo",
    shippingState: "SP",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  };
}

function webhookRequest(paymentId: string, headers: Record<string, string> = {}) {
  return new Request(
    `http://localhost:3000/api/webhooks/mercadopago?data.id=${paymentId}&type=payment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ type: "payment", action: "payment.updated", data: { id: paymentId } }),
    }
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
});

describe("Webhook Mercado Pago (P-003, P-004)", () => {
  it("marca o pedido como PAGO quando o pagamento vinculado é aprovado", async () => {
    const order = buildOrder({ id: "ord_wh_1", orderNumber: "MKB-WH0001", paymentId: "mp_pix_1001" });
    await saveOrder(order, []);

    const res = await POST(webhookRequest("mp_pix_1001"));
    expect(res.status).toBe(200);

    const updated = await getOrderById(order.id);
    expect(updated?.status).toBe("PAGO");
    expect(updated?.paymentStatus).toBe("APPROVED");
  });

  it("ignora o mesmo pagamento/status enviado duas vezes (idempotência)", async () => {
    const order = buildOrder({ id: "ord_wh_2", orderNumber: "MKB-WH0002", paymentId: "mp_pix_1002" });
    await saveOrder(order, []);

    await POST(webhookRequest("mp_pix_1002"));
    const res2 = await POST(webhookRequest("mp_pix_1002"));
    const json2 = await res2.json();
    expect(json2.note).toBe("Já processado");
  });

  it("não aprova pedido a partir de dados enviados na requisição (ataque de webhook falso)", async () => {
    const order = buildOrder({ id: "ord_wh_3", orderNumber: "MKB-WH0003", paymentId: "mp_pix_1003" });
    await saveOrder(order, []);

    // Tentativa antiga: informar o número do pedido na URL e um ID qualquer
    const req = new Request(
      "http://localhost:3000/api/webhooks/mercadopago?orderNumber=MKB-WH0003",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", data: { id: "ord_wh_3" } }),
      }
    );
    await POST(req);

    const after = await getOrderById(order.id);
    expect(after?.status).toBe("AGUARDANDO_PAGAMENTO");
  });

  it("não marca como PAGO quando o valor aprovado difere do valor do pedido", async () => {
    const order = buildOrder({ id: "ord_wh_4", orderNumber: "MKB-WH0004", paymentId: "999004" });
    await saveOrder(order, []);

    vi.spyOn(mp, "getPaymentDetails").mockResolvedValue({
      id: "999004",
      status: "approved",
      transactionAmount: 100, // R$ 1,00
      externalReference: "MKB-WH0004",
    });

    await POST(webhookRequest("999004"));
    const after = await getOrderById(order.id);
    expect(after?.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(after?.internalNotes).toContain("diferente do pedido");
  });

  it("recusa requisição com assinatura inválida quando a chave está configurada", async () => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "segredo-de-teste";
    const res = await POST(
      webhookRequest("mp_pix_1005", { "x-signature": "ts=1700000000,v1=abc", "x-request-id": "req-1" })
    );
    expect(res.status).toBe(401);
  });

  it("aceita requisição com assinatura válida", async () => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "segredo-de-teste";
    const order = buildOrder({ id: "ord_wh_6", orderNumber: "MKB-WH0006", paymentId: "mp_pix_1006" });
    await saveOrder(order, []);

    const ts = "1700000000";
    const manifest = `id:mp_pix_1006;request-id:req-6;ts:${ts};`;
    const v1 = createHmac("sha256", "segredo-de-teste").update(manifest).digest("hex");

    const res = await POST(
      webhookRequest("mp_pix_1006", { "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": "req-6" })
    );
    expect(res.status).toBe(200);
    const after = await getOrderById(order.id);
    expect(after?.status).toBe("PAGO");
  });
});
