import type { CartItem } from './CartItem';
import type { Address } from './User';

// ─── Order Status ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'printing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentMethod = 'card' | 'cod' | 'paypal';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

export interface PaymentDetails {
  method: PaymentMethod;
  status: PaymentStatus;
  /** Last 4 digits of card, if applicable */
  cardLast4?: string;
  transactionId?: string;
  paidAt?: Date;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  shipping: Address;
  payment: PaymentDetails;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  /** Tracking number once shipped */
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ─── Order Create Payload ─────────────────────────────────────────────────────

export interface CreateOrderPayload {
  items: CartItem[];
  shipping: Address;
  paymentMethod: PaymentMethod;
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

export interface OrderStatusEvent {
  status: OrderStatus;
  message: string;
  timestamp: Date;
}
