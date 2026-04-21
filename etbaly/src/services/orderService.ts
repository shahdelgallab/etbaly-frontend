import api from './api';
import type { ApiSuccess, ApiOrder, ApiOrderStatus } from '../types/api';

// ─── Response shapes matching the actual API ──────────────────────────────────

interface OrderListData   { orders: ApiOrder[] }
interface OrderData       { order: ApiOrder }
interface AdminOrdersData { orders: ApiOrder[]; total: number; page: number; limit: number }

export interface AdminOrdersQuery {
  status?: ApiOrderStatus;
  page?:   number;
  limit?:  number;
}

export interface AssignJobPayload {
  orderItemId: string;
  machineId:   string;
}

export const orderService = {
  // ── User endpoints ──────────────────────────────────────────────────────────

  // GET /api/v1/orders  →  { data: { orders[] } }
  getMyOrders: () =>
    api.get<ApiSuccess<OrderListData>>('/orders')
      .then(r => r.data.data.orders),

  // GET /api/v1/orders/:id  →  { data: { order: {} } }
  getById: (id: string) =>
    api.get<ApiSuccess<OrderData>>(`/orders/${id}`)
      .then(r => r.data.data.order),

  // ── Admin / Operator endpoints ──────────────────────────────────────────────

  // GET /api/v1/admin/orders  →  { data: { orders[], total, page, limit } }
  getAll: (params?: AdminOrdersQuery) =>
    api.get<ApiSuccess<AdminOrdersData>>('/admin/orders', { params })
      .then(r => r.data),

  // PATCH /api/v1/admin/orders/:id/status
  updateStatus: (id: string, status: ApiOrderStatus) =>
    api.patch<ApiSuccess<OrderData>>(`/admin/orders/${id}/status`, { status })
      .then(r => r.data.data.order),

  // POST /api/v1/admin/orders/:id/assign
  assignJob: (orderId: string, payload: AssignJobPayload) =>
    api.post(`/admin/orders/${orderId}/assign`, payload)
      .then(r => r.data),
};
