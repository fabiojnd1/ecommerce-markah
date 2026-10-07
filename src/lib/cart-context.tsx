"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import type { SeedProduct, SeedVariant } from "./data/catalog-seed";
import type { AppliedCoupon } from "./pricing";
import { formatVariantDisplayName, getVariantColors } from "./catalog";
import { validateCouponAction } from "@/server/cart-actions";

export interface CartItemColor {
  name: string;
  hex?: string;
  label?: string;
}

export interface CartItem {
  id: string; // variantId
  productId: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  variantName: string;
  colorHex?: string;
  colors?: CartItemColor[];
  imageUrl: string;
  priceCents: number;
  compareAtPriceCents?: number | null;
  weightGrams: number;
  packageHeightCm: number;
  packageWidthCm: number;
  packageDepthCm: number;
  quantity: number;
}

export interface ShippingOption {
  id: string;
  name: string;
  company: string;
  priceCents: number;
  originalPriceCents: number;
  carrierDays: number;
  productionDays: number;
  totalDays: number;
  isFree: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: SeedProduct, variant: SeedVariant, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalCents: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  selectedShipping: ShippingOption | null;
  setSelectedShipping: (option: ShippingOption | null) => void;
  // Gestão de Cupons (Fase 3)
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  couponError: string | null;
  isApplyingCoupon: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "markah_cart_v1";
const COUPON_STORAGE_KEY = "markah_coupon_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, startCouponTransition] = useTransition();
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega carrinho e cupom do localStorage / cookies na montagem
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(CART_STORAGE_KEY);
      if (storedItems) {
        const parsed = JSON.parse(storedItems);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }

      const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (storedCoupon) {
        const parsedCoupon = JSON.parse(storedCoupon);
        if (parsedCoupon && parsedCoupon.code) {
          setAppliedCoupon(parsedCoupon);
        }
      }
    } catch {
      // Ignora erro de leitura
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persiste no localStorage e cookies sempre que itens ou cupom mudam
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }

      // Salva cookie resumido para o servidor (variantId + quantity + cupom)
      const cookiePayload = JSON.stringify({
        items: items.map((i) => ({ variantId: i.id, quantity: i.quantity })),
        couponCode: appliedCoupon?.code || null,
      });
      document.cookie = `markah_cart=${encodeURIComponent(
        cookiePayload
      )}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    } catch {
      // Ignora falha de gravação
    }
  }, [items, appliedCoupon, isLoaded]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const addItem = useCallback(
    (product: SeedProduct, variant: SeedVariant, quantity = 1) => {
      // Identifica o nome completo da variação (base, cúpula, tamanho)
      const variantName = formatVariantDisplayName(product, variant);
      const colors = getVariantColors(product, variant);
      const colorHex = colors[0]?.hex;

      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.id === variant.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }

        const newItem: CartItem = {
          id: variant.id,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variantSku: variant.sku,
          variantName,
          colorHex,
          colors,
          imageUrl:
            product.images.find((img) => img.isPrimary)?.url ||
            product.images[0]?.url ||
            "/brand/markah-simbolo.png",
          priceCents: variant.priceCents,
          compareAtPriceCents: variant.compareAtPriceCents,
          weightGrams: variant.weightGrams,
          packageHeightCm: variant.packageHeightCm,
          packageWidthCm: variant.packageWidthCm,
          packageDepthCm: variant.packageDepthCm,
          quantity,
        };
        return [...prev, newItem];
      });

      // Abre a gaveta lateral automaticamente
      openDrawer();
    },
    [openDrawer]
  );

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== variantId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === variantId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSelectedShipping(null);
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const subtotalCents = useMemo(
    () => items.reduce((acc, item) => acc + item.priceCents * item.quantity, 0),
    [items]
  );

  const applyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      setCouponError(null);
      return new Promise((resolve) => {
        startCouponTransition(async () => {
          const res = await validateCouponAction(code, subtotalCents);
          if (res.success && res.coupon) {
            setAppliedCoupon(res.coupon);
            setCouponError(null);
            resolve({ success: true });
          } else {
            const err = res.error || "Cupom inválido.";
            setCouponError(err);
            resolve({ success: false, error: err });
          }
        });
      });
    },
    [subtotalCents]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotalCents,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        selectedShipping,
        setSelectedShipping,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        couponError,
        isApplyingCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
