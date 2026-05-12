import { useMemo, useCallback } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  openCart as reduxOpenCart,
  closeCart as reduxCloseCart,
  fetchCartThunk,
  addCartItemThunk,
  updateCartItemThunk,
  removeCartItemThunk,
  clearCartThunk,
} from '../store/slices/cartSlice';
import { getDirectImageUrl } from '../utils/imageUtils';
import type { AddCartItemPayload } from '../services/cartService';
import type { Product } from '../models/Product';

// ─── Unified cart item shape for the UI ──────────────────────────────────────

export interface UiCartItem {
  /** The cart item's own _id (backend) or local uuid (guest) */
  id: string;
  product: {
    name:     string;
    imageUrl: string;
    material: string;
    price:    number;
  };
  quantity: number;
}

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useCartViewModel() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);
  const isAuthenticated = Boolean(user);

  // ── Redux (backend) cart ──────────────────────────────────────────────────
  const reduxCart   = useAppSelector(s => s.cart.cart);
  const reduxIsOpen = useAppSelector(s => s.cart.isOpen);

  // ── Zustand (guest) cart ──────────────────────────────────────────────────
  const zustandStore = useCartStore();

  // ── Unified items list ────────────────────────────────────────────────────
  const items: UiCartItem[] = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_URL as string ?? '';
    if (isAuthenticated && reduxCart) {
      return reduxCart.items.map(item => ({
        id:       item._id,
        product: {
          // Use itemName (API field) then name fallback
          name:     item.itemName ?? item.name ?? 'Custom Design',
          // Proxy Google Drive thumbnail URLs through the backend
          imageUrl: item.thumbnailUrl ? getDirectImageUrl(item.thumbnailUrl, apiBase) : '',
          material: item.printingProperties?.material ?? '',
          price:    item.unitPrice,
        },
        quantity: item.quantity,
      }));
    }
    // Guest: map Zustand CartItem → UiCartItem
    return zustandStore.items.map(i => ({
      id:       i.id,
      product: {
        name:     i.product.name,
        imageUrl: i.product.imageUrl,
        material: i.product.material,
        price:    i.product.price,
      },
      quantity: i.quantity,
    }));
  }, [isAuthenticated, reduxCart, zustandStore.items]);

  const isOpen = isAuthenticated ? reduxIsOpen : zustandStore.isOpen;

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    if (isAuthenticated && reduxCart) {
      return reduxCart.pricingSummary.subtotal;
    }
    return zustandStore.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  }, [isAuthenticated, reduxCart, zustandStore.items]);

  const shipping = useMemo(() => {
    if (isAuthenticated && reduxCart) {
      return reduxCart.pricingSummary.shippingCost;
    }
    return subtotal > 100 ? 0 : 9.99;
  }, [isAuthenticated, reduxCart, subtotal]);

  const total = useMemo(() => {
    if (isAuthenticated && reduxCart) {
      return reduxCart.pricingSummary.total;
    }
    return subtotal + shipping;
  }, [isAuthenticated, reduxCart, subtotal, shipping]);

  const totalItems = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items],
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const openCart = useCallback(() => {
    if (isAuthenticated) dispatch(reduxOpenCart());
    else zustandStore.openCart();
  }, [isAuthenticated, dispatch, zustandStore]);

  const closeCart = useCallback(() => {
    if (isAuthenticated) dispatch(reduxCloseCart());
    else zustandStore.closeCart();
  }, [isAuthenticated, dispatch, zustandStore]);

  /**
   * Add a product to cart.
   * Authenticated → POST /cart/items via Redux thunk.
   * Guest → Zustand local store.
   */
  const addItem = useCallback((product: Product, qty = 1, _customModelUrl?: string) => {
    if (isAuthenticated) {
      // For products we need the backend product ID — product.id is the _id
      const payload: AddCartItemPayload = {
        itemType:  'Product',
        itemRefId: product.id,
        quantity:  qty,
        printingProperties: {
          material: product.material as 'PLA' | 'ABS' | 'PETG' | 'TPU' | 'Resin',
        },
      };
      // cartSlice sets isOpen=true on fulfilled — no need to call openCart() separately
      dispatch(addCartItemThunk(payload));
    } else {
      zustandStore.addItem(product, qty, _customModelUrl);
      zustandStore.openCart();
    }
  }, [isAuthenticated, dispatch, zustandStore]);

  /**
   * Update quantity of a cart item.
   * Authenticated → PATCH /cart/items/:id.
   * Guest → Zustand.
   */
  const updateQty = useCallback((id: string, qty: number) => {
    if (isAuthenticated) {
      if (qty <= 0) {
        dispatch(removeCartItemThunk(id));
      } else {
        dispatch(updateCartItemThunk({ itemId: id, quantity: qty }));
      }
    } else {
      zustandStore.updateQty(id, qty);
    }
  }, [isAuthenticated, dispatch, zustandStore]);

  /**
   * Remove a single item.
   * Authenticated → DELETE /cart/items/:id.
   * Guest → Zustand.
   */
  const removeItem = useCallback((id: string) => {
    if (isAuthenticated) {
      dispatch(removeCartItemThunk(id));
    } else {
      zustandStore.removeItem(id);
    }
  }, [isAuthenticated, dispatch, zustandStore]);

  /**
   * Clear the entire cart.
   * Authenticated → DELETE /cart.
   * Guest → Zustand.
   */
  const clearCart = useCallback(() => {
    if (isAuthenticated) {
      dispatch(clearCartThunk());
    } else {
      zustandStore.clearCart();
    }
  }, [isAuthenticated, dispatch, zustandStore]);

  /**
   * Refresh cart from backend (authenticated only).
   */
  const refreshCart = useCallback(() => {
    if (isAuthenticated) dispatch(fetchCartThunk());
  }, [isAuthenticated, dispatch]);

  return {
    items,
    isOpen,
    totalItems,
    subtotal,
    shipping,
    total,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    openCart,
    closeCart,
    refreshCart,
  };
}
