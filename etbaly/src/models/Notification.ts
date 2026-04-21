// ─── Notification Types ───────────────────────────────────────────────────────

export type NotificationType =
  | 'order_placed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'model_ready'
  | 'review_reply'
  | 'promo'
  | 'system';

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Deep-link route, e.g. "/profile?tab=orders" */
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
}
