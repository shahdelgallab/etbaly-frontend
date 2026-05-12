import type { Product, MaterialType, PrintQuality } from './Product';

// ─── Cart Item ────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  /** Overrides product.material when user selects a different one */
  selectedMaterial?: MaterialType;
  /** Hex color chosen by the user */
  customColor?: string;
  /** URL to a user-uploaded custom model file */
  customModelUrl?: string;
  /** Print quality override */
  printQuality?: PrintQuality;
  /** Unit price at the time of adding (snapshot to avoid price drift) */
  unitPriceSnapshot: number;
  addedAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function cartItemTotal(item: CartItem): number {
  return item.unitPriceSnapshot * item.quantity;
}
