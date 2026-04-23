import { useRef, Suspense, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import {
  Upload, FileBox, ShoppingCart, RotateCcw, X,
  AlertCircle, FileCheck2, HardDrive, Layers,
  Check, Info, Zap, ArrowRight,
} from 'lucide-react';
import { useUploadViewModel, PRINT_QUALITY_OPTIONS } from '../../viewmodels/useUploadViewModel';
import ModelViewer from '../components/ModelViewer';
import PageWrapper from '../components/PageWrapper';
import type { MaterialType } from '../../models/Product';

// ─── Constants ────────────────────────────────────────────────────────────────

const MATERIALS: MaterialType[] = ['PLA', 'ABS', 'PETG', 'Resin', 'TPU', 'Nylon'];

const MATERIAL_INFO: Record<MaterialType, string> = {
  PLA:   'Easy to print, biodegradable, great for decorative items',
  ABS:   'Durable & heat-resistant, ideal for functional parts',
  PETG:  'Strong, flexible, food-safe — best all-rounder',
  Resin: 'Ultra-fine detail, smooth surface finish',
  TPU:   'Flexible & rubber-like, perfect for grips & gaskets',
  Nylon: 'Tough, wear-resistant, great for mechanical parts',
};

const FORMAT_ICONS: Record<string, string> = {
  glb:  '🟢', gltf: '🟢', stl: '🔵', obj: '🟣',
};

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = 'w-full px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:shadow-glow-sm transition-all font-exo';

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
      {/* Animated upload icon */}
      <motion.div
        animate={isDragging
          ? { y: [-4, 4, -4], scale: 1.15 }
          : { y: [0, -6, 0] }
        }
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

      {/* Accepted formats */}
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

      {/* Drag overlay pulse ring */}
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

// ─── File info bar (shown after file is selected) ─────────────────────────────

function FileInfoBar({ vm }: { vm: VM }) {
  if (!vm.file) return null;
  const fmt = vm.format ?? 'unknown';
  const icon = FORMAT_ICONS[fmt] ?? '📄';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 glass border border-border rounded-xl"
    >
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text font-exo truncate">{vm.file.name}</p>
        <p className="text-xs text-text-muted font-exo">
          {fmt.toUpperCase()} · {vm.fileSizeMB} MB
        </p>
      </div>
      {vm.canPreview && (
        <span className="flex items-center gap-1 text-xs text-green-400 font-exo shrink-0">
          <Check size={12} /> Preview ready
        </span>
      )}
      {!vm.canPreview && (
        <span className="flex items-center gap-1 text-xs text-text-muted font-exo shrink-0">
          <Info size={12} /> No preview for {fmt.toUpperCase()}
        </span>
      )}
      <button
        onClick={vm.reset}
        aria-label="Remove file"
        className="w-7 h-7 rounded-lg glass border border-border flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-400/40 transition-all"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ─── STL geometry viewer ──────────────────────────────────────────────────────

function computeCamera(geometry: THREE.BufferGeometry): {
  position: [number, number, number];
  target:   [number, number, number];
} {
  geometry.computeBoundingBox();
  const box  = geometry.boundingBox ?? new THREE.Box3();
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim   = Math.max(size.x, size.y, size.z) || 10;
  const distance = maxDim * 3;
  return {
    position: [0, maxDim * 0.5, distance],
    target:   [0, 0, 0],
  };
}

function STLPreview({ geometry }: { geometry: THREE.BufferGeometry }) {
  const cam = useMemo(() => computeCamera(geometry), [geometry]);
  const [contextLost, setContextLost] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!contextLost) return;
    const t = setTimeout(() => {
      setContextLost(false);
      setRetryCount(n => n + 1);
    }, 300);
    return () => clearTimeout(t);
  }, [contextLost]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-accent/30 bg-surface" style={{ height: '340px' }}>
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
          <OrbitControls
            target={cam.target}
            autoRotate
            autoRotateSpeed={1.5}
            enableZoom
            enablePan={false}
          />
          <Environment preset="city" />
        </Canvas>
      )}
      <p className="absolute bottom-2 left-3 text-[10px] text-text-muted/60 font-exo pointer-events-none">
        Drag to rotate · Scroll to zoom
      </p>
    </div>
  );
}

// ─── 3D preview panel ─────────────────────────────────────────────────────────

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
          aria-label="Upload a different file"
        >
          <RotateCcw size={12} /> Change file
        </button>
      </div>

      <FileInfoBar vm={vm} />

      {/* STL geometry preview */}
      {vm.format === 'stl' && vm.geometry ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <STLPreview geometry={vm.geometry} />
        </motion.div>
      ) : vm.format === 'stl' && !vm.geometry ? (
        // STL still parsing
        <div className="flex flex-col items-center justify-center gap-3 glass border border-border rounded-2xl py-14 text-text-muted">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-exo">Parsing STL file…</p>
        </div>
      ) : vm.canPreview && vm.previewUrl ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <ModelViewer modelUrl={vm.previewUrl} height="340px" autoRotate />
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 glass border border-border rounded-2xl py-14 text-text-muted">
          <FileBox size={40} className="opacity-30" />
          <p className="text-sm font-exo">3D preview not available for .{vm.format} files</p>
          <p className="text-xs font-exo opacity-70">Upload a .glb or .gltf file for live preview</p>
        </div>
      )}
    </div>
  );
}

// ─── Details form ─────────────────────────────────────────────────────────────

function DetailsForm({ vm }: { vm: VM }) {
  return (
    <div className="glass border border-border rounded-2xl p-6 space-y-5 h-fit">
      <h2 className="font-orbitron text-base font-semibold text-text flex items-center gap-2">
        <FileCheck2 size={16} className="text-primary" /> Model Details
      </h2>

      {/* Name */}
      <div>
        <label htmlFor="model-name" className="block text-xs font-medium text-text-muted font-exo mb-1.5">
          Model Name
        </label>
        <input
          id="model-name"
          type="text"
          value={vm.form.name}
          onChange={e => vm.updateForm('name', e.target.value)}
          placeholder="My Custom Model"
          className={inputCls}
        />
      </div>

      {/* Material */}
      <div>
        <label htmlFor="material" className="block text-xs font-medium text-text-muted font-exo mb-1.5">
          Material
        </label>
        <select
          id="material"
          value={vm.form.material}
          onChange={e => vm.updateForm('material', e.target.value as MaterialType)}
          className={inputCls}
        >
          {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <p className="mt-1.5 text-xs text-text-muted font-exo flex items-start gap-1">
          <Info size={11} className="text-primary/60 mt-0.5 shrink-0" />
          {MATERIAL_INFO[vm.form.material]}
        </p>
      </div>

      {/* Color */}
      <div>
        <label htmlFor="color" className="block text-xs font-medium text-text-muted font-exo mb-1.5">
          Print Color
        </label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              id="color"
              type="color"
              value={vm.form.color}
              onChange={e => vm.updateForm('color', e.target.value)}
              className="w-12 h-10 rounded-xl border border-border cursor-pointer bg-transparent p-0.5"
              aria-label="Choose print color"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={vm.form.color}
              onChange={e => vm.updateForm('color', e.target.value)}
              placeholder="#1e3a5f"
              className={inputCls}
              aria-label="Color hex value"
            />
          </div>
          {/* Color preview swatch */}
          <div
            className="w-10 h-10 rounded-xl border border-border shrink-0"
            style={{ backgroundColor: vm.form.color }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Print quality */}
      <div>
        <label className="block text-xs font-medium text-text-muted font-exo mb-2">
          Print Quality
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRINT_QUALITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => vm.updateForm('printQuality', opt.value)}
              className={[
                'flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all',
                vm.form.printQuality === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border glass text-text-muted hover:border-primary/50 hover:text-text',
              ].join(' ')}
            >
              <span className="text-xs font-orbitron font-semibold">{opt.label}</span>
              <span className="text-[10px] font-exo mt-0.5 opacity-70">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity + Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="quantity" className="block text-xs font-medium text-text-muted font-exo mb-1.5">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={99}
            value={vm.form.quantity}
            onChange={e => vm.updateForm('quantity', Math.max(1, parseInt(e.target.value) || 1))}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-xs font-medium text-text-muted font-exo mb-1.5">
            Price (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-exo">$</span>
            <input
              id="price"
              type="number"
              min={0}
              step={0.01}
              value={vm.form.price}
              onChange={e => vm.updateForm('price', parseFloat(e.target.value) || 0)}
              className={`${inputCls} pl-7`}
            />
          </div>
        </div>
      </div>

      {/* Add to cart */}
      <motion.button
        whileHover={vm.canAddToCart ? { scale: 1.02 } : {}}
        whileTap={vm.canAddToCart ? { scale: 0.98 } : {}}
        onClick={vm.addToCart}
        disabled={!vm.canAddToCart}
        className={[
          'w-full py-3 font-orbitron text-sm font-semibold rounded-xl',
          'flex items-center justify-center gap-2 transition-all',
          vm.phase === 'added'
            ? 'bg-green-500/20 border border-green-500/40 text-green-400'
            : vm.canAddToCart
            ? 'bg-primary text-white hover:shadow-glow'
            : 'bg-border/30 text-text-muted cursor-not-allowed',
        ].join(' ')}
      >
        <AnimatePresence mode="wait" initial={false}>
          {vm.phase === 'added' ? (
            <motion.span key="added" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
              <Check size={16} /> Added to Cart
            </motion.span>
          ) : (
            <motion.span key="add" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
              <ShoppingCart size={16} /> Add to Cart
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Post-add actions */}
      <AnimatePresence>
        {vm.phase === 'added' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 overflow-hidden"
          >
            <button
              onClick={vm.reset}
              className="flex-1 py-2 glass border border-border rounded-xl text-xs font-exo text-text-muted hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} /> Upload another
            </button>
            <a href="/checkout" className="flex-1">
              <button className="w-full py-2 bg-primary/10 border border-primary/30 rounded-xl text-xs font-exo text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5">
                Checkout <ArrowRight size={12} />
              </button>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const vm       = useUploadViewModel();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile  = vm.phase === 'ready' || vm.phase === 'added';

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
            Upload your own STL, OBJ, GLB, or GLTF file. Configure material, color, and quality — then add it straight to your cart.
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
              <button onClick={() => vm.reset()} aria-label="Dismiss error" className="ml-auto hover:text-red-300 transition-colors">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left: drop zone or preview */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!hasFile ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <DropZone vm={vm} inputRef={inputRef} />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <PreviewPanel vm={vm} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feature callouts */}
            {!hasFile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { icon: <Zap size={14} />,    label: 'Instant preview',  desc: 'STL, GLB & GLTF render live' },
                  { icon: <Layers size={14} />,  label: '4 formats',        desc: 'STL, OBJ, GLB, GLTF'       },
                  { icon: <ShoppingCart size={14} />, label: 'Direct to cart', desc: 'No account needed'      },
                ].map(f => (
                  <div key={f.label} className="glass border border-border rounded-xl p-3 text-center">
                    <div className="text-primary flex justify-center mb-1.5">{f.icon}</div>
                    <p className="text-xs font-orbitron text-text font-semibold">{f.label}</p>
                    <p className="text-[10px] text-text-muted font-exo mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right: details form */}
          <DetailsForm vm={vm} />
        </div>
      </div>
    </PageWrapper>
  );
}
