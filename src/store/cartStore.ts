import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../models/CartItem';
import type { Product } from '../models/Product';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, qty?: number, customModelUrl?: string) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, qty = 1, customModelUrl) => {
        const existing = get().items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + qty }
                : i
            ),
          });
        } else {
          const newItem: CartItem = {
            id:                 crypto.randomUUID(),
            product,
            quantity:           qty,
            customModelUrl,
            unitPriceSnapshot:  product.price,
            addedAt:            new Date(),
          };
          set({ items: [...get().items, newItem] });
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      updateQty: (id, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
        } else {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, quantity: qty } : i
            ),
          });
        }
      },

      clearCart:  () => set({ items: [] }),
      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
    }),
    { name: 'etbaly_cart' }
  )
);
