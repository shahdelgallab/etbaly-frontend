import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartViewModel } from '../../viewmodels/useCartViewModel';

export default function CartSidebar() {
  const {
    items, isOpen, closeCart,
    removeItem, updateQty,
    subtotal, shipping, total, totalItems,
  } = useCartViewModel();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 backdrop-blur-sm"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md glass border-l border-border flex flex-col"
            aria-label="Shopping cart"
            role="dialog"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} className="text-primary" />
                <h2 className="font-orbitron text-base font-semibold text-text">
                  Cart
                  {totalItems > 0 && (
                    <span className="ml-2 text-primary">({totalItems})</span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="w-8 h-8 rounded-full glass border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted py-16">
                  <ShoppingCart size={52} className="opacity-20" />
                  <p className="font-exo text-sm">Your cart is empty</p>
                  <button
                    onClick={closeCart}
                    className="text-xs text-primary hover:underline font-exo"
                  >
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
                      className="flex gap-3 p-3 glass rounded-xl border border-border"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg bg-surface overflow-hidden flex-shrink-0 border border-border/50">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-orbitron">
                            3D
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate font-exo">{item.product.name}</p>
                        <p className="text-xs text-text-muted font-exo mt-0.5">{item.product.material}</p>
                        <p className="text-sm font-semibold text-primary mt-1 font-orbitron">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col items-end justify-between gap-1">
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.product.name}`}
                          className="text-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded-md glass border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-sm font-exo text-text tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="w-6 h-6 rounded-md glass border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all"
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
              <div className="px-6 py-5 border-t border-border space-y-4">
                {/* Totals */}
                <div className="space-y-2 text-sm font-exo">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0
                        ? <span className="text-green-400 font-medium">Free</span>
                        : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-[11px] text-text-muted/70">
                      Free shipping on orders over $100
                    </p>
                  )}
                  <div className="flex justify-between font-semibold text-text pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary font-orbitron">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* CTA */}
                <Link to="/checkout" onClick={closeCart}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all"
                  >
                    Checkout <ArrowRight size={16} />
                  </motion.button>
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full py-2 text-xs text-text-muted hover:text-text font-exo transition-colors"
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
