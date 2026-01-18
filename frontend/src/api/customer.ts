import axios from 'axios';
import type { ApiResponse, MenuItem, Cart } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const customerClient = axios.create({
  baseURL: `${API_URL}/api/customer`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const customerApi = {
  getMenu: async (tableId: number): Promise<MenuItem[]> => {
    const response = await customerClient.get<ApiResponse<MenuItem[]>>(`/menu/${tableId}`);
    return response.data.data;
  },

  getCart: async (tableId: number): Promise<Cart> => {
    const response = await customerClient.get<ApiResponse<Cart>>(`/cart/${tableId}`);
    return response.data.data;
  },

  addToCart: async (
    tableId: number,
    item: {
      menuItemId: number;
      quantity: number;
      modifiers: { id: number; name: string; extra_price: number }[];
      specialInstructions?: string;
    }
  ): Promise<{ itemId: number }> => {
    const response = await customerClient.post<ApiResponse<{ itemId: number }>>(
      `/cart/${tableId}/items`,
      item
    );
    return response.data.data;
  },

  updateCartItem: async (tableId: number, itemId: number, quantity: number): Promise<void> => {
    await customerClient.put(`/cart/${tableId}/items/${itemId}`, { quantity });
  },

  removeFromCart: async (tableId: number, itemId: number): Promise<void> => {
    await customerClient.delete(`/cart/${tableId}/items/${itemId}`);
  },

  callServer: async (tableId: number): Promise<{ cartId: number }> => {
    const response = await customerClient.post<ApiResponse<{ cartId: number }>>(
      `/cart/${tableId}/call-server`
    );
    return response.data.data;
  },
};
