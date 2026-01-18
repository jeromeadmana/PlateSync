export interface User {
  id: number;
  company_id: number;
  store_id: number | null;
  email: string;
  name: string;
  employee_id: string;
  role: 'super_admin' | 'company_admin' | 'store_admin' | 'cashier' | 'cook' | 'server';
  status: 'active' | 'disabled';
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  store_id: number;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Modifier {
  id: number;
  menu_item_id: number;
  name: string;
  extra_price: number;
  created_at: string;
}

export interface MenuItem {
  id: number;
  store_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  status: 'active' | 'inactive' | 'sold_out';
  created_at: string;
  updated_at: string;
  modifiers?: Modifier[];
}

export interface CartItemModifier {
  id: number;
  name: string;
  extra_price: number;
}

export interface CartItem {
  id: number;
  cart_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  modifiers: CartItemModifier[];
  special_instructions: string | null;
  name?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: number;
  table_id: number;
  store_id: number;
  status: 'draft' | 'ready_for_review' | 'reviewed' | 'submitted';
  total_amount: number;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  modifiers: CartItemModifier[];
  special_instructions: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'cancelled';
  name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  store_id: number;
  server_id: number | null;
  table_id: number | null;
  customer_cart_id: number | null;
  order_number: string;
  status: 'received' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  total_amount: number;
  order_time: string;
  completed_time: string | null;
  server_name?: string;
  table_number?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: number;
  store_id: number;
  table_number: string;
  status: 'available' | 'occupied' | 'reserved';
  tablet_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: number;
  company_id: number | null;
  store_id: number | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  font_family: string;
  heading_font: string;
  logo_url: string | null;
  logo_small_url: string | null;
  favicon_url: string | null;
  splash_screen_url: string | null;
  customer_welcome_message: string;
  border_radius: string;
  button_style: 'rounded' | 'sharp' | 'pill';
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  code: string;
  details?: Record<string, unknown>;
}
