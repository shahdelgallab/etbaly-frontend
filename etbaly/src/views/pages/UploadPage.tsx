import { useRef, Suspense, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import {
  Upload, FileBox, RotateCcw, X,
  AlertCircle, HardDrive, Layers,
  ArrowRight, CheckCircle2, ShoppingCart,
  Loader2,
} from 'lucide-react';
import { useUploadViewModel } from '../../viewmodels/useUploadViewModel';
import ModelViewer from '../components/ModelViewer';
import PageWrapper from '../components/PageWrapper';
import { QuotationPanel, QuoteReadyPanel } from '../components/QuotationPanel';
import type { SlicingOptions } from '../../viewmodels/useUploadViewModel';
import type { QuotationData } from '../../viewmodels/useChatViewModel';

// ─── Drop zone ────────────────────────────────────────────────────────────────

type VM = ReturnType<typeof useUploadViewModel>;

function DropZone({ vm, inputRef }: { vm: VM; inputRef: React.RefObject<HTMLInputElement | null> }) {
  const isDragging = vm.phase === 'dragging';
  return (
    <motion.div
      onDragOver={vm.onDragOver}
      onDragLeave={vm.onDragLeave}
      onDrop={vm.onDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload 3D model file — click or drag and drop"
      animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.15 }}
      className={[
        'relative rounded-2xl border-2 border-dashed cursor-pointer',
        'flex flex-col items-center justify-center gap-5 p-12 min-h-72',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50',
        isDragging
          ? 'border-primary bg-primary/10 shadow-glow'
          : 'border-border hover:border-primary/60 hover:bg-primary/5 glass',
      ].join(' ')}
    >
      <motion.div
        animate={isDragging ? { y: [-4, 4, -4], scale: 1.15 } : { y: [0, -6, 0] }}
        transition={{ duration: isDragging ? 0.6 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className={[
          'w-20 h-20 rounded-3xl flex items-center justify-center transition-colors',
          isDragging ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary/70',
        ].join(' ')}
      >
        <Upload size={36} />
      </motion.div>
      <div className="text-center space-y-1.5">
        <p className="font-orbitron text-base font-semibold text-text">
          {isDragging ? 'Release to upload' : 'Drop your 3D file here'}
        </p>
        <p className="text-sm text-text-muted font-exo">or click to browse your files</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {['STL', 'OBJ', 'GLB', 'GLTF'].map(fmt => (
          <span key={fmt} className="px-3 py-1 glass border border-border rounded-full text-xs font-orbitron text-text-muted">
            .{fmt.toLowerCase()}
          </span>
        ))}
      </div>
      <p className="text-xs text-text-muted font-exo flex items-center gap-1.5">
        <HardDrive size={12} className="text-primary/60" />
        Maximum file size: 200 MB
      </p>
      {isDragging && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// ─── STL preview ─────────────────────────────────────────────────────────────

function computeCamera(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const box  = geometry.boundingBox ?? new THREE.Box3();
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim   = Math.max(size.x, size.y, size.z) || 10;
  const distance = maxDim * 3;
  return { position: [0, maxDim * 0.5, distance] as [number, number, number], target: [0, 0, 0] as [number, number, number] };
}

function STLPreview({ geometry }: { geometry: THREE.BufferGeometry }) {
  const cam = useMemo(() => computeCamera(geometry), [geometry]);
  const [contextLost, setContextLost] = useState(false);
  const [retryCount,  setRetryCount]  = useState(0);

  useEffect(() => {
    if (!contextLost) return;
    const t = setTimeout(() => { setContextLost(false); setRetryCount(n => n + 1); }, 300);
    return () => clearTimeout(t);
  }, [contextLost]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-accent/30 bg-surface" style={{ height: '300px' }}>
      {contextLost ? (
        <div className="w-full h-full flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-exo text-text-muted">Initializing renderer…</span>
        </div>
      ) : (
        <Canvas
          key={`${geometry.uuid}-${retryCount}`}
          camera={{ position: cam.position, fov: 50, near: 0.01, far: cam.position[2] * 100 }}
          gl={{ antialias: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            const handleLost = () => setContextLost(true);
            canvas.addEventListener('webglcontextlost', handleLost);
            return () => canvas.removeEventListener('webglcontextlost', handleLost);
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, -2, -5]} intensity={0.3} />
          <Suspense fallback={null}>
            <mesh geometry={geometry}>
              <meshStandardMaterial color="#1e3a5f" metalness={0.3} roughness={0.4} />
            </mesh>
          </Suspense>
          <OrbitControls target={cam.target} autoRotate autoRotateSpeed={1.5} enableZoom enablePan={false} />
          <Environment preset="city" />
        </Canvas>
      )}
      <p className="absolute bottom-2 left-3 text-[10px] text-text-muted/60 font-exo pointer-events-none">
        Drag to rotate · Scroll to zoom
      </p>
    </div>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────────

function PreviewPanel({ vm }: { vm: VM }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-orbitron text-sm font-semibold text-text flex items-center gap-2">
          <Layers size={15} className="text-primary" /> 3D Preview
        </h3>
        <button
          onClick={vm.reset}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-exo"
        >
          <RotateCcw size={12} /> Change file
        </button>
      </div>

      {/* File info */}
      <div className="flex items-center gap-3 px-4 py-3 glass border border-border rounded-xl">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text font-exo truncate">{vm.file?.name}</p>
          <p className="text-xs text-text-muted font-exo">{vm.format?.toUpperCase()} · {vm.fileSizeMB} MB</p>
        </div>
        <button onClick={vm.reset} aria-label="Remove file"
          className="w-7 h-7 rounded-lg glass border border-border flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-400/40 transition-all">
          <X size={13} />
        </button>
      </div>

      {/* 3D render */}
      {vm.format === 'stl' && vm.geometry ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <STLPreview geometry={vm.geometry} />
        </motion.div>
      ) : vm.format === 'stl' && !vm.geometry ? (
        <div className="flex flex-col items-center justify-center gap-3 glass border border-border rounded-2xl py-14 text-text-muted">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-exo">Parsing STL file…</p>
        </div>
      ) : vm.canPreview && vm.previewUrl ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <ModelViewer modelUrl={vm.previewUrl} height="300px" autoRotate />
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 glass border border-border rounded-2xl py-14 text-text-muted">
          <FileBox size={40} className="opacity-30" />
          <p className="text-sm font-exo">No preview for .{vm.format} files</p>
        </div>
      )}
    </div>
  );
}

// ─── Name + upload step ───────────────────────────────────────────────────────

function NameAndUploadStep({ vm }: { vm: VM }) {
  const isUploading = vm.phase === 'uploading';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-border rounded-2xl p-6 space-y-5"
    >
      <h2 className="font-orbitron text-base font-semibold text-text">Model Details</h2>

      <div>
        <label htmlFor="design-name" className="block text-xs font-medium text-text-muted font-exo mb-1.5">
          Design Name
        </label>
        <input
          id="design-name"
          type="text"
          value={vm.designName}
          onChange={e => vm.setDesignName(e.target.value)}
          placeholder="My Custom Model"
          disabled={isUploading}
          className="w-full px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary transition-all disabled:opacity-50"
        />
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-exo text-text-muted">
            <span className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-primary" />
              Uploading to server…
            </span>
            <span className="font-orbitron text-primary">{vm.progress}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              animate={{ width: `${vm.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <motion.button
        whileHover={!isUploading ? { scale: 1.02 } : {}}
        whileTap={!isUploading ? { scale: 0.98 } : {}}
        onClick={vm.uploadAndProceed}
        disabled={isUploading || !vm.designName.trim()}
        className="w-full py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <><Loader2 size={16} className="animate-spin" /> Uploading…</>
        ) : (
          <>Upload & Get Quote <ArrowRight size={16} /></>
        )}
      </motion.button>
    </motion.div>
  );
}

// ─── Done banner ──────────────────────────────────────────────────────────────

function DoneBanner({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4 px-5 glass border border-success/30 rounded-2xl bg-success/5"
    >
      <div className="flex items-center gap-2 text-success text-sm font-exo">
        <CheckCircle2 size={16} /> Model added to cart!
      </div>
      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-1.5 glass border border-border text-text-muted rounded-lg text-xs font-exo hover:text-primary hover:border-primary transition-all"
        >
          <RotateCcw size={12} /> Upload another
        </button>
        <a href="/checkout">
          <button className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-orbitron hover:shadow-glow-sm transition-all">
            <ShoppingCart size={12} /> Checkout
          </button>
        </a>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const vm       = useUploadViewModel();
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFile = vm.phase !== 'idle' && vm.phase !== 'dragging' && vm.phase !== 'validating';

  // Adapt vm to QuotationPanel / QuoteReadyPanel prop shapes
  const slicingOptions = {
    material: vm.slicingOpts.material,
    color:    vm.slicingOpts.color,
    preset:   vm.slicingOpts.preset,
    scale:    vm.slicingOpts.scale,
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

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <span className="text-xs font-orbitron text-primary tracking-widest">CUSTOM PRINT</span>
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-text mt-1 mb-2">
            Upload 3D Model
          </h1>
          <p className="text-text-muted font-exo text-sm max-w-xl">
            Upload your STL, OBJ, GLB, or GLTF file. Get an instant price quote, then add it to your cart.
          </p>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {vm.error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-3 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-exo"
            >
              <AlertCircle size={16} className="shrink-0" />
              {vm.error}
              <button onClick={() => vm.reset()} aria-label="Dismiss" className="ml-auto hover:text-red-300 transition-colors">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept=".stl,.obj,.glb,.gltf"
          onChange={vm.onFileInput}
          className="hidden"
          aria-label="3D model file input"
        />

        <div className={vm.phase === 'added' || !hasFile ? 'flex flex-col items-center gap-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'}>

          {/* ── IDLE: centered drop zone ── */}
          {!hasFile && (
            <div className="w-full max-w-xl">
              <AnimatePresence mode="wait">
                <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <DropZone vm={vm} inputRef={inputRef} />
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ── ACTIVE (preview → quoted): left preview + right panel ── */}
          {hasFile && vm.phase !== 'added' && (
            <>
              {/* Left: 3D preview */}
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <PreviewPanel vm={vm} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right: step panels */}
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {(vm.phase === 'preview' || vm.phase === 'uploading') && (
                    <motion.div key="name-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <NameAndUploadStep vm={vm} />
                    </motion.div>
                  )}
                  {(vm.phase === 'options' || vm.phase === 'slicing') && (
                    <motion.div key="options-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <QuotationPanel
                        slicingOptions={slicingOptions}
                        onUpdateOptions={patch => vm.updateSlicingOpts(patch as Partial<SlicingOptions>)}
                        onExecute={vm.getQuote}
                        loading={vm.phase === 'slicing'}
                      />
                    </motion.div>
                  )}
                  {vm.phase === 'quoted' && quotationData && (
                    <motion.div key="quote-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <QuoteReadyPanel
                        quotationData={quotationData}
                        slicingOptions={slicingOptions}
                        modelName={vm.designName}
                        onAddToCart={vm.addToCart}
                        onBackToOptions={vm.backToOptions}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* ── DONE: centered 3D preview + done banner ── */}
          {vm.phase === 'added' && (
            <motion.div
              key="done-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl flex flex-col items-center gap-6"
            >
              {/* 3D preview */}
              <div className="w-full">
                {vm.format === 'stl' && vm.geometry ? (
                  <STLPreview geometry={vm.geometry} />
                ) : vm.canPreview && vm.previewUrl ? (
                  <ModelViewer modelUrl={vm.previewUrl} height="300px" autoRotate />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 glass border border-border rounded-2xl py-14 text-text-muted">
                    <FileBox size={40} className="opacity-30" />
                    <p className="text-sm font-exo">{vm.designName}</p>
                  </div>
                )}
              </div>

              {/* Done banner */}
              <DoneBanner onReset={vm.reset} />
            </motion.div>
          )}

        </div>
      </div>
    </PageWrapper>
  );
}
