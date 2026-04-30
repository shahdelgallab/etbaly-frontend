import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Package, CheckCircle2,
  Wand2, Loader2, AlertCircle, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProductDetailViewModel } from '../../viewmodels/useProductDetailViewModel';
import { AuthenticatedImage } from '../components/AuthenticatedImage';
import { QuotationPanel, QuoteReadyPanel } from '../components/QuotationPanel';
import PageWrapper from '../components/PageWrapper';
import type { SlicingOptions, QuotationData } from '../../viewmodels/useChatViewModel';
import type { PrintOptions } from '../../viewmodels/useProductDetailViewModel';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="shimmer h-4 w-24 rounded-lg mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="shimmer rounded-2xl aspect-square max-h-80 lg:max-h-96" />
          <div className="space-y-4">
            <div className="shimmer h-8 w-3/4 rounded-xl" />
            <div className="shimmer h-4 w-1/2 rounded-lg" />
            <div className="shimmer h-24 rounded-xl" />
            <div className="shimmer h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </PageWrapper>
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
          <Link to="/products" className="text-primary hover:underline font-exo text-sm">
            Back to collections
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const p = vm.product;

  // Adapt vm.opts → SlicingOptions shape for QuotationPanel
  const slicingOptions: SlicingOptions = {
    material: vm.opts.material,
    color:    vm.opts.color,
    preset:   vm.opts.preset,
    scale:    vm.opts.scale,
  };

  const quotationData: QuotationData | null = vm.quote
    ? {
        weight:          vm.quote.weight,
        dimensions:      vm.quote.dimensions,
        printTime:       vm.quote.printTime,
        calculatedPrice: vm.quote.calculatedPrice,
        gcodeUrl:        vm.quote.gcodeUrl,
      }
    : null;

  const isLoading = vm.phase === 'slicing' || vm.phase === 'adding';

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Back link */}
        <button
          onClick={vm.goBack}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-exo mb-8"
        >
          <ArrowLeft size={13} /> Back to Collections
        </button>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* ── LEFT: product image (compact) ── */}
          <div className="w-full rounded-2xl overflow-hidden border border-border bg-surface-2 aspect-square max-h-80 lg:max-h-96">
            {vm.imageUrl ? (
              vm.isProxied ? (
                <AuthenticatedImage
                  src={vm.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={vm.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-primary/20">
                <Package size={56} />
                <span className="font-orbitron text-xs">No image</span>
              </div>
            )}
          </div>

          {/* ── RIGHT: details + options ── */}
          <div className="space-y-6">

            {/* Product name + description */}
            <div>
              <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-text leading-tight mb-2">
                {p.name}
              </h1>
              {p.description && (
                <p className="text-text-muted font-exo text-sm leading-relaxed">{p.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-exo text-text-muted">Base price:</span>
                <span className="font-orbitron text-xl font-bold text-primary">
                  ${p.currentBasePrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {vm.error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-exo"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  {vm.error}
                  <button onClick={() => vm.resetAdded()} className="ml-auto hover:text-red-300 transition-colors">
                    <X size={13} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Default add-to-cart section ── */}
            <AnimatePresence mode="wait">
              {(vm.phase === 'idle' || vm.phase === 'adding') && !vm.showReQuote && (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  {/* Current options summary */}
                  <div className="glass border border-border rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-orbitron text-text-muted tracking-wider">PRINT OPTIONS</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-primary/10 border border-primary/30 rounded-lg text-xs font-exo text-primary">
                        {vm.opts.material}
                      </span>
                      <span className="px-2.5 py-1 bg-surface-2 border border-border rounded-lg text-xs font-exo text-text-muted">
                        {vm.opts.color || 'No color'}
                      </span>
                      <span className="px-2.5 py-1 bg-accent/10 border border-accent/30 rounded-lg text-xs font-exo text-accent">
                        {vm.opts.preset}
                      </span>
                      <span className="px-2.5 py-1 bg-surface-2 border border-border rounded-lg text-xs font-exo text-text-muted">
                        {vm.opts.scale}% scale
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={vm.addToCart}
                      disabled={isLoading}
                      className="flex-1 py-3.5 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50"
                    >
                      {vm.phase === 'adding' ? (
                        <><Loader2 size={16} className="animate-spin" /> Adding…</>
                      ) : (
                        <><ShoppingCart size={16} /> Add to Cart</>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => vm.setShowReQuote(true)}
                      disabled={isLoading}
                      className="flex-1 py-3.5 glass border border-primary/40 text-primary font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/10 transition-all disabled:opacity-50"
                    >
                      <Wand2 size={16} /> Re-quote
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── Re-quote form ── */}
              {vm.showReQuote && (vm.phase === 'idle' || vm.phase === 'slicing') && (
                <motion.div
                  key="requote"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-orbitron text-text-muted tracking-wider">CONFIGURE & QUOTE</p>
                    <button
                      onClick={() => { vm.setShowReQuote(false); vm.backToOptions(); }}
                      className="p-1.5 glass border border-border rounded-lg text-text-muted hover:text-text transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <QuotationPanel
                    slicingOptions={slicingOptions}
                    onUpdateOptions={patch => vm.updateOpts(patch as Partial<PrintOptions>)}
                    onExecute={vm.runSlicing}
                    loading={vm.phase === 'slicing'}
                  />
                </motion.div>
              )}

              {/* ── Quote result ── */}
              {vm.phase === 'quoted' && quotationData && (
                <motion.div
                  key="quoted"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <QuoteReadyPanel
                    quotationData={quotationData}
                    slicingOptions={slicingOptions}
                    modelName={p.name}
                    onAddToCart={vm.addToCartAfterQuote}
                    onBackToOptions={vm.backToOptions}
                  />
                </motion.div>
              )}

              {/* ── Added to cart ── */}
              {vm.phase === 'added' && (
                <motion.div
                  key="added"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 glass border border-success/30 rounded-2xl bg-success/5"
                >
                  <div className="flex items-center gap-2 text-success text-sm font-exo">
                    <CheckCircle2 size={16} /> Added to cart!
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={vm.resetAdded}
                      className="flex items-center gap-1.5 px-4 py-1.5 glass border border-border text-text-muted rounded-lg text-xs font-exo hover:text-primary hover:border-primary transition-all"
                    >
                      <Wand2 size={11} /> Change options
                    </button>
                    <Link to="/checkout">
                      <button className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-orbitron hover:shadow-glow-sm transition-all">
                        <ShoppingCart size={11} /> Checkout
                      </button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
