import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  qty: number;
  variantId?: string;
  size?: string;
  color?: string;
  /** Unique per product+variant combo — used for cart line matching/removal */
  lineId: string;
}

function makeLineId(id: number, variantId?: string) {
  return variantId ? `${id}::${variantId}` : String(id);
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "qty" | "lineId">) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const lineId = makeLineId(item.id, item.variantId);
        const items = get().items;
        const existing = items.find((i) => i.lineId === lineId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, qty: 1, lineId }] });
        }
        set({ isOpen: true });
      },

      removeItem: (lineId) => {
        set({ items: get().items.filter((i) => i.lineId !== lineId) });
      },

      updateQty: (lineId, qty) => {
        if (qty <= 0) {
          get().removeItem(lineId);
          return;
        }
        set({
          items: get().items.map((i) => (i.lineId === lineId ? { ...i, qty } : i)),
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "ltronics-cart" }
  )
);
