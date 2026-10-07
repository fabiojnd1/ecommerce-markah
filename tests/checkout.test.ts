import { describe, it, expect } from "vitest";
import {
  createOrderAction,
  getOrderStatusAction,
} from "@/server/checkout-actions";
import { SEED_PRODUCTS } from "@/lib/data/catalog-seed";

describe("src/server/checkout-actions.ts — Regras de Checkout e Criação de Pedidos (P-001, D-011)", () => {
  const sampleProduct = SEED_PRODUCTS[0]; // Luminária Saturno (R$ 189,00)
  const sampleVariant = sampleProduct.variants[0];

  const validPayload = {
    customer: {
      name: "Maria Silva",
      email: "maria.silva@example.com",
      phone: "(11) 98765-4321",
      cpf: "123.456.789-01",
    },
    shippingAddress: {
      postalCode: "01310-100", // Av. Paulista, SP
      street: "Avenida Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
    shippingOptionId: "correios-pac",
    paymentMethod: "PIX" as const,
    items: [
      {
        variantId: sampleVariant.id,
        quantity: 1,
      },
    ],
  };

  it("deve rejeitar checkout com dados incompletos ou inválidos", async () => {
    // Nome vazio
    const res1 = await createOrderAction({
      ...validPayload,
      customer: { ...validPayload.customer, name: "" },
    });
    expect(res1.success).toBe(false);
    expect(res1.error).toContain("Nome completo é obrigatório");

    // E-mail inválido
    const res2 = await createOrderAction({
      ...validPayload,
      customer: { ...validPayload.customer, email: "invalido" },
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain("E-mail de contato inválido");

    // CEP inválido
    const res3 = await createOrderAction({
      ...validPayload,
      shippingAddress: { ...validPayload.shippingAddress, postalCode: "123" },
    });
    expect(res3.success).toBe(false);
    expect(res3.error).toContain("CEP de entrega inválido");
  });

  it("deve criar pedido Pix com recálculo estrito no servidor e desconto de 5% sobre produtos (P-001, PRD §5.1)", async () => {
    const res = await createOrderAction(validPayload);

    expect(res.success).toBe(true);
    expect(res.orderId).toBeDefined();
    expect(res.orderNumber).toMatch(/^MKB-[2-9A-HJ-NP-Z]{6}$/);
    expect(res.paymentMethod).toBe("PIX");
    expect(res.pixQrCode).toBeDefined();
    expect(res.pixQrCodeUrl).toBeDefined();
    expect(res.pixExpiresAt).toBeDefined();

    // 1 Luminária Saturno = R$ 189,00 (18900 centavos)
    // Frete PAC SP Capital = R$ 14,90 (1490 centavos)
    // Desconto Pix de 5% sobre R$ 189,00 = R$ 9,45 (945 centavos)
    // Total Pix = 18900 - 945 + 1490 = 19445 centavos
    expect(res.finalAmountCents).toBe(19445);

    // Consulta de status do pedido
    const statusRes = await getOrderStatusAction(res.orderId!);
    expect(statusRes.success).toBe(true);
    expect(statusRes.order?.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(statusRes.order?.productionDays).toBe(3);
  });

  it("deve aplicar frete grátis quando o subtotal de produtos for >= R$ 200,00 (PRD §5.2)", async () => {
    // 2 Luminárias = R$ 378,00 >= R$ 200,00
    const res = await createOrderAction({
      ...validPayload,
      paymentMethod: "CREDIT_CARD",
      cardData: {
        token: "mock_token_123",
        installments: 3,
        paymentMethodId: "master",
      },
      items: [
        {
          variantId: sampleVariant.id,
          quantity: 2,
        },
      ],
    });

    expect(res.success).toBe(true);
    // Frete zerado, total cobrado no cartão = R$ 378,00 (37800 centavos)
    expect(res.finalAmountCents).toBe(37800);
    expect(res.status).toBe("PAGO");
  });
});
