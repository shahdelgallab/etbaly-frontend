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

const MATERIAL_BADGE: Record<string, string> = {
  PLA:   'bg-green-500/15  text-green-400  border-green-500/30',
  ABS:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
  PETG:  'bg-blue-500/15   text-blue-400   border-blue-500/30',
  Resin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  TPU:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Nylon: 'bg-pink-500/15   text-pink-400   border-pink-500/30',
};

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
  const badgeClass = MATERIAL_BADGE[product.material] ?? 'bg-primary/15 text-primary border-primary/30';

  if (view === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ x: 3 }}
        className="glass border border-border rounded-2xl overflow-hidden flex gap-4 p-4 group hover:border-primary/40 hover:shadow-glow-sm transition-all"
      >
        {/* Thumbnail — links to detail */}
        <Link to={`/products/${product.id}`} className="w-24 h-24 rounded-xl overflow-hidden bg-surface flex-shrink-0 block">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/30 font-orbitron text-xl">3D</div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link to={`/products/${product.id}`}>
                <h3 className="font-exo font-semibold text-text text-sm leading-tight truncate hover:text-primary transition-colors">{product.name}</h3>
              </Link>
              <span className="font-orbitron text-base font-bold text-primary shrink-0">${product.price.toFixed(2)}</span>
            </div>
            <p className="text-xs text-text-muted font-exo line-clamp-1 mt-0.5">{product.description}</p>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-exo font-medium border ${badgeClass}`}>{product.material}</span>
              <div className="flex items-center gap-0.5">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-text-muted font-exo">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-text-muted font-exo">({product.reviewCount})</span>
              </div>
              {outOfStock && <span className="text-[11px] text-red-400 font-exo">Out of stock</span>}
            </div>

            <AddButton added={added} outOfStock={outOfStock} onClick={handleAdd} />
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Grid view ──
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass border border-border rounded-2xl overflow-hidden group flex flex-col hover:border-primary/40 hover:shadow-glow-sm transition-all"
    >
      {/* Image — links to detail */}
      <Link to={`/products/${product.id}`} className="relative h-48 overflow-hidden bg-surface flex-shrink-0 block">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/20 font-orbitron text-5xl">3D</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 left-3">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-exo font-medium border ${badgeClass}`}>{product.material}</span>
        </div>
        {product.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-exo font-medium bg-accent/20 text-accent border border-accent/30">Featured</span>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="font-orbitron text-xs text-white/80 tracking-wider">OUT OF STOCK</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-exo font-semibold text-text text-sm leading-snug hover:text-primary transition-colors">{product.name}</h3>
          </Link>
          <p className="text-xs text-text-muted font-exo line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-text-muted font-exo mt-auto">
          <div className="flex items-center gap-0.5">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="opacity-60">({product.reviewCount})</span>
          </div>
          {product.printTimeHours && (
            <div className="flex items-center gap-0.5">
              <Clock size={11} className="text-text-muted" />
              <span>{product.printTimeHours}h</span>
            </div>
          )}
          <div className="flex items-center gap-0.5 ml-auto">
            <Package size={11} className="text-text-muted" />
            <span>{product.stock > 0 ? `${product.stock} left` : 'Sold out'}</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="font-orbitron text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
          <AddButton added={added} outOfStock={outOfStock} onClick={handleAdd} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add to cart button with confirmation state ───────────────────────────────

function AddButton({ added, outOfStock, onClick }: { added: boolean; outOfStock: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={outOfStock ? {} : { scale: 1.05 }}
      whileTap={outOfStock ? {} : { scale: 0.95 }}
      onClick={onClick}
      disabled={outOfStock}
      aria-label="Add to cart"
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-exo transition-all',
        outOfStock
          ? 'bg-border/30 text-text-muted cursor-not-allowed'
          : added
          ? 'bg-green-500/20 border border-green-500/40 text-green-400'
          : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white hover:shadow-glow-sm',
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
