import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Weight, Ruler, Clock, DollarSign,
  ShoppingCart, RotateCcw, ChevronDown,
} from 'lucide-react';
import { materialService } from '../../services/materialService';
import type { Material, MaterialType } from '../../models/Material';
import type { SlicingOptions, QuotationData } from '../../viewmodels/useChatViewModel';
import type { SlicingPreset } from '../../models/SlicingJob';

// ─── Color name → CSS hex ─────────────────────────────────────────────────────

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

// ─── QuotationPanel ───────────────────────────────────────────────────────────

interface QuotationPanelProps {
  slicingOptions:  SlicingOptions;
  onUpdateOptions: (options: Partial<SlicingOptions>) => void;
  onExecute:       () => void;
  loading:         boolean;
}

export function QuotationPanel({
  slicingOptions, onUpdateOptions, onExecute, loading,
}: QuotationPanelProps) {
  const [materials,   setMaterials]   = useState<Material[]>([]);
  const [matsLoading, setMatsLoading] = useState(true);

  // ── Load all active materials once ──────────────────────────────────────
  useEffect(() => {
    materialService.getActive()
      .then(mats => {
        setMaterials(mats);
        // If current material type isn't in the list, default to first
        const types = [...new Set(mats.map(m => m.type))];
        if (types.length > 0 && !types.includes(slicingOptions.material as MaterialType)) {
          const first = mats[0];
          onUpdateOptions({
            material: first.type,
            color:    first.color ?? first.name,
          });
        }
      })
      .catch(() => {
        // Fallback so the form is still usable
        setMaterials([
          { type: 'PLA',   name: 'PLA',   pricePerGram: 0 },
          { type: 'ABS',   name: 'ABS',   pricePerGram: 0 },
          { type: 'PETG',  name: 'PETG',  pricePerGram: 0 },
          { type: 'TPU',   name: 'TPU',   pricePerGram: 0 },
          { type: 'Resin', name: 'Resin', pricePerGram: 0 },
        ]);
      })
      .finally(() => setMatsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  // Unique material types for the first dropdown
  const materialTypes = useMemo(
    () => [...new Set(materials.map(m => m.type))],
    [materials],
  );

  // ALL entries for the selected type — each is a color/variant option
  // We do NOT filter by color here; every entry from the API is a valid option
  const colorOptions = useMemo(
    () => materials.filter(m => m.type === slicingOptions.material),
    [materials, slicingOptions.material],
  );

  // The display label: color name + price (e.g. "Blue — $0.025/g")
  // Use m.color if set, fall back to m.name only if color is missing
  const optionLabel = (m: Material) => {
    const colorPart = m.color ?? m.name;
    const pricePart = m.pricePerGram > 0 ? ` — $${m.pricePerGram.toFixed(3)}/g` : '';
    return `${colorPart}${pricePart}`;
  };

  // The value stored in slicingOptions.color — always the color name (or name fallback)
  const optionValue = (m: Material) => m.color ?? m.name;

  // Ensure the current color value is always one of the available options
  const resolvedColor = useMemo(() => {
    if (colorOptions.length === 0) return slicingOptions.color;
    const match = colorOptions.find(m => optionValue(m) === slicingOptions.color);
    return match ? slicingOptions.color : optionValue(colorOptions[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorOptions, slicingOptions.color]);

  // When type changes → auto-select first color of that type
  const handleTypeChange = (type: string) => {
    const options = materials.filter(m => m.type === type);
    const first   = options[0];
    onUpdateOptions({
      material: type,
      color:    first ? optionValue(first) : '',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-border rounded-2xl p-5 space-y-5 max-w-md mx-auto"
    >
      <h3 className="font-display text-lg text-text">Print Options</h3>

      {/* ── Step 1: Material type ── */}
      <div>
        <label className="block text-xs font-body font-medium text-text-muted mb-2">
          Material Type
        </label>
        {matsLoading ? (
          <div className="flex items-center gap-2 py-2 text-text-muted text-xs font-body">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading materials…
          </div>
        ) : (
          <div className="relative">
            <select
              value={slicingOptions.material}
              onChange={e => handleTypeChange(e.target.value)}
              disabled={loading}
              className="w-full appearance-none bg-surface border border-border rounded-lg px-3 py-2.5 pr-8 text-text font-body text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            >
              {materialTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Step 2: Color — slides in after type is chosen ── */}
      {!matsLoading && colorOptions.length > 0 && (
        <motion.div
          key={slicingOptions.material}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <label className="block text-xs font-body font-medium text-text-muted mb-2">
            Color
          </label>

          <div className="relative">
            <select
              value={resolvedColor}
              onChange={e => onUpdateOptions({ color: e.target.value })}
              disabled={loading}
              className="w-full appearance-none bg-surface border border-border rounded-lg pl-9 pr-8 py-2.5 text-text font-body text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50 cursor-pointer"
            >
              {colorOptions.map(m => (
                <option key={optionValue(m)} value={optionValue(m)}>
                  {optionLabel(m)}
                </option>
              ))}
            </select>

            {/* Live color swatch for the selected option */}
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-border/60 pointer-events-none"
              style={{ backgroundColor: colorToHex(resolvedColor) }}
            />
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </motion.div>
      )}

      {/* ── Quality preset ── */}
      <div>
        <label className="block text-xs font-body font-medium text-text-muted mb-2">
          Quality
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['draft', 'normal', 'heavy'] as SlicingPreset[]).map(p => (
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
          {slicingOptions.preset === 'draft'  && 'Fast (0.3mm layers)'}
          {slicingOptions.preset === 'normal' && 'Balanced (0.2mm layers)'}
          {slicingOptions.preset === 'heavy'  && 'High quality (0.1mm layers)'}
        </p>
      </div>

      {/* ── Scale ── */}
      <div>
        <label className="block text-xs font-body font-medium text-text-muted mb-2">
          Scale: {slicingOptions.scale}%
        </label>
        <input
          type="range" min="1" max="1000" step="1"
          value={slicingOptions.scale}
          onChange={e => onUpdateOptions({ scale: Number(e.target.value) })}
          disabled={loading}
          className="w-full disabled:opacity-50"
        />
        <div className="flex justify-between text-[10px] text-text-muted font-body mt-1">
          <span>1%</span><span>500%</span><span>1000%</span>
        </div>
      </div>

      {/* ── Get Quote ── */}
      <button
        onClick={onExecute}
        disabled={loading || matsLoading || !slicingOptions.material}
        className="w-full bg-accent text-white py-2.5 rounded-lg font-display text-sm tracking-wide hover:bg-accent-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating…</>
          : 'Get Quote'
        }
      </button>
    </motion.div>
  );
}

// ─── QuoteReadyPanel ──────────────────────────────────────────────────────────

interface QuoteReadyPanelProps {
  quotationData:   QuotationData;
  slicingOptions:  SlicingOptions;
  modelName:       string;
  onAddToCart:     () => void;
  onBackToOptions: () => void;
}

export function QuoteReadyPanel({
  quotationData, slicingOptions, modelName, onAddToCart, onBackToOptions,
}: QuoteReadyPanelProps) {
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

      <div className="flex gap-2 text-xs font-body flex-wrap">
        <span className="px-2 py-1 bg-primary/10 border border-primary/30 rounded text-primary">
          {slicingOptions.material}
        </span>
        <span className="px-2 py-1 bg-accent/10 border border-accent/30 rounded text-accent">
          {slicingOptions.preset}
        </span>
        <span className="px-2 py-1 bg-surface-2 border border-border rounded text-text-muted">
          Scale: {slicingOptions.scale}%
        </span>
        {slicingOptions.color && (
          <span className="px-2 py-1 bg-surface-2 border border-border rounded text-text-muted flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-border/60 flex-shrink-0"
              style={{ backgroundColor: colorToHex(slicingOptions.color) }}
            />
            {slicingOptions.color}
          </span>
        )}
      </div>

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

      <div className="flex gap-2">
        <button
          onClick={onBackToOptions}
          className="flex-1 py-2.5 bg-surface border border-border text-text-muted rounded-lg font-body text-sm hover:border-primary hover:text-text transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={14} /> Change Options
        </button>
        <button
          onClick={onAddToCart}
          className="flex-1 py-2.5 bg-primary text-white rounded-lg font-display text-sm tracking-wide hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
