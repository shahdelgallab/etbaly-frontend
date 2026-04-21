import { useRef, useState, Suspense, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';import {
  ImagePlus, Check, X, RotateCcw, Bot, User,
  Wand2, ShoppingCart, CheckCircle2, Upload,
} from 'lucide-react';
import { useChatViewModel } from '../../viewmodels/useChatViewModel';
import PageWrapper from '../components/PageWrapper';
import type { ChatMessage } from '../../models/ChatMessage';
import type { GenerationStage } from '../../viewmodels/useChatViewModel';

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGES: { key: GenerationStage; label: string; end: number }[] = [
  { key: 'upload',   label: 'Upload',   end: 25  },
  { key: 'generate', label: 'Generate', end: 75  },
  { key: 'download', label: 'Download', end: 90  },
  { key: 'render',   label: 'Render',   end: 100 },
];

// ─── 4-stage progress bar ─────────────────────────────────────────────────────

function GenerationProgress({ stage, progress }: { stage: GenerationStage; progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass border border-accent/30 rounded-2xl p-4 space-y-3 bg-accent/5"
    >
      {/* Stage dots */}
      <div className="grid grid-cols-4 gap-1">
        {STAGES.map((s, i) => {
          const isActive = stage === s.key;
          const isDone   = progress >= s.end;
          return (
            <div key={s.key} className="flex flex-col items-center gap-1">
              <div className={[
                'w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all',
                isDone   ? 'bg-success border-success text-white'
                : isActive ? 'bg-accent/20 border-accent text-accent animate-pulse'
                           : 'bg-surface border-border text-text-muted',
              ].join(' ')}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className={[
                'text-[10px] font-exo text-center leading-tight',
                isActive ? 'text-accent font-semibold' : isDone ? 'text-success' : 'text-text-muted',
              ].join(' ')}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bar */}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Label + % */}
      <div className="flex items-center justify-between text-xs font-exo">
        <span className="flex items-center gap-1.5 text-accent">
          <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          {STAGES.find(s => s.key === stage)?.label ?? 'Processing'}…
        </span>
        <span className="font-orbitron text-text font-bold">{Math.round(progress)}%</span>
      </div>
    </motion.div>
  );
}

// ─── Single 3D canvas ─────────────────────────────────────────────────────────

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

function ModelPreview({ geometry }: { geometry: THREE.BufferGeometry }) {
  const cam = useMemo(() => computeCamera(geometry), [geometry]);
  const canvasKey = geometry.uuid;

  // Auto-retry state: if WebGL context creation fails on first mount,
  // wait 300ms and remount the Canvas with a new key.
  const [retryCount, setRetryCount] = useState(0);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    if (!contextLost) return;
    const t = setTimeout(() => {
      setContextLost(false);
      setRetryCount(n => n + 1);
    }, 300);
    return () => clearTimeout(t);
  }, [contextLost]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden border border-accent/30 bg-surface max-w-sm mx-auto"
      style={{ height: '220px' }}
    >
      {contextLost ? (
        // Brief loading state while waiting to retry
        <div className="w-full h-full flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-exo text-text-muted">Initializing renderer…</span>
        </div>
      ) : (
        <Canvas
          key={`${canvasKey}-${retryCount}`}
          camera={{ position: cam.position, fov: 50, near: 0.01, far: cam.position[2] * 100 }}
          gl={{ antialias: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
          onCreated={({ gl }) => {
            // If the context was lost immediately after creation, trigger retry
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
              <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.4} />
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
    </motion.div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  return (
    <div className={[
      'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center',
      role === 'user'
        ? 'bg-primary text-white shadow-glow-sm'
        : 'bg-surface border border-primary/40 text-primary',
    ].join(' ')}>
      {role === 'user' ? <User size={14} /> : <Bot size={14} />}
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end">
      <Avatar role="assistant" />
      <div className="glass border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map(i => (
          <motion.span key={i} className="w-2 h-2 bg-primary rounded-full block"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.55, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Message bubble (no canvas inside) ───────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
    >
      <Avatar role={msg.role} />
      <div className={`flex flex-col gap-2 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.content && (
          <div className={[
            'px-4 py-3 rounded-2xl text-sm font-exo leading-relaxed',
            isUser
              ? 'bg-primary text-white rounded-br-sm'
              : 'glass border-l-4 border-l-accent border border-border text-text rounded-bl-sm',
          ].join(' ')}>
            {msg.content}
          </div>
        )}
        {msg.imageUrl && (
          <img src={msg.imageUrl} alt="Uploaded reference"
            className="max-w-xs rounded-xl border border-border object-cover" />
        )}
        <span className="text-[10px] text-text-muted font-exo px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Confirm bar ──────────────────────────────────────────────────────────────

function ConfirmBar({ onConfirm, onReject }: { onConfirm: () => void; onReject: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      className="flex flex-col sm:flex-row gap-3 justify-center items-center py-3 px-2"
    >
      <button onClick={onConfirm}
        className="flex items-center gap-2 px-6 py-2.5 bg-success/10 border border-success/40 text-success rounded-xl text-sm font-exo hover:bg-success/20 transition-all w-full sm:w-auto justify-center">
        <Check size={15} /> Yes, add to cart
      </button>
      <button onClick={onReject}
        className="flex items-center gap-2 px-6 py-2.5 glass border border-accent/40 text-accent rounded-xl text-sm font-exo hover:bg-accent/10 transition-all w-full sm:w-auto justify-center">
        <X size={15} /> Try again
      </button>
    </motion.div>
  );
}

// ─── Done banner ──────────────────────────────────────────────────────────────

function DoneBanner({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-3 py-3 px-4 glass border border-success/30 rounded-2xl bg-success/5"
    >
      <div className="flex items-center gap-2 text-success text-sm font-exo">
        <CheckCircle2 size={16} /> Model added to cart!
      </div>
      <div className="flex gap-2">
        <button onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-1.5 glass border border-border text-text-muted rounded-lg text-xs font-exo hover:text-primary hover:border-primary transition-all">
          <Wand2 size={12} /> Generate another
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

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({ onFile, disabled }: { onFile: (f: File) => void; disabled: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const handle = (file: File) => { if (file.type.startsWith('image/')) onFile(file); };

  return (
    <div
      onClick={() => !disabled && fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f && !disabled) handle(f); }}
      className={[
        'border-2 border-dashed rounded-2xl p-10 text-center transition-all',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        dragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/60 hover:bg-accent/5',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center">
          <Upload size={28} className="text-accent" />
        </div>
        <div>
          <p className="font-orbitron text-sm font-semibold text-text">Drop your image here</p>
          <p className="text-xs text-text-muted font-exo mt-1">JPEG, PNG, WebP · max 10 MB</p>
        </div>
        <button type="button" disabled={disabled}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-orbitron text-sm rounded-xl hover:shadow-glow transition-all disabled:opacity-50">
          <ImagePlus size={15} /> Select Image
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
        className="hidden" disabled={disabled}
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }}
        aria-label="Upload image for 3D generation" />
    </div>
  );
}

// ─── Name form ────────────────────────────────────────────────────────────────

function NameForm({ file, onSubmit, onCancel, loading }: {
  file: File; onSubmit: (name: string) => void; onCancel: () => void; loading: boolean;
}) {
  const [name, setName] = useState(file.name.replace(/\.[^.]+$/, ''));
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <img src={URL.createObjectURL(file)} alt="Preview"
          className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-exo text-text truncate">{file.name}</p>
          <p className="text-xs text-text-muted font-exo">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted font-exo mb-1.5">Design Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Custom Bracket" maxLength={100}
          className="w-full px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary transition-all" />
        <p className="text-[11px] text-text-muted font-exo mt-1">2–100 characters</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} disabled={loading}
          className="flex-1 py-2.5 glass border border-border text-text-muted font-exo text-sm rounded-xl hover:text-primary hover:border-primary transition-all disabled:opacity-50">
          Cancel
        </button>
        <button onClick={() => onSubmit(name.trim())} disabled={loading || name.trim().length < 2}
          className="flex-1 py-2.5 bg-primary text-white font-orbitron text-sm rounded-xl hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Wand2 size={14} /> Generate 3D</>}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const vm = useChatViewModel();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const handleFile   = (file: File) => setPendingFile(file);
  const handleCancel = () => setPendingFile(null);

  const handleSubmit = async (name: string) => {
    if (!pendingFile) return;
    const file = pendingFile;
    setPendingFile(null);
    await vm.generateFromImage(file, name);
    requestAnimationFrame(() => {
      feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const canUpload = vm.chatStep === 'idle' || vm.chatStep === 'done';
  const isGenerating = vm.chatStep === 'generating';
  const showPreview  = (vm.chatStep === 'confirm' || vm.chatStep === 'done') && vm.pendingModel?.geometry;

  return (
    <PageWrapper className="flex flex-col overflow-hidden">
      <div className="flex flex-col max-w-3xl mx-auto w-full px-4"
        style={{ height: 'calc(100vh - 4rem)', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <Wand2 size={20} />
            </div>
            <div>
              <h1 className="font-orbitron text-lg font-bold text-text leading-tight">Image → 3D Generator</h1>
              <p className="text-text-muted text-xs font-exo">Upload a photo and AI will generate a printable 3D model</p>
            </div>
          </div>
          <button onClick={vm.reset} aria-label="Reset"
            className="flex items-center gap-1.5 px-3 py-1.5 glass border border-border rounded-lg text-xs text-text-muted hover:text-primary hover:border-primary transition-all font-exo">
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        {/* Message feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">

          {/* Empty state */}
          {vm.messages.length === 0 && !pendingFile && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 text-center py-8">
              <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Wand2 size={36} className="text-accent" />
              </div>
              <div>
                <h2 className="font-orbitron text-xl font-bold text-text mb-2">Turn any image into a 3D model</h2>
                <p className="text-text-muted text-sm font-exo max-w-sm">
                  Upload a reference photo and our AI will generate a printable 3D design for you.
                </p>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {vm.messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          </AnimatePresence>

          {/* Typing */}
          {vm.loading && <TypingIndicator />}

          {/* ── 4-stage progress bar — shown during generation ── */}
          <AnimatePresence>
            {isGenerating && (
              <GenerationProgress
                stage={vm.stage}
                progress={vm.progress}
              />
            )}
          </AnimatePresence>

          {/* ── Single 3D canvas — no AnimatePresence, prevents unmount during animation ── */}
          {showPreview && (
            <ModelPreview geometry={vm.pendingModel!.geometry} />
          )}

          {/* Confirm / Done */}
          <AnimatePresence>
            {vm.chatStep === 'confirm' && vm.pendingModel && (
              <ConfirmBar onConfirm={vm.confirmModel} onReject={vm.rejectModel} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {vm.chatStep === 'done' && <DoneBanner onReset={vm.reset} />}
          </AnimatePresence>
        </div>

        {/* Bottom — name form or upload zone */}
        <div className="flex-shrink-0 mt-4 space-y-3">
          {pendingFile ? (
            <NameForm file={pendingFile} onSubmit={handleSubmit} onCancel={handleCancel} loading={vm.loading} />
          ) : canUpload ? (
            <UploadZone onFile={handleFile} disabled={vm.loading} />
          ) : null}
        </div>
      </div>
    </PageWrapper>
  );
}
