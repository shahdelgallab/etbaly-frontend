import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useCartViewModel } from '../../viewmodels/useCartViewModel';
import { AuthenticatedImage } from './AuthenticatedImage';
import { pauseLenis, resumeLenis } from '../../lib/lenis';

export default function CartSidebar() {
  const {
    items, isOpen, closeCart,
    removeItem, updateQty,
    subtotal, shipping, total, totalItems,
  } = useCartViewModel();

  // Lock body scroll + pause Lenis while cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      pauseLenis();
    } else {
      document.body.style.overflow = '';
      resumeLenis();
    }
    return () => {
      document.body.style.overflow = '';
      resumeLenis();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col shadow-2xl"
            style={{
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
            }}
            aria-label="Shopping cart"
            role="dialog"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} className="text-primary" />
                <h2 className="text-base font-semibold text-text font-display">
                  Cart
                  {totalItems > 0 && (
                    <span className="ml-2 text-sm text-text-muted font-normal font-sans">({totalItems} items)</span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="w-8 h-8 rounded-md flex items-center justify-center text-text-muted hover:text-text transition-colors"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Items */}
            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-3"
            >
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted py-16">
                  <ShoppingCart size={48} className="opacity-20" />
                  <p className="text-sm font-sans">Your cart is empty</p>
                  <button onClick={closeCart} className="text-xs text-primary hover:underline font-sans">
                    Continue shopping
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                      className="flex gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        {item.product.imageUrl ? (
                          item.product.imageUrl.includes('/files/proxy') ? (
                            <AuthenticatedImage
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs font-bold font-sans">3D</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate font-sans">{item.product.name}</p>
                        <p className="text-xs text-text-muted mt-0.5 font-sans">{item.product.material}</p>
                        <p className="text-sm font-semibold text-primary mt-1 font-sans">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col items-end justify-between gap-1">
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.product.name}`}
                          className="text-text-muted hover:text-danger transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-primary transition-all"
                            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-sm text-text tabular-nums font-sans">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-primary transition-all"
                            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 space-y-4" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <div className="space-y-2 text-sm font-sans">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0
                        ? <span className="text-success font-medium">Free</span>
                        : `${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-[11px] text-text-muted">Free shipping on orders over $100</p>
                  )}
                  <div className="flex justify-between font-semibold text-text pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <span>Total</span>
                    <span className="text-primary font-bold">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Link to="/checkout" onClick={closeCart}>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors font-sans"
                  >
                    Checkout <ArrowRight size={16} />
                  </motion.button>
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full py-2 text-xs text-text-muted hover:text-text transition-colors font-sans"
                >
                  Continue shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
