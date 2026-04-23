import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, CheckCircle2, XCircle, Clock, Weight, Ruler, DollarSign } from 'lucide-react';
import { useSlicingViewModel } from '../../viewmodels/useSlicingViewModel';
import type { SlicingPreset } from '../../models/SlicingJob';

interface SlicingPanelProps {
  designId: string;
  designName?: string;
  onComplete?: (gcodeUrl: string) => void;
}

export function SlicingPanel({ designId, designName, onComplete }: SlicingPanelProps) {
  const slicing = useSlicingViewModel();
  const [material, setMaterial] = useState('PLA');
  const [preset, setPreset] = useState<SlicingPreset>('normal');
  const [scale, setScale] = useState(100);

  const handleSlice = async () => {
    await slicing.executeSlicing(designId, material, preset, scale);
  };

  const handleDownload = () => {
    if (slicing.job?.gcodeUrl) {
      window.open(slicing.job.gcodeUrl, '_blank');
      onComplete?.(slicing.job.gcodeUrl);
    }
  };

  return (
    <div className="glass border border-border rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-display text-2xl text-text mb-1">Slice for Printing</h3>
        {designName && (
          <p className="text-sm text-text-muted font-body">{designName}</p>
        )}
      </div>

      {/* Settings */}
      {slicing.phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Material */}
          <div>
            <label className="block text-sm font-body font-medium text-text mb-2">
              Material
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text font-body text-sm focus:outline-none focus:border-primary transition-colors"
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
            <label className="block text-sm font-body font-medium text-text mb-2">
              Quality Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['draft', 'normal', 'heavy'] as SlicingPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={[
                    'py-2.5 px-3 rounded-lg font-body text-sm font-medium transition-all',
                    preset === p
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border text-text-muted hover:border-primary hover:text-text',
                  ].join(' ')}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted font-body mt-2">
              {preset === 'draft' && 'Fast print, visible layers (0.3mm)'}
              {preset === 'normal' && 'Balanced quality & speed (0.2mm)'}
              {preset === 'heavy' && 'High quality, slower (0.1mm)'}
            </p>
          </div>

          {/* Scale */}
          <div>
            <label className="block text-sm font-body font-medium text-text mb-2">
              Scale: {scale}%
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Start Button */}
          <button
            onClick={handleSlice}
            className="w-full bg-primary text-white py-3 rounded-lg font-display text-lg tracking-wide hover:bg-primary-dark transition-colors"
          >
            Start Slicing
          </button>
        </motion.div>
      )}

      {/* Progress */}
      <AnimatePresence mode="wait">
        {(slicing.phase === 'submitting' || slicing.phase === 'queued' || slicing.phase === 'processing') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Status */}
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <div>
                <p className="text-sm font-body font-medium text-text">
                  {slicing.phase === 'submitting' && 'Submitting job...'}
                  {slicing.phase === 'queued' && 'Job queued...'}
                  {slicing.phase === 'processing' && 'Slicing in progress...'}
                </p>
                {slicing.job && (
                  <p className="text-xs text-text-muted font-body">
                    Job: {slicing.job.jobNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${slicing.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-text-muted font-body text-center">
              {slicing.progress}%
            </p>
          </motion.div>
        )}

        {/* Completed */}
        {slicing.phase === 'completed' && slicing.job && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Success Message */}
            <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <div>
                <p className="text-sm font-body font-medium text-success">
                  Slicing Complete!
                </p>
                <p className="text-xs text-text-muted font-body">
                  Job: {slicing.job.jobNumber}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {slicing.job.weight && (
                <div className="p-3 bg-surface-2 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Weight className="w-4 h-4 text-accent" />
                    <span className="text-xs text-text-muted font-body">Weight</span>
                  </div>
                  <p className="text-lg font-display text-text">{slicing.job.weight}g</p>
                </div>
              )}

              {slicing.job.printTime && (
                <div className="p-3 bg-surface-2 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-xs text-text-muted font-body">Print Time</span>
                  </div>
                  <p className="text-lg font-display text-text">{slicing.job.printTime}m</p>
                </div>
              )}

              {slicing.job.dimensions && (
                <div className="p-3 bg-surface-2 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Ruler className="w-4 h-4 text-accent" />
                    <span className="text-xs text-text-muted font-body">Dimensions</span>
                  </div>
                  <p className="text-sm font-body text-text">
                    {slicing.job.dimensions.width} × {slicing.job.dimensions.height} × {slicing.job.dimensions.depth} mm
                  </p>
                </div>
              )}

              {slicing.job.calculatedPrice && (
                <div className="p-3 bg-surface-2 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="text-xs text-text-muted font-body">Est. Cost</span>
                  </div>
                  <p className="text-lg font-display text-text">${slicing.job.calculatedPrice.toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Download Button */}
            {slicing.job.gcodeUrl && (
              <button
                onClick={handleDownload}
                className="w-full bg-accent text-white py-3 rounded-lg font-display text-lg tracking-wide hover:bg-accent-2 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download G-code
              </button>
            )}

            {/* Reset Button */}
            <button
              onClick={slicing.reset}
              className="w-full bg-surface border border-border text-text py-2.5 rounded-lg font-body text-sm hover:border-primary transition-colors"
            >
              Slice Another Model
            </button>
          </motion.div>
        )}

        {/* Failed */}
        {slicing.phase === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/30 rounded-lg">
              <XCircle className="w-5 h-5 text-danger flex-shrink-0" />
              <div>
                <p className="text-sm font-body font-medium text-danger">
                  Slicing Failed
                </p>
                {slicing.error && (
                  <p className="text-xs text-text-muted font-body mt-1">
                    {slicing.error}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={slicing.reset}
              className="w-full bg-surface border border-border text-text py-2.5 rounded-lg font-body text-sm hover:border-primary transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
