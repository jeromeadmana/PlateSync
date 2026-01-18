import { create } from 'zustand';
import { customerApi } from '../api/customer';
import type { Cart } from '../types';

interface CartStore {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  loadCart: (tableId: number) => Promise<void>;
  addItem: (
    tableId: number,
    menuItemId: number,
    quantity: number,
    modifiers: { id: number; name: string; extra_price: number }[],
    specialInstructions?: string
  ) => Promise<void>;
  updateItem: (tableId: number, itemId: number, quantity: number) => Promise<void>;
  removeItem: (tableId: number, itemId: number) => Promise<void>;
  callServer: (tableId: number) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  loadCart: async (tableId: number) => {
    set({ isLoading: true, error: null });
    try {
      const cart = await customerApi.getCart(tableId);
      set({ cart, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addItem: async (tableId, menuItemId, quantity, modifiers, specialInstructions) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.addToCart(tableId, {
        menuItemId,
        quantity,
        modifiers,
        specialInstructions,
      });
      await get().loadCart(tableId);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateItem: async (tableId, itemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.updateCartItem(tableId, itemId, quantity);
      await get().loadCart(tableId);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  removeItem: async (tableId, itemId) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.removeFromCart(tableId, itemId);
      await get().loadCart(tableId);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  callServer: async (tableId) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.callServer(tableId);
      await get().loadCart(tableId);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearCart: () => {
    set({ cart: null, error: null });
  },
}));
