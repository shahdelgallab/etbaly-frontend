import { useMemo } from 'react';
import { useCartStore } from '../store/cartStore';

export function useCartViewModel() {
  const store = useCartStore();

  const totalItems = useMemo(
    () => store.items.reduce((sum, i) => sum + i.quantity, 0),
    [store.items]
  );

  const subtotal = useMemo(
    () => store.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [store.items]
  );

  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  return {
    items: store.items,
    isOpen: store.isOpen,
    totalItems,
    subtotal,
    shipping,
    total,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQty: store.updateQty,
    clearCart: store.clearCart,
    openCart: store.openCart,
    closeCart: store.closeCart,
  };
}
