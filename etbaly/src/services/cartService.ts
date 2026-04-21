import api from './api';
import type { ApiSuccess, ApiCart, ApiCustomization, ApiOrder } from '../types/api';

export interface AddCartItemPayload {
  itemType:       'Product' | 'Design';
  itemRefId:      string;
  quantity:       number;
  materialId?:    string;        // required when itemType === 'Design'
  customization?: ApiCustomization;
}

export interface UpdateCartItemPayload {
  quantity: number;              // API only accepts quantity on PATCH
}

export interface CheckoutPayload {
  shippingAddressId: string;     // _id of a saved address in user's profile
  paymentMethod:     'Card' | 'Wallet' | 'COD';
}

// ─── Response wrappers ────────────────────────────────────────────────────────

interface CartData  { cart: ApiCart }
interface OrderData { order: ApiOrder }

export const cartService = {
  // GET /api/v1/cart  →  { data: { cart: ApiCart } }
  getCart: () =>
    api.get<ApiSuccess<CartData>>('/cart').then(r => r.data.data.cart),

  // POST /api/v1/cart/items  →  { data: { cart: ApiCart } }
  addItem: (payload: AddCartItemPayload) =>
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
