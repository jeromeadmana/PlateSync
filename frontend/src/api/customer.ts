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
  // Create table session token (admin setup)
  createTableSession: async (tableId: number, hoursValid = 8): Promise<{
    token: string;
    tableId: number;
    tableNumber: string;
    expiresAt: string;
  }> => {
    const response = await customerClient.post<ApiResponse<{
      token: string;
      tableId: number;
      tableNumber: string;
      expiresAt: string;
    }>>(`/table-session/${tableId}`, { hoursValid });
    return response.data.data;
  },

  // Get menu (no token required - public)
  getMenu: async (storeId: number): Promise<MenuItem[]> => {
    const response = await customerClient.get<ApiResponse<MenuItem[]>>(`/menu/${storeId}`);
    return response.data.data;
  },

  // All cart operations now use token instead of tableId
  getCart: async (token: string): Promise<Cart> => {
    const response = await customerClient.get<ApiResponse<Cart>>('/cart', {
      params: { token }
    });
    return response.data.data;
  },

  addToCart: async (
    token: string,
    item: {
      menuItemId: number;
      quantity: number;
      modifiers: { id: number; name: string; extra_price: number }[];
      specialInstructions?: string;
    }
  ): Promise<{ itemId: number }> => {
    const response = await customerClient.post<ApiResponse<{ itemId: number }>>(
      '/cart/items',
      { ...item, token }
    );
    return response.data.data;
  },

  updateCartItem: async (token: string, itemId: number, quantity: number): Promise<void> => {
    await customerClient.put(`/cart/items/${itemId}`, { quantity, token });
  },

  removeFromCart: async (token: string, itemId: number): Promise<void> => {
    await customerClient.delete(`/cart/items/${itemId}`, {
      params: { token }
    });
  },

  callServer: async (token: string): Promise<{ cartId: number }> => {
    const response = await customerClient.post<ApiResponse<{ cartId: number }>>(
      '/cart/call-server',
      { token }
    );
    return response.data.data;
  },

  getCartStatus: async (token: string): Promise<{
    status: string;
    itemCount: number;
    totalAmount: number;
  }> => {
    const response = await customerClient.get<ApiResponse<{
      status: string;
      itemCount: number;
      totalAmount: number;
    }>>('/cart/status', {
      params: { token }
    });
    return response.data.data;
  },
};
