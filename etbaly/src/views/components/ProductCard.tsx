import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Check, Clock, Package } from 'lucide-react';
import type { Product } from '../../models/Product';
import { useCartViewModel } from '../../viewmodels/useCartViewModel';

interface Props {
  product: Product;
  view?: 'grid' | 'list';
}

export default function ProductCard({ product, view = 'grid' }: Props) {
  const { addItem, openCart } = useCartViewModel();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const outOfStock = product.stock === 0;

  if (view === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl overflow-hidden flex gap-4 p-4 group hover:shadow-card-hover hover:border-primary hover:-translate-y-0.5 transition-all duration-200"
      >
        <Link to={`/products/${product.id}`} className="w-20 h-20 rounded-lg overflow-hidden bg-[var(--color-surface)] flex-shrink-0 block border border-[var(--color-border)]">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted font-bold text-xl font-sans">3D</div>
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link to={`/products/${product.id}`}>
                <h3 className="font-semibold text-text text-sm leading-tight truncate hover:text-primary transition-colors font-sans">{product.name}</h3>
              </Link>
              <span className="text-base font-bold text-primary shrink-0 font-sans">${product.price.toFixed(2)}</span>
            </div>
            <p className="text-xs text-text-muted line-clamp-1 mt-0.5 font-sans">{product.description}</p>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium font-sans" style={{ background: '#e0cdb8', color: '#1a1a1a' }}>{product.material}</span>
              <div className="flex items-center gap-0.5">
                <Star size={11} className="text-primary fill-primary" />
                <span className="text-xs text-text-muted font-sans">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-text-muted font-sans">({product.reviewCount})</span>
              </div>
              {outOfStock && <span className="text-[11px] text-danger font-sans">Out of stock</span>}
            </div>
            <AddButton added={added} outOfStock={outOfStock} onClick={handleAdd} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl overflow-hidden group flex flex-col hover:shadow-card-hover hover:border-primary hover:-translate-y-1 transition-all duration-200"
    >
      <Link to={`/products/${product.id}`} className="relative h-48 overflow-hidden bg-[var(--color-surface)] flex-shrink-0 block">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted font-bold text-5xl font-sans">3D</div>
        )}
        <div className="absolute top-3 left-3">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium font-sans" style={{ background: '#e0cdb8', color: '#1a1a1a' }}>{product.material}</span>
        </div>
        {product.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/15 text-primary font-sans">Featured</span>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-xs text-white font-semibold tracking-wider bg-black/60 px-3 py-1 rounded-md font-sans">OUT OF STOCK</span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-semibold text-text text-sm leading-snug hover:text-primary transition-colors font-sans">{product.name}</h3>
          </Link>
          <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed font-sans">{product.description}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted mt-auto font-sans">
          <div className="flex items-center gap-0.5">
            <Star size={11} className="text-primary fill-primary" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="opacity-60">({product.reviewCount})</span>
          </div>
          {product.printTimeHours && (
            <div className="flex items-center gap-0.5">
              <Clock size={11} />
              <span>{product.printTimeHours}h</span>
            </div>
          )}
          <div className="flex items-center gap-0.5 ml-auto">
            <Package size={11} />
            <span>{product.stock > 0 ? `${product.stock} left` : 'Sold out'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
          <span className="text-lg font-bold text-primary font-sans">${product.price.toFixed(2)}</span>
          <AddButton added={added} outOfStock={outOfStock} onClick={handleAdd} />
        </div>
      </div>
    </motion.div>
  );
}

function AddButton({ added, outOfStock, onClick }: { added: boolean; outOfStock: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={outOfStock ? {} : { scale: 1.03 }}
      whileTap={outOfStock ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={outOfStock}
      aria-label="Add to cart"
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all font-sans',
        outOfStock
          ? 'bg-[var(--color-surface)] text-text-muted cursor-not-allowed border border-[var(--color-border)]'
          : added
          ? 'bg-success/10 border border-success/30 text-success'
          : 'bg-primary text-white hover:bg-primary-hover',
      ].join(' ')}
    >
      <AnimatePresence mode="wait" initial={false}>
        {added ? (
          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
            <Check size={12} /> Added
          </motion.span>
        ) : (
          <motion.span key="cart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
            <ShoppingCart size={12} /> Add
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
