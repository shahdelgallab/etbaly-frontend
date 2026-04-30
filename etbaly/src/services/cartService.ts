import api from './api';
import type { ApiSuccess, ApiCart, ApiOrder } from '../types/api';

export interface PrintingProperties {
  material: 'PLA' | 'ABS' | 'PETG' | 'TPU' | 'Resin';
  color?: string; // Color name: 'Red' | 'Green' | 'Blue'
  scale?: number;
  preset?: 'heavy' | 'normal' | 'draft';
  customFields?: Array<{ key: string; value: string }>;
}

export interface AddCartItemPayload {
  itemType: 'Product' | 'Design';
  itemRefId: string;
  quantity: number;
  printingProperties?: PrintingProperties;
}

export interface AddCartItemBySlicingJobPayload {
  slicingJobId: string;
  quantity: number;
}

export type AddCartPayload = AddCartItemPayload | AddCartItemBySlicingJobPayload;

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface CheckoutPayload {
  shippingAddress: {
    street: string;
    city: string;
    country: string;
    zip: string;
  };
  paymentMethod: 'Card' | 'Wallet' | 'COD';
}

// ─── Response wrappers ────────────────────────────────────────────────────────

interface CartData { cart: ApiCart }
interface OrderData { order: ApiOrder }

export const cartService = {
  // GET /api/v1/cart  →  { data: { cart: ApiCart } }
  getCart: () =>
    api.get<ApiSuccess<CartData>>('/cart').then(r => r.data.data.cart),

  // POST /api/v1/cart/items  →  { data: { cart: ApiCart } }
  addItem: (payload: AddCartPayload) =>
    api.post<ApiSuccess<CartData>>('/cart/items', payload)
      .then(r => r.data.data.cart),

  // PATCH /api/v1/cart/items/:id  →  { data: { cart: ApiCart } }
  updateItem: (itemId: string, payload: UpdateCartItemPayload) =>
    api.patch<ApiSuccess<CartData>>(`/cart/items/${itemId}`, payload)
      .then(r => r.data.data.cart),

  // DELETE /api/v1/cart/items/:id  →  { data: { cart: ApiCart } }
  removeItem: (itemId: string) =>
    api.delete<ApiSuccess<CartData>>(`/cart/items/${itemId}`)
      .then(r => r.data.data.cart),

  // DELETE /api/v1/cart  →  no data
  clearCart: () =>
    api.delete<ApiSuccess<null>>('/cart').then(r => r.data),

  // POST /api/v1/cart/checkout  →  { data: { order: ApiOrder } }
  checkout: (payload: CheckoutPayload) =>
    api.post<ApiSuccess<OrderData>>('/cart/checkout', payload)
      .then(r => r.data.data.order),
};
