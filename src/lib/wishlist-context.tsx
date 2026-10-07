"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface WishlistContextType {
  favorites: string[];
  totalFavorites: number;
  toggleFavorite: (productSlug: string) => void;
  isFavorite: (productSlug: string) => boolean;
  clearFavorites: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "markah_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Carrega favoritos do localStorage na inicialização
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch {
      // Ignora falha de leitura
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Salva favoritos no localStorage e cookie
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(favorites));
      document.cookie = `${WISHLIST_STORAGE_KEY}=${encodeURIComponent(
        JSON.stringify(favorites)
      )}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignora
    }
  }, [favorites, isInitialized]);

  const toggleFavorite = useCallback((productSlug: string) => {
    const slug = productSlug.trim().toLowerCase();
    setFavorites((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      } else {
        return [...prev, slug];
      }
    });
  }, []);

  const isFavorite = useCallback(
    (productSlug: string) => {
      const slug = productSlug.trim().toLowerCase();
      return favorites.includes(slug);
    },
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        favorites,
        totalFavorites: favorites.length,
        toggleFavorite,
        isFavorite,
        clearFavorites,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist deve ser usado dentro de um WishlistProvider");
  }
  return context;
}
