"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  Truck,
  QrCode,
  LogOut,
  Mail,
  ArrowRight,
  Check,
  Copy,
} from "lucide-react";
import { formatCents } from "@/lib/pricing";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { customerLoginAction, customerLogoutAction } from "@/server/tracking-actions";
import type { OrderRecord } from "@/lib/orders-repository";

interface CustomerPortalProps {
  initialUser: { name: string; email: string } | null;
  initialOrders: OrderRecord[];
  linkError?: boolean;
}

export function CustomerPortal({ initialUser, initialOrders, linkError = false }: CustomerPortalProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [orders, setOrders] = useState(initialOrders);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    linkError ? "O link de acesso expirou ou é inválido. Peça um novo abaixo." : null
  );
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await customerLoginAction(emailInput.trim());
    setLoading(false);

    if (res.success) {
      setSentMessage(res.message || "Enviamos um link de acesso para o seu e-mail.");
      setDevLink(res.devLink || null);
    } else {
      setError(res.error || "Não foi possível acessar a conta.");
    }
  }

  async function handleLogout() {
    await customerLogoutAction();
    setUser(null);
    setOrders([]);
    router.refresh();
  }

  function handleCopyPix(orderId: string, pixQrCode: string) {
    navigator.clipboard.writeText(pixQrCode);
    setCopiedPixId(orderId);
    setTimeout(() => setCopiedPixId(null), 2000);
  }

  // Se não estiver logado, exibe tela de login simples por e-mail
  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-surface rounded-card border border-border p-6 sm:p-8 shadow-subtle text-center">
        <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-4 text-ink">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-ink font-display mb-1">
          Acessar Minha Conta
        </h2>
        <p className="text-xs text-text-muted mb-6 leading-relaxed">
          Informe o e-mail usado na compra. Vamos enviar um link de acesso para você entrar e acompanhar seus pedidos.
        </p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label
              htmlFor="customerEmailInput"
              className="block text-xs font-semibold text-text mb-1.5"
            >
              Seu E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="customerEmailInput"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink placeholder:text-text-muted"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          {sentMessage && (
            <div className="text-xs text-green-800 bg-green-50 p-2.5 rounded-lg border border-green-200 space-y-1">
              <p>{sentMessage}</p>
              {devLink && (
                <p>
                  <span className="font-semibold">Modo desenvolvimento:</span>{" "}
                  <a href={devLink} className="underline break-all">
                    abrir link de acesso
                  </a>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 shadow-subtle"
          >
            {loading ? "Enviando..." : "Receber link de acesso"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-xs text-text-muted">
          Quer apenas rastrear uma compra específica?{" "}
          <Link href="/rastreio" className="text-ink font-semibold hover:underline">
            Rastrear por código
          </Link>
        </div>
      </div>
    );
  }

  // Cliente logado: exibe cabeçalho e histórico de pedidos
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Barra Superior da Conta */}
      <div className="bg-surface rounded-card border border-border p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">{user.name}</h2>
            <p className="text-xs text-text-muted">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-muted hover:text-ink hover:bg-surface-alt transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-mono">
            Meus Pedidos ({orders.length})
          </h3>
          <Link
            href="/rastreio"
            className="text-xs text-text-muted hover:text-ink flex items-center gap-1"
          >
            <span>Rastreio Rápido</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-surface rounded-card border border-border p-12 text-center text-text-muted space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-text-muted/60" />
            <h4 className="font-bold text-sm text-ink">Nenhum pedido encontrado</h4>
            <p className="text-xs max-w-sm mx-auto">
              Você ainda não realizou compras com este e-mail ({user.email}).
            </p>
            <Link
              href="/"
              className="inline-block px-5 py-2 rounded-full bg-ink text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-subtle"
            >
              Explorar Coleções
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const items = order.items || [];

            return (
              <div
                key={order.id}
                className="bg-surface rounded-card border border-border overflow-hidden shadow-subtle space-y-4"
              >
                {/* Cabeçalho do Card */}
                <div className="p-4 sm:p-5 bg-surface-alt/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-ink text-sm">
                      #{order.orderNumber}
                    </span>
                    <span className="text-text-muted">{dateStr}</span>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-ink text-sm">
                      {formatCents(order.finalAmountCents)}
                    </span>
                    <Link
                      href={`/rastreio?codigo=${order.orderNumber}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ink text-white text-[11px] font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      <Truck className="w-3 h-3" />
                      <span>Acompanhar Rastreio</span>
                    </Link>
                  </div>
                </div>

                {/* Itens do Pedido */}
                <div className="p-4 sm:p-5 pt-0 space-y-3">
                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-14 rounded border border-border overflow-hidden shrink-0 bg-surface-alt">
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
                              Variação: {item.variantName} • {item.quantity}x
                            </span>
                          </div>
                        </div>

                        <span className="font-semibold text-text">
                          {formatCents(item.totalPriceCents)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Segunda via do Pix se Pendente */}
                  {order.status === "AGUARDANDO_PAGAMENTO" && order.pixQrCode && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 mt-3">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Aguardando pagamento Pix (5% OFF aplicado)</span>
                      </div>
                      <button
                        onClick={() => handleCopyPix(order.id, order.pixQrCode!)}
                        className="px-3 py-1 bg-amber-700 text-white rounded font-semibold text-[11px] flex items-center gap-1.5 self-start sm:self-auto hover:bg-amber-800"
                      >
                        {copiedPixId === order.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar Pix</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Informações de Frete e Rastreio */}
                  <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-xs text-text-muted gap-2">
                    <span>
                      Envio via <strong>{order.shippingCarrier}</strong> para {order.shippingCity}/{order.shippingState}
                    </span>
                    {order.trackingCode && (
                      <span className="font-mono text-purple-700 font-semibold flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Rastreio: {order.trackingCode}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
