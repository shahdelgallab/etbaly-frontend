import { motion } from 'framer-motion';
import { Loader2, Weight, Ruler, Clock, DollarSign, ShoppingCart, RotateCcw } from 'lucide-react';
import type { SlicingOptions, QuotationData } from '../../viewmodels/useChatViewModel';
import type { SlicingPreset } from '../../models/SlicingJob';

interface QuotationPanelProps {
  slicingOptions: SlicingOptions;
  onUpdateOptions: (options: Partial<SlicingOptions>) => void;
  onExecute: () => void;
  loading: boolean;
}

export function QuotationPanel({ slicingOptions, onUpdateOptions, onExecute, loading }: QuotationPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-border rounded-2xl p-5 space-y-4 max-w-md mx-auto"
    >
      <h3 className="font-display text-lg text-text">Print Options</h3>

      {/* Material */}
      <div>
        <label className="block text-xs font-body font-medium text-text-muted mb-2">
          Material
        </label>
        <select
          value={slicingOptions.material}
          onChange={(e) => onUpdateOptions({ material: e.target.value })}
          disabled={loading}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text font-body text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
        >
          <option value="PLA">PLA</option>
          <option value="ABS">ABS</option>
          <option value="PETG">PETG</option>
          <option value="PLA+">PLA+</option>
          <option value="TPU">TPU</option>
          <option value="Nylon">Nylon</option>
        </select>
      </div>

      {/* Preset */}
      <div>
        <label className="block text-xs font-body font-medium text-text-muted mb-2">
          Quality
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['draft', 'normal', 'heavy'] as SlicingPreset[]).map((p) => (
            <button
              key={p}
              onClick={() => onUpdateOptions({ preset: p })}
              disabled={loading}
              className={[
                'py-2 px-2 rounded-lg font-body text-xs font-medium transition-all disabled:opacity-50',
                slicingOptions.preset === p
                  ? 'bg-primary text-white'
                  : 'bg-surface-2 border border-border text-text-muted hover:border-primary hover:text-text',
              ].join(' ')}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-text-muted font-body mt-1.5">
          {slicingOptions.preset === 'draft' && 'Fast (0.3mm layers)'}
          {slicingOptions.preset === 'normal' && 'Balanced (0.2mm layers)'}
          {slicingOptions.preset === 'heavy' && 'High quality (0.1mm layers)'}
        </p>
      </div>

      {/* Scale */}
      <div>
        <label className="block text-xs font-body font-medium text-text-muted mb-2">
          Scale: {slicingOptions.scale}%
        </label>
        <input
          type="range"
          min="10"
          max="200"
          step="10"
          value={slicingOptions.scale}
          onChange={(e) => onUpdateOptions({ scale: Number(e.target.value) })}
          disabled={loading}
          className="w-full disabled:opacity-50"
        />
        <div className="flex justify-between text-[10px] text-text-muted font-body mt-1">
          <span>10%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>

      {/* Get Quote Button */}
      <button
        onClick={onExecute}
        disabled={loading}
        className="w-full bg-accent text-white py-2.5 rounded-lg font-display text-sm tracking-wide hover:bg-accent-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Calculating...
          </>
        ) : (
          'Get Quote'
        )}
      </button>
    </motion.div>
  );
}

interface QuoteReadyPanelProps {
  quotationData: QuotationData;
  slicingOptions: SlicingOptions;
  modelName: string;
  onAddToCart: () => void;
  onRegenerate: () => void;
}

export function QuoteReadyPanel({ quotationData, slicingOptions, modelName, onAddToCart, onRegenerate }: QuoteReadyPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-accent/30 rounded-2xl p-5 space-y-4 max-w-md mx-auto"
    >
      <div>
        <h3 className="font-display text-lg text-text mb-1">Print Quote Ready</h3>
        <p className="text-xs text-text-muted font-body">{modelName}</p>
      </div>

      {/* Material & Scale Info */}
      <div className="flex gap-2 text-xs font-body">
        <span className="px-2 py-1 bg-primary/10 border border-primary/30 rounded text-primary">
          {slicingOptions.material}
        </span>
        <span className="px-2 py-1 bg-accent/10 border border-accent/30 rounded text-accent">
          {slicingOptions.preset}
        </span>
        <span className="px-2 py-1 bg-surface-2 border border-border rounded text-text-muted">
          {slicingOptions.scale}% scale
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-surface-2 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Weight className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] text-text-muted font-body">Weight</span>
          </div>
          <p className="text-base font-display text-text">{quotationData.weight}g</p>
        </div>

        <div className="p-3 bg-surface-2 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] text-text-muted font-body">Print Time</span>
          </div>
          <p className="text-base font-display text-text">{quotationData.printTime}m</p>
        </div>

        <div className="p-3 bg-surface-2 rounded-lg col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Ruler className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] text-text-muted font-body">Dimensions</span>
          </div>
          <p className="text-sm font-body text-text">
            {quotationData.dimensions.width} × {quotationData.dimensions.height} × {quotationData.dimensions.depth} mm
          </p>
        </div>

        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-text-muted font-body">Total Price</span>
          </div>
          <p className="text-2xl font-display text-primary">${quotationData.calculatedPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onRegenerate}
          className="flex-1 py-2.5 bg-surface border border-border text-text-muted rounded-lg font-body text-sm hover:border-primary hover:text-text transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={14} />
          Regenerate
        </button>
        <button
          onClick={onAddToCart}
          className="flex-1 py-2.5 bg-primary text-white rounded-lg font-display text-sm tracking-wide hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
