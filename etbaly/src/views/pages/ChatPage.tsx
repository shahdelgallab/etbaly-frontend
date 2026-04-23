import { useRef, useState, Suspense, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import {
  ImagePlus, X, RotateCcw, Bot, User,
  Wand2, ShoppingCart, CheckCircle2, Upload, Type, Image,
  Send, ArrowRight,
} from 'lucide-react';
import { useChatViewModel } from '../../viewmodels/useChatViewModel';
import type { ChatMode } from '../../viewmodels/useChatViewModel';
import PageWrapper from '../components/PageWrapper';
import { AuthenticatedImage } from '../components/AuthenticatedImage';
import { QuotationPanel, QuoteReadyPanel } from '../components/QuotationPanel';
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
  const [imageError, setImageError] = useState(false);
  
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
        {msg.imageUrl && !imageError && (
          <AuthenticatedImage
            src={msg.imageUrl}
            alt={msg.role === 'user' ? 'Uploaded reference' : 'Generated image'}
            className="max-w-xs rounded-xl border border-border object-cover"
            onError={() => {
              console.error('Failed to load image:', msg.imageUrl);
              setImageError(true);
            }}
            onLoad={() => console.log('Image loaded successfully:', msg.imageUrl)}
          />
        )}
        {msg.imageUrl && imageError && (
          <div className="px-3 py-2 glass border border-border rounded-lg text-xs text-text-muted font-exo max-w-xs">
            <p className="mb-1">Failed to load image</p>
            <p className="text-[10px] break-all">{msg.imageUrl}</p>
          </div>
        )}
        <span className="text-[10px] text-text-muted font-exo px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Confirm bar (Get Quotation) ─────────────────────────────────────────────

function ConfirmBar({ onConfirm, onReject }: { onConfirm: () => void; onReject: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      className="flex flex-col sm:flex-row gap-3 justify-center items-center py-3 px-2"
    >
      <button onClick={onConfirm}
        className="flex items-center gap-2 px-6 py-2.5 bg-accent/10 border border-accent/40 text-accent rounded-xl text-sm font-exo hover:bg-accent/20 transition-all w-full sm:w-auto justify-center">
        <ArrowRight size={15} /> Get Quotation
      </button>
      <button onClick={onReject}
        className="flex items-center gap-2 px-6 py-2.5 glass border border-border text-text-muted rounded-xl text-sm font-exo hover:border-primary hover:text-text transition-all w-full sm:w-auto justify-center">
        <X size={15} /> Regenerate
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

// ─── Mode selector ────────────────────────────────────────────────────────────

function ModeSelector({ onSelect }: { onSelect: (mode: ChatMode) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full gap-6 text-center py-8"
    >
      <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/30 flex items-center justify-center">
        <Wand2 size={36} className="text-accent" />
      </div>
      <div>
        <h2 className="font-orbitron text-xl font-bold text-text mb-2">AI 3D Model Generator</h2>
        <p className="text-text-muted text-sm font-exo max-w-md">
          Choose how you want to create your 3D model
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {/* Text to 3D */}
        <button
          onClick={() => onSelect('text-to-3d')}
          className="group glass border border-border hover:border-primary rounded-2xl p-6 transition-all hover:shadow-glow-sm"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-all">
            <Type size={24} />
          </div>
          <h3 className="font-orbitron text-base font-bold text-text mb-2">Text to 3D</h3>
          <p className="text-xs text-text-muted font-exo leading-relaxed">
            Describe your idea in words and AI will generate an image, then convert it to a 3D model
          </p>
        </button>

        {/* Image to 3D */}
        <button
          onClick={() => onSelect('image-to-3d')}
          className="group glass border border-border hover:border-accent rounded-2xl p-6 transition-all hover:shadow-glow-sm"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/20 transition-all">
            <Image size={24} />
          </div>
          <h3 className="font-orbitron text-base font-bold text-text mb-2">Image to 3D</h3>
          <p className="text-xs text-text-muted font-exo leading-relaxed">
            Upload a reference photo and AI will generate a printable 3D model directly
          </p>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Text input form ──────────────────────────────────────────────────────────

function TextPromptForm({ onSubmit, loading }: { onSubmit: (prompt: string, name: string) => void; loading: boolean }) {
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (prompt.trim().length < 1 || name.trim().length < 2) return;
    onSubmit(prompt.trim(), name.trim());
    setPrompt('');
    setName('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-border rounded-2xl p-5 space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-text-muted font-exo mb-1.5">
          Describe your 3D model
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. A futuristic vase with geometric patterns"
          maxLength={500}
          rows={3}
          className="w-full px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary transition-all resize-none"
        />
        <p className="text-[11px] text-text-muted font-exo mt-1">
          {prompt.length}/500 characters
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted font-exo mb-1.5">
          Design Name
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Geometric Vase"
          maxLength={100}
          className="w-full px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary transition-all"
        />
        <p className="text-[11px] text-text-muted font-exo mt-1">2–100 characters</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || prompt.trim().length < 1 || name.trim().length < 2}
        className="w-full py-2.5 bg-primary text-white font-orbitron text-sm rounded-xl hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Send size={14} /> Generate Image
          </>
        )}
      </button>
    </motion.div>
  );
}

// ─── Image preview with approve/reject ────────────────────────────────────────

function ImagePreview({ imageUrl, onApprove, onReject, loading }: {
  imageUrl: string;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-border rounded-2xl p-5 space-y-4"
    >
      <div>
        <p className="text-xs font-medium text-text-muted font-exo mb-3">Generated Image Preview</p>
        {imageError ? (
          <div className="w-full p-6 glass border border-error/30 rounded-xl text-center space-y-2">
            <p className="text-sm text-error font-exo">Failed to load generated image</p>
            <p className="text-xs text-text-muted font-mono break-all">{imageUrl}</p>
          </div>
        ) : (
          <AuthenticatedImage
            src={imageUrl}
            alt="Generated preview"
            className="w-full rounded-xl border border-border object-cover"
            onError={() => {
              console.error('ImagePreview: Failed to load image:', imageUrl);
              setImageError(true);
            }}
            onLoad={() => console.log('ImagePreview: Image loaded successfully:', imageUrl)}
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onReject}
          disabled={loading}
          className="flex-1 py-2.5 glass border border-border text-text-muted font-exo text-sm rounded-xl hover:text-primary hover:border-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <X size={15} /> Try Different Prompt
        </button>
        <button
          onClick={onApprove}
          disabled={loading}
          className="flex-1 py-2.5 bg-success/10 border border-success/40 text-success font-exo text-sm rounded-xl hover:bg-success/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-success/30 border-t-success rounded-full animate-spin" />
          ) : (
            <>
              <ArrowRight size={15} /> Convert to 3D Model
            </>
          )}
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [vm.messages.length, vm.chatStep]);

  const handleModeSelect = (mode: ChatMode) => {
    vm.setChatMode(mode);
  };

  const handleFile = (file: File) => setPendingFile(file);
  const handleCancelFile = () => setPendingFile(null);

  const handleImageSubmit = async (name: string) => {
    if (!pendingFile) return;
    const file = pendingFile;
    setPendingFile(null);
    await vm.generateFromImage(file, name);
  };

  const handleTextSubmit = async (prompt: string, name: string) => {
    await vm.generateImageFromText(prompt, name);
  };

  const canInput = vm.chatStep === 'idle' || vm.chatStep === 'done';
  const isGenerating = vm.chatStep === 'generating';
  const showImagePreview = vm.chatStep === 'image-preview' && vm.pendingImageUrl;
  const showModelPreview = (vm.chatStep === 'confirm' || vm.chatStep === 'done') && vm.pendingModel?.geometry;

  // Dynamic header based on mode
  const HeaderIcon = vm.chatMode === 'text-to-3d' ? Type : vm.chatMode === 'image-to-3d' ? Image : Wand2;
  const headerTitle = vm.chatMode === 'text-to-3d' 
    ? 'Text → 3D Generator' 
    : vm.chatMode === 'image-to-3d' 
    ? 'Image → 3D Generator' 
    : 'AI 3D Generator';
  const headerSubtitle = vm.chatMode === 'text-to-3d'
    ? 'Describe your idea and AI will generate an image, then convert it to 3D'
    : vm.chatMode === 'image-to-3d'
    ? 'Upload a photo and AI will generate a printable 3D model'
    : 'Choose your generation method';

  return (
    <PageWrapper className="flex flex-col overflow-hidden">
      <div
        className="flex flex-col max-w-3xl mx-auto w-full px-4"
        style={{ height: 'calc(100vh - 4rem)', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <HeaderIcon size={20} />
            </div>
            <div>
              <h1 className="font-orbitron text-lg font-bold text-text leading-tight">{headerTitle}</h1>
              <p className="text-text-muted text-xs font-exo">{headerSubtitle}</p>
            </div>
          </div>
          <button
            onClick={vm.reset}
            aria-label="Reset"
            className="flex items-center gap-1.5 px-3 py-1.5 glass border border-border rounded-lg text-xs text-text-muted hover:text-primary hover:border-primary transition-all font-exo"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        {/* Message feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {/* Mode selector — shown when no mode selected */}
          {!vm.chatMode && vm.messages.length === 0 && (
            <ModeSelector onSelect={handleModeSelect} />
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {vm.messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>

          {/* Typing */}
          {vm.loading && <TypingIndicator />}

          {/* Progress bar during generation */}
          <AnimatePresence>
            {isGenerating && <GenerationProgress stage={vm.stage} progress={vm.progress} />}
          </AnimatePresence>

          {/* Image preview (text-to-3d only) */}
          <AnimatePresence>
            {showImagePreview && (
              <ImagePreview
                imageUrl={vm.pendingImageUrl!}
                onApprove={vm.approveImageAndConvertTo3D}
                onReject={vm.rejectGeneratedImage}
                loading={vm.loading}
              />
            )}
          </AnimatePresence>

          {/* 3D model preview */}
          {showModelPreview && <ModelPreview geometry={vm.pendingModel!.geometry} />}

          {/* Confirm / Quotation / Quote Ready */}
          <AnimatePresence>
            {vm.chatStep === 'confirm' && vm.pendingModel && (
              <ConfirmBar onConfirm={vm.requestQuotation} onReject={vm.rejectModel} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(vm.chatStep === 'quotation' || vm.chatStep === 'slicing') && (
              <QuotationPanel
                slicingOptions={vm.slicingOptions}
                onUpdateOptions={vm.updateSlicingOptions}
                onExecute={vm.executeSlicing}
                loading={vm.chatStep === 'slicing'}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {vm.chatStep === 'quote-ready' && vm.quotationData && vm.pendingModel && (
              <QuoteReadyPanel
                quotationData={vm.quotationData}
                slicingOptions={vm.slicingOptions}
                modelName={vm.pendingModel.suggestedName}
                onAddToCart={vm.confirmModel}
                onRegenerate={vm.rejectModel}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {vm.chatStep === 'done' && <DoneBanner onReset={vm.reset} />}
          </AnimatePresence>
        </div>

        {/* Bottom input area */}
        <div className="flex-shrink-0 mt-4 space-y-3">
          {vm.chatMode === 'image-to-3d' && canInput && (
            pendingFile ? (
              <NameForm
                file={pendingFile}
                onSubmit={handleImageSubmit}
                onCancel={handleCancelFile}
                loading={vm.loading}
              />
            ) : (
              <UploadZone onFile={handleFile} disabled={vm.loading} />
            )
          )}

          {vm.chatMode === 'text-to-3d' && canInput && (
            <TextPromptForm onSubmit={handleTextSubmit} loading={vm.loading} />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
