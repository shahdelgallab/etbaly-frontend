import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Star, Clock, Package,
  Layers, Zap, ChevronRight, Plus, Minus, Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useProductDetailViewModel,
  MATERIAL_MULTIPLIERS,
  QUALITY_MULTIPLIERS,
  SIZE_OPTIONS,
} from '../../viewmodels/useProductDetailViewModel';
import PageWrapper from '../components/PageWrapper';
import ModelViewer from '../components/ModelViewer';
import type { MaterialType, PrintQuality } from '../../models/Product';

// ─── Constants ────────────────────────────────────────────────────────────────

const MATERIALS: MaterialType[] = ['PLA', 'ABS', 'PETG', 'Resin', 'TPU', 'Nylon'];

const MATERIAL_META: Record<MaterialType, { color: string; desc: string }> = {
  PLA:   { color: 'border-green-500/50  bg-green-500/10  text-green-400',  desc: 'Biodegradable, easy to print, great for decorative items'   },
  ABS:   { color: 'border-orange-500/50 bg-orange-500/10 text-orange-400', desc: 'Durable & heat-resistant, ideal for functional parts'        },
  PETG:  { color: 'border-blue-500/50   bg-blue-500/10   text-blue-400',   desc: 'Strong, flexible, food-safe — best all-rounder'             },
  Resin: { color: 'border-purple-500/50 bg-purple-500/10 text-purple-400', desc: 'Ultra-fine detail, smooth surface finish'                   },
  TPU:   { color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400', desc: 'Flexible & rubber-like, perfect for grips & gaskets'        },
  Nylon: { color: 'border-pink-500/50   bg-pink-500/10   text-pink-400',   desc: 'Tough, wear-resistant, great for mechanical parts'          },
};

const QUALITY_META: Record<PrintQuality, { label: string; desc: string }> = {
  draft:    { label: 'Draft',    desc: 'Fast · visible layers'       },
  standard: { label: 'Standard', desc: 'Balanced quality & speed'    },
  high:     { label: 'High',     desc: 'Fine detail · slower'        },
  ultra:    { label: 'Ultra',    desc: 'Max detail · longest time'   },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="shimmer rounded-2xl h-96" />
        <div className="space-y-4">
          <div className="shimmer h-8 w-3/4 rounded-xl" />
          <div className="shimmer h-4 w-1/2 rounded-lg" />
          <div className="shimmer h-24 rounded-xl" />
          <div className="shimmer h-40 rounded-xl" />
          <div className="shimmer h-12 rounded-xl" />
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── Price breakdown tooltip ──────────────────────────────────────────────────

function PriceBreakdown({ base, material, quality, size, final }: {
  base: number; material: MaterialType; quality: PrintQuality; size: number; final: number;
}) {
  const mMul = MATERIAL_MULTIPLIERS[material];
  const qMul = QUALITY_MULTIPLIERS[quality];
  const sMul = size / 100;

  return (
    <div className="glass border border-border rounded-xl p-4 space-y-2 text-xs font-exo">
      <p className="font-orbitron text-xs text-text-muted tracking-wider mb-3">PRICE BREAKDOWN</p>
      <div className="flex justify-between text-text-muted">
        <span>Base price</span><span>${base.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-text-muted">
        <span>Material ({material})</span>
        <span className={mMul > 1 ? 'text-orange-400' : 'text-green-400'}>
          ×{mMul.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between text-text-muted">
        <span>Quality ({QUALITY_META[quality].label})</span>
        <span className={qMul > 1 ? 'text-orange-400' : 'text-green-400'}>
          ×{qMul.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between text-text-muted">
        <span>Size ({size}%)</span>
        <span className={sMul > 1 ? 'text-orange-400' : 'text-green-400'}>
          ×{(SIZE_OPTIONS.includes(size as typeof SIZE_OPTIONS[number])
            ? [0.55,0.75,1,1.30,1.65,2.05,2.50][SIZE_OPTIONS.indexOf(size as typeof SIZE_OPTIONS[number])]
            : 1).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between font-semibold text-text pt-2 border-t border-border">
        <span>Total</span><span className="text-primary font-orbitron">${final.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const vm = useProductDetailViewModel();

  if (vm.loading) return <Skeleton />;

  if (vm.notFound || !vm.product) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Package size={52} className="text-text-muted/30 mx-auto" />
          <p className="font-orbitron text-lg text-text">Product not found</p>
          <Link to="/products" className="text-primary hover:underline font-exo text-sm">Back to collections</Link>
        </div>
      </PageWrapper>
    );
  }

  const p = vm.product;
  const outOfStock = p.stock === 0;

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-exo text-text-muted mb-8" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-primary transition-colors">Collections</Link>
          <ChevronRight size={12} />
          <Link to={`/products?collection=${encodeURIComponent(p.collection)}`} className="hover:text-primary transition-colors">{p.collection}</Link>
          <ChevronRight size={12} />
          <span className="text-text truncate max-w-32">{p.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* ── Left: 3D viewer + image gallery ── */}
          <div className="space-y-3 lg:sticky lg:top-24">
            {/* 3D viewer — shown when design fileUrl is available */}
            {vm.modelLoading && (
              <div className="shimmer rounded-2xl w-full" style={{ height: '380px' }} aria-label="Loading 3D model" />
            )}
            {!vm.modelLoading && vm.modelUrl && (
              <ModelViewer modelUrl={vm.modelUrl} height="380px" autoRotate />
            )}

            {/* Fallback main image — shown when no 3D model */}
            {!vm.modelLoading && !vm.modelUrl && (
              <motion.div
                key={vm.activeImage}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-2xl overflow-hidden bg-surface border border-border aspect-square"
              >
                {vm.images[vm.activeImage] ? (
                  <img src={vm.images[vm.activeImage]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/20 font-orbitron text-6xl">3D</div>
                )}
                {p.isFeatured && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-accent/20 border border-accent/40 text-accent text-xs font-orbitron rounded-full">
                    Featured
                  </span>
                )}
              </motion.div>
            )}

            {/* Image thumbnails — always shown below viewer */}
            {vm.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {vm.images.map((img, i) => (
                  <button key={i} onClick={() => vm.setActiveImage(i)} aria-label={`View image ${i + 1}`}
                    className={['w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all',
                      vm.activeImage === i ? 'border-primary shadow-glow-sm' : 'border-border hover:border-primary/50'].join(' ')}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: details + configurator ── */}
          <div className="space-y-6">

            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-text leading-tight">{p.name}</h1>
                <button onClick={vm.goBack} aria-label="Go back" className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors font-exo shrink-0 mt-1">
                  <ArrowLeft size={13} /> Back
                </button>
              </div>

              {/* Rating + meta */}
              <div className="flex items-center gap-4 text-sm font-exo text-text-muted flex-wrap">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < Math.round(p.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-border'} />
                  ))}
                  <span className="ml-1">{p.rating.toFixed(1)}</span>
                  <span className="opacity-60">({p.reviewCount} reviews)</span>
                </div>
                {p.printTimeHours && (
                  <div className="flex items-center gap-1">
                    <Clock size={13} />
                    <span>~{vm.computedPrintTime ?? p.printTimeHours}h print time</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Package size={13} />
                  <span className={outOfStock ? 'text-red-400' : 'text-green-400'}>
                    {outOfStock ? 'Out of stock' : `${p.stock} in stock`}
                  </span>
                </div>
              </div>

              <p className="text-text-muted font-exo text-sm leading-relaxed mt-3">{p.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 glass border border-border rounded-full text-[11px] text-text-muted font-exo">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Material selector ── */}
            <div>
              <label className="block font-orbitron text-xs font-semibold text-text-muted tracking-wider mb-3">
                MATERIAL
                <span className="ml-2 text-primary font-exo normal-case tracking-normal">
                  {vm.material !== p.material && `(×${MATERIAL_MULTIPLIERS[vm.material].toFixed(2)} cost)`}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MATERIALS.map(mat => {
                  const meta = MATERIAL_META[mat];
                  const active = vm.material === mat;
                  return (
                    <motion.button
                      key={mat}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => vm.setMaterial(mat)}
                      className={[
                        'relative flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all',
                        active ? meta.color : 'border-border glass text-text-muted hover:border-primary/40',
                      ].join(' ')}
                    >
                      {active && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check size={9} className="text-white" />
                        </span>
                      )}
                      <span className="text-xs font-orbitron font-semibold">{mat}</span>
                      <span className="text-[10px] font-exo mt-0.5 opacity-70 leading-tight">{meta.desc.split(',')[0]}</span>
                    </motion.button>
                  );
                })}
              </div>
              {/* Material description */}
              <p className="mt-2 text-xs text-text-muted font-exo">{MATERIAL_META[vm.material].desc}</p>
            </div>

            {/* ── Print quality ── */}
            <div>
              <label className="block font-orbitron text-xs font-semibold text-text-muted tracking-wider mb-3">
                PRINT QUALITY
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(QUALITY_META) as PrintQuality[]).map(q => {
                  const active = vm.quality === q;
                  const mul = QUALITY_MULTIPLIERS[q];
                  return (
                    <motion.button
                      key={q}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => vm.setQuality(q)}
                      className={[
                        'flex flex-col items-start px-3 py-2.5 rounded-xl border transition-all',
                        active ? 'border-primary bg-primary/10 text-primary' : 'border-border glass text-text-muted hover:border-primary/40',
                      ].join(' ')}
                    >
                      <span className="text-xs font-orbitron font-semibold">{QUALITY_META[q].label}</span>
                      <span className="text-[10px] font-exo mt-0.5 opacity-70">{QUALITY_META[q].desc}</span>
                      <span className={`text-[10px] font-exo mt-1 font-medium ${mul > 1 ? 'text-orange-400' : mul < 1 ? 'text-green-400' : 'text-text-muted'}`}>
                        {mul > 1 ? `+${Math.round((mul - 1) * 100)}%` : mul < 1 ? `-${Math.round((1 - mul) * 100)}%` : 'base'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ── Size selector ── */}
            <div>
              <label className="block font-orbitron text-xs font-semibold text-text-muted tracking-wider mb-3">
                SIZE — <span className="text-primary">{vm.size}%</span>
                {p.dimensions && (
                  <span className="ml-2 text-text-muted font-exo normal-case tracking-normal text-[11px]">
                    ({Math.round(p.dimensions.width * vm.size / 100)} × {Math.round(p.dimensions.height * vm.size / 100)} × {Math.round(p.dimensions.depth * vm.size / 100)} {p.dimensions.unit})
                  </span>
                )}
              </label>

              {/* Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={25}
                  value={vm.size}
                  onChange={e => vm.setSize(Number(e.target.value) as typeof vm.size)}
                  className="w-full accent-primary cursor-pointer"
                  aria-label="Size percentage"
                />
                {/* Tick labels */}
                <div className="flex justify-between text-[10px] text-text-muted font-exo px-0.5">
                  {SIZE_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => vm.setSize(s)}
                      className={`transition-colors ${vm.size === s ? 'text-primary font-semibold' : 'hover:text-text'}`}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Quantity ── */}
            <div>
              <label className="block font-orbitron text-xs font-semibold text-text-muted tracking-wider mb-3">QUANTITY</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center glass border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => vm.setQuantity(Math.max(1, vm.quantity - 1))}
                    aria-label="Decrease quantity"
                    className="px-3 py-2.5 text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 py-2.5 font-orbitron text-sm font-bold text-text min-w-[3rem] text-center tabular-nums">
                    {vm.quantity}
                  </span>
                  <button
                    onClick={() => vm.setQuantity(Math.min(p.stock || 99, vm.quantity + 1))}
                    aria-label="Increase quantity"
                    className="px-3 py-2.5 text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-xs text-text-muted font-exo">
                  {p.stock > 0 ? `${p.stock} available` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* ── Price + CTA ── */}
            <div className="space-y-4 pt-2">
              {/* Live price */}
              <div className="flex items-end gap-3">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={vm.computedPrice.toFixed(2)}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="font-orbitron text-4xl font-black text-accent-3"
                  >
                    ${vm.computedPrice.toFixed(2)}
                  </motion.span>
                </AnimatePresence>
                {vm.computedPrice !== p.price && (
                  <span className="text-sm text-text-muted font-exo line-through mb-1">${p.price.toFixed(2)}</span>
                )}
                <span className="text-xs text-text-muted font-exo mb-1">per unit</span>
              </div>

              {/* Total if qty > 1 */}
              {vm.quantity > 1 && (
                <p className="text-sm text-text-muted font-exo">
                  Total: <span className="text-primary font-orbitron font-semibold">${(vm.computedPrice * vm.quantity).toFixed(2)}</span>
                </p>
              )}

              {/* Price breakdown */}
              {(vm.material !== p.material || vm.quality !== 'standard' || vm.size !== 100) && (
                <PriceBreakdown
                  base={p.price}
                  material={vm.material}
                  quality={vm.quality}
                  size={vm.size}
                  final={vm.computedPrice}
                />
              )}

              {/* Add to cart */}
              <motion.button
                whileHover={outOfStock ? {} : { scale: 1.02 }}
                whileTap={outOfStock ? {} : { scale: 0.98 }}
                onClick={vm.addToCart}
                disabled={outOfStock}
                className={[
                  'w-full py-4 font-orbitron text-sm font-semibold rounded-xl',
                  'flex items-center justify-center gap-2.5 transition-all',
                  outOfStock
                    ? 'bg-border/30 text-text-muted cursor-not-allowed'
                    : 'bg-primary text-white hover:shadow-glow',
                ].join(' ')}
              >
                <ShoppingCart size={18} />
                {outOfStock ? 'Out of Stock' : `Add to Cart — $${(vm.computedPrice * vm.quantity).toFixed(2)}`}
              </motion.button>

              {/* Secondary actions */}
              <div className="flex gap-3">
                <Link to="/chat" className="flex-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 glass border border-border text-text-muted font-exo text-sm rounded-xl flex items-center justify-center gap-2 hover:text-primary hover:border-primary transition-all"
                  >
                    <Zap size={15} /> Customise with AI
                  </motion.button>
                </Link>
                <Link to="/products" className="flex-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 glass border border-border text-text-muted font-exo text-sm rounded-xl flex items-center justify-center gap-2 hover:text-primary hover:border-primary transition-all"
                  >
                    <Layers size={15} /> More Products
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
