"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type CartItem,
  loadCart,
  makeCartItemId,
  persistCart,
} from "@/lib/cart";

type CartContextType = {
  items: CartItem[];
  /** Total de pares (suma de cantidades) */
  itemCount: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    setItems(loadCart());
  }, []);

  const syncSet = useCallback((next: CartItem[]) => {
    setItems(next);
    persistCart(next);
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "id">) => {
      const id = makeCartItemId(item.planillaId, item.stockItemId, item.talle);
      setItems((prev) => {
        let next: CartItem[];
        const existing = prev.find((i) => i.id === id);
        if (existing) {
          if (item.cantidad <= 0) {
            next = prev.filter((i) => i.id !== id);
          } else {
            next = prev.map((i) =>
              i.id === id ? { ...i, cantidad: item.cantidad } : i
            );
          }
        } else {
          next =
            item.cantidad > 0 ? [...prev, { ...item, id }] : prev;
        }
        persistCart(next);
        return next;
      });
    },
    []
  );

  const updateQuantity = useCallback((id: string, cantidad: number) => {
    setItems((prev) => {
      const next =
        cantidad <= 0
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) => (i.id === id ? { ...i, cantidad } : i));
      persistCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      persistCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    syncSet([]);
  }, [syncSet]);

  const itemCount = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, addItem, updateQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
