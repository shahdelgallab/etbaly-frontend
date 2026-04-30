import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Trash2, AlertCircle, RefreshCw,
  Clock, Weight, Ruler, DollarSign, Package,
  Wand2, CheckCircle2, ShoppingCart, X,
} from 'lucide-react';
import { designService } from '../../services/designService';
import type { SlicingHistoryEntry } from '../../services/designService';
import { slicingService } from '../../services/slicingService';
import { cartService } from '../../services/cartService';
import { useAppDispatch } from '../../store/hooks';
import { fetchCartThunk, openCart as reduxOpenCart } from '../../store/slices/cartSlice';
import { getDirectImageUrl } from '../../utils/imageUtils';
import { AuthenticatedImage } from '../components/AuthenticatedImage';
import { QuotationPanel, QuoteReadyPanel } from '../components/QuotationPanel';
import PageWrapper from '../components/PageWrapper';
import type { SlicingOptions } from '../../viewmodels/useUploadViewModel';
import type { QuotationData } from '../../viewmodels/useChatViewModel';
import type { SlicingPreset } from '../../models/SlicingJob';

// ─── Color swatch helper ──────────────────────────────────────────────────────

function colorToHex(name: string): string {
  if (!name) return '#888888';
  const map: Record<string, string> = {
    white: '#ffffff', black: '#111111', red: '#ef4444', green: '#22c55e',
    blue: '#3b82f6', yellow: '#eab308', orange: '#f97316', pink: '#ec4899',
    purple: '#a855f7', gray: '#6b7280', grey: '#6b7280', brown: '#92400e',
    cyan: '#06b6d4', teal: '#14b8a6', silver: '#d1d5db', gold: '#f59e0b',
  };
  return map[name.toLowerCase()] ?? '#888888';
}

// ─── Per-card re-quotation state ──────────────────────────────────────────────

type CardPhase = 'idle' | 'options' | 'slicing' | 'quoted' | 'added';

interface CardState {
  phase:   CardPhase;
  opts:    SlicingOptions;
  quote:   QuotationData | null;
  error:   string | null;
}

// ─── Stats display (used in both idle and quoted states) ──────────────────────

function StatsGrid({ weight, printTime, dimensions, calculatedPrice }: {
  weight: number; printTime: number;
  dimensions: { width: number; height: number; depth: number };
  calculatedPrice: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-3 bg-surface-2 rounded-xl">
        <div className="flex items-center gap-1.5 mb-1">
          <Weight size={12} className="text-accent" />
          <span className="text-[10px] text-text-muted font-exo">Weight</span>
        </div>
        <p className="text-sm font-orbitron text-text">{weight}g</p>
      </div>
      <div className="p-3 bg-surface-2 rounded-xl">
        <div className="flex items-center gap-1.5 mb-1">
          <Clock size={12} className="text-accent" />
          <span className="text-[10px] text-text-muted font-exo">Print Time</span>
        </div>
        <p className="text-sm font-orbitron text-text">{printTime}m</p>
      </div>
      <div className="p-3 bg-surface-2 rounded-xl">
        <div className="flex items-center gap-1.5 mb-1">
          <Ruler size={12} className="text-accent" />
          <span className="text-[10px] text-text-muted font-exo">Dimensions</span>
        </div>
        <p className="text-[11px] font-exo text-text">
          {dimensions.width}×{dimensions.height}×{dimensions.depth}mm
        </p>
      </div>
      <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
        <div className="flex items-center gap-1.5 mb-1">
          <DollarSign size={12} className="text-primary" />
          <span className="text-[10px] text-text-muted font-exo">Price</span>
        </div>
        <p className="text-sm font-orbitron text-primary">${calculatedPrice.toFixed(2)}</p>
      </div>
    </div>
  );
}

// ─── Single history card ──────────────────────────────────────────────────────

function HistoryCard({
  entry,
  onDelete,
  onSave,
  deleting,
}: {
  entry:    SlicingHistoryEntry;
  onDelete: (jobId: string) => void;
  onSave:   (jobId: string) => void;
  deleting: boolean;
}) {
  const dispatch = useAppDispatch();
  const apiBase  = import.meta.env.VITE_API_URL as string ?? '';
  const thumbUrl = entry.design.thumbnailUrl
    ? getDirectImageUrl(entry.design.thumbnailUrl, apiBase)
    : null;

  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  // Per-card re-quotation state
  const [card, setCard] = useState<CardState>({
    phase: 'idle',
    opts: {
      material: entry.material,
      color:    entry.color ?? '',
      preset:   entry.preset as SlicingPreset,
      scale:    entry.scale,
    },
    quote: null,
    error: null,
  });

  // Displayed stats — always use original entry data (card reloads after save)
  const displayStats = {
    weight:          entry.weight,
    printTime:       entry.printTime,
    dimensions:      entry.dimensions,
    calculatedPrice: entry.calculatedPrice,
  };

  const updateOpts = useCallback((patch: Partial<SlicingOptions>) => {
    setCard(c => ({ ...c, opts: { ...c.opts, ...patch } }));
  }, []);

  const runSlicing = useCallback(async () => {
    setCard(c => ({ ...c, phase: 'slicing', error: null }));
    try {
      const resp = await slicingService.executeSlicing({
        designId: entry.design.id,
        material: card.opts.material,
        color:    card.opts.color || undefined,
        preset:   card.opts.preset,
        scale:    card.opts.scale,
      });

      const completed = await slicingService.pollJobStatus(resp.jobId, undefined, 120, 5000);

      if (
        completed.weight && completed.dimensions &&
        completed.printTime && completed.calculatedPrice && completed.gcodeUrl
      ) {
        setCard(c => ({
          ...c,
          phase: 'quoted',
          quote: {
            weight:          completed.weight!,
            dimensions:      completed.dimensions!,
            printTime:       completed.printTime!,
            calculatedPrice: completed.calculatedPrice!,
            gcodeUrl:        completed.gcodeUrl!,
          },
        }));
      } else {
        throw new Error('Incomplete slicing data returned.');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Slicing failed.';
      setCard(c => ({ ...c, phase: 'options', error: msg }));
    }
  }, [entry.design.id, card.opts]);

  const addToCart = useCallback(async () => {
    if (!card.quote) return;
    try {
      await cartService.addItem({
        itemType:  'Design',
        itemRefId: entry.design.id,
        quantity:  1,
        printingProperties: {
          material: card.opts.material as 'PLA' | 'ABS' | 'PETG' | 'TPU' | 'Resin',
          color:    card.opts.color || undefined,
          scale:    card.opts.scale,
          preset:   card.opts.preset,
          customFields: [
            { key: 'printTime',  value: String(card.quote.printTime)  },
            { key: 'weight',     value: String(card.quote.weight)     },
            { key: 'gcodeUrl',   value: card.quote.gcodeUrl           },
          ],
        },
      });
      await dispatch(fetchCartThunk());
      dispatch(reduxOpenCart());
      setCard(c => ({ ...c, phase: 'added' }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to add to cart.';
      setCard(c => ({ ...c, error: msg }));
    }
  }, [card.quote, card.opts, entry.design.id, dispatch]);

  const backToOptions = useCallback(() => {
    setCard(c => ({ ...c, phase: 'options', quote: null }));
  }, []);

  const cancelReQuote = useCallback(() => {
    setCard(c => ({ ...c, phase: 'idle', quote: null, error: null }));
  }, []);

  // Commit: delete the old history entry, then reload the list
  const saveToHistory = useCallback(() => {
    if (!card.quote) return;
    onSave(entry.jobId);
  }, [card.quote, entry.jobId, onSave]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      className="glass border border-border rounded-2xl p-5 space-y-4"
    >
      {/* ── Header row ── */}
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface border border-border">
          {thumbUrl ? (
            thumbUrl.includes('/files/proxy') ? (
              <AuthenticatedImage src={thumbUrl} alt={entry.design.name} className="w-full h-full object-cover" />
            ) : (
              <img src={thumbUrl} alt={entry.design.name} className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/30 font-orbitron text-xs">3D</div>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-orbitron text-sm font-semibold text-text truncate">{entry.design.name}</p>
          <p className="text-xs text-text-muted font-exo mt-0.5">{date}</p>
          {/* Current option badges — show saved values in idle, live opts otherwise */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="px-2 py-0.5 bg-primary/10 border border-primary/30 rounded text-xs font-exo text-primary">
              {card.opts.material}
            </span>
            <span className="px-2 py-0.5 bg-accent/10 border border-accent/30 rounded text-xs font-exo text-accent">
              {card.opts.preset}
            </span>
            <span className="px-2 py-0.5 bg-surface-2 border border-border rounded text-xs font-exo text-text-muted">
              {card.opts.scale}%
            </span>
            {card.opts.color && (
              <span className="px-2 py-0.5 bg-surface-2 border border-border rounded text-xs font-exo text-text-muted flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-border/60 flex-shrink-0"
                  style={{ backgroundColor: colorToHex(card.opts.color) }}
                />
                {card.opts.color}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {card.phase === 'idle' && (
            <button
              onClick={() => setCard(c => ({ ...c, phase: 'options' }))}
              className="flex items-center gap-1.5 px-3 py-1.5 glass border border-primary/40 text-primary rounded-lg text-xs font-exo hover:bg-primary/10 transition-all"
            >
              <Wand2 size={12} /> Re-quote
            </button>
          )}
          {card.phase !== 'idle' && card.phase !== 'added' && (
            <button
              onClick={cancelReQuote}
              aria-label="Cancel re-quote"
              className="p-1.5 glass border border-border rounded-lg text-text-muted hover:text-text transition-all"
            >
              <X size={13} />
            </button>
          )}
          <button
            onClick={() => onDelete(entry.jobId)}
            disabled={deleting}
            aria-label="Delete from history"
            className="p-2 glass border border-border rounded-lg text-text-muted hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Per-card error ── */}
      <AnimatePresence>
        {card.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-exo overflow-hidden"
          >
            <AlertCircle size={12} className="shrink-0" />
            {card.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats (always shown, updates when new quote arrives) ── */}
      {card.phase !== 'options' && card.phase !== 'slicing' && (
        <StatsGrid
          weight={displayStats.weight}
          printTime={displayStats.printTime}
          dimensions={displayStats.dimensions}
          calculatedPrice={displayStats.calculatedPrice}
        />
      )}

      {/* ── Re-quotation form (options + slicing) ── */}
      <AnimatePresence>
        {(card.phase === 'options' || card.phase === 'slicing') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <QuotationPanel
              slicingOptions={card.opts}
              onUpdateOptions={updateOpts}
              onExecute={runSlicing}
              loading={card.phase === 'slicing'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New quote result ── */}
      <AnimatePresence>
        {card.phase === 'quoted' && card.quote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3"
          >
            {/* Save button — commits new quote as the card's permanent data */}
            <div className="flex justify-end">
              <button
                onClick={saveToHistory}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-success/10 border border-success/40 text-success rounded-lg text-xs font-exo hover:bg-success/20 transition-all"
              >
                <CheckCircle2 size={12} /> Save to history
              </button>
            </div>

            <QuoteReadyPanel
              quotationData={card.quote}
              slicingOptions={card.opts}
              modelName={entry.design.name}
              onAddToCart={addToCart}
              onBackToOptions={backToOptions}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Added to cart banner ── */}
      <AnimatePresence>
        {card.phase === 'added' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between px-4 py-3 glass border border-success/30 rounded-xl bg-success/5"
          >
            <div className="flex items-center gap-2 text-success text-sm font-exo">
              <CheckCircle2 size={15} /> Added to cart!
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelReQuote}
                className="flex items-center gap-1.5 px-3 py-1 glass border border-border text-text-muted rounded-lg text-xs font-exo hover:text-primary hover:border-primary transition-all"
              >
                <Wand2 size={11} /> Re-quote again
              </button>
              <a href="/checkout">
                <button className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-lg text-xs font-orbitron hover:shadow-glow-sm transition-all">
                  <ShoppingCart size={11} /> Checkout
                </button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SlicingHistoryPage() {
  const [history,  setHistory]  = useState<SlicingHistoryEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    designService.getSlicingHistory()
      .then(setHistory)
      .catch(err => {
        const msg = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Failed to load slicing history.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (jobId: string) => {
    setDeleting(jobId);
    try {
      await designService.deleteSlicingHistoryItem(jobId);
      setHistory(prev => prev.filter(e => e.jobId !== jobId));
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to delete item.';
      setError(msg);
    } finally {
      setDeleting(null);
    }
  };

  // Delete the old job entry and reload — the new slicing job is already in history
  const handleSave = async (oldJobId: string) => {
    try {
      await designService.deleteSlicingHistoryItem(oldJobId);
      // Reload to show the new entry that was created by the re-slicing
      load();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to save.';
      setError(msg);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-orbitron text-primary tracking-widest">MY PRINTS</span>
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-text mt-1 flex items-center gap-3">
              <History size={32} className="text-primary" />
              Slicing History
            </h1>
            <p className="text-text-muted font-exo text-sm mt-2">
              Your completed slicing jobs. Re-quote with different options and add to cart.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
            className="flex items-center gap-1.5 px-3 py-1.5 glass border border-border rounded-lg text-xs text-text-muted hover:text-primary hover:border-primary transition-all font-exo disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Page-level error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-exo"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="shimmer h-40 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && history.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-text-muted"
          >
            <Package size={56} className="opacity-20" />
            <p className="font-orbitron text-sm">No slicing history yet.</p>
            <p className="text-xs font-exo text-center max-w-xs">
              Upload a 3D model and get a quote to see your slicing jobs here.
            </p>
            <a
              href="/upload"
              className="mt-2 px-5 py-2.5 bg-primary text-white font-orbitron text-xs rounded-xl hover:shadow-glow transition-all"
            >
              Upload a Model
            </a>
          </motion.div>
        )}

        {/* History list */}
        {!loading && history.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted font-exo">{history.length} job{history.length !== 1 ? 's' : ''}</p>
            <AnimatePresence initial={false}>
              {history.map(entry => (
                <HistoryCard
                  key={entry.jobId}
                  entry={entry}
                  onDelete={handleDelete}
                  onSave={handleSave}
                  deleting={deleting === entry.jobId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
