import { create } from 'zustand';
import { customerApi } from '../api/customer';
import type { Cart } from '../types';

interface CartStore {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  loadCart: (token: string) => Promise<void>;
  addItem: (
    token: string,
    menuItemId: number,
    quantity: number,
    modifiers: { id: number; name: string; extra_price: number }[],
    specialInstructions?: string
  ) => Promise<void>;
  updateItem: (token: string, itemId: number, quantity: number) => Promise<void>;
  removeItem: (token: string, itemId: number) => Promise<void>;
  callServer: (token: string) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  loadCart: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const cart = await customerApi.getCart(token);
      set({ cart, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addItem: async (token, menuItemId, quantity, modifiers, specialInstructions) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.addToCart(token, {
        menuItemId,
        quantity,
        modifiers,
        specialInstructions,
      });
      await get().loadCart(token);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateItem: async (token, itemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.updateCartItem(token, itemId, quantity);
      await get().loadCart(token);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  removeItem: async (token, itemId) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.removeFromCart(token, itemId);
      await get().loadCart(token);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  callServer: async (token) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.callServer(token);
      await get().loadCart(token);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearCart: () => {
    set({ cart: null, error: null });
  },
}));
