import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, ProductDTO } from '@/types';
import { toast } from '@/store/toast';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: ProductDTO, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        set(state => {
          const existing = state.items.find(i => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock || 99) }
                  : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { product, quantity }], isOpen: true };
        });
        toast.success(
          'Added to Bag',
          `${quantity}× ${product.name} ($${Number(product.price).toFixed(2)})`
        );
      },

      removeItem: productId => {
        const target = get().items.find(i => i.product.id === productId);
        set(state => ({ items: state.items.filter(i => i.product.id !== productId) }));
        if (target) {
          toast.info('Removed from Bag', target.product.name);
        }
      },

      updateQuantity: (productId, quantity) =>
        set(state => ({
          items:
            quantity <= 0
              ? state.items.filter(i => i.product.id !== productId)
              : state.items.map(i => (i.product.id === productId ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),

      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

      total: () =>
        get().items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'pulsestore-cart' }
  )
);
