import { useState, useEffect, Suspense, Component, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { fetchAndParseSTL } from '../../utils/stlLoader';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

// ─── Error boundary ───────────────────────────────────────────────────────────

class ModelErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Camera auto-fit ──────────────────────────────────────────────────────────
// geometry.center() already ran in stlLoader — bounding box center is (0,0,0).
// We only need the size to compute a good camera distance.

function computeCamera(geometry: THREE.BufferGeometry): {
  position: [number, number, number];
  target:   [number, number, number];
} {
  geometry.computeBoundingBox();
  const box  = geometry.boundingBox ?? new THREE.Box3();
  const size = new THREE.Vector3();
  box.getSize(size);
  // After center(), the mesh sits at origin — target is always (0,0,0)
  const maxDim   = Math.max(size.x, size.y, size.z) || 10;
  const distance = maxDim * 3;
  return {
    position: [0, maxDim * 0.5, distance],
    target:   [0, 0, 0],
  };
}

// ─── Geometry mesh ────────────────────────────────────────────────────────────
// Do NOT use <Center> here — geometry is already centered by stlLoader

function GeometryMesh({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#1e3a5f" metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  modelUrl:    string;
  autoRotate?: boolean;
  height?:     string;
}

export default function ModelViewerCanvas({ modelUrl, autoRotate = true, height = '300px' }: Props) {
  const [geometry,    setGeometry]    = useState<THREE.BufferGeometry | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [renderError, setRenderError] = useState(false);
  const [retryKey,    setRetry]       = useState(0);
  const [autoRot,     setAutoRot]     = useState(autoRotate);

  // Fetch + parse STL on mount / url change
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setGeometry(null);
      setRenderError(false);

      try {
        const geom = await fetchAndParseSTL(modelUrl);
        if (!cancelled) { setGeometry(geom); setLoading(false); }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [modelUrl, retryKey]);

  const cam = useMemo(
    () => geometry ? computeCamera(geometry) : null,
    [geometry]
  );

  const retry = () => { setRetry(k => k + 1); };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-2xl glass border border-border"
        style={{ height }}
      >
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-exo text-text-muted">Loading 3D model…</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || renderError || !geometry || !cam) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl glass border border-border text-text-muted"
        style={{ height }}
      >
        <AlertTriangle size={28} className="text-danger/60" />
        <p className="text-sm font-exo text-center px-4">
          {error ?? 'Failed to render 3D model'}
        </p>
        <button onClick={retry} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-exo">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  // ── Canvas — only mount AFTER geometry is ready ───────────────────────────
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-accent/30 bg-surface"
      style={{ height, boxShadow: '0 0 20px rgba(59,130,246,0.15)' }}
    >
      <Canvas
        key={`${retryKey}-${cam.position[2].toFixed(0)}`}
        camera={{ position: cam.position, fov: 50, near: 0.01, far: cam.position[2] * 100 }}
        gl={{ antialias: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          const handleLost = () => retry();
          canvas.addEventListener('webglcontextlost', handleLost);
          return () => canvas.removeEventListener('webglcontextlost', handleLost);
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, -2, -5]} intensity={0.3} />

        <ModelErrorBoundary onError={() => setRenderError(true)}>
          <Suspense fallback={null}>
            <GeometryMesh geometry={geometry} />
          </Suspense>
        </ModelErrorBoundary>

        <OrbitControls
          target={cam.target}
          autoRotate={autoRot}
          autoRotateSpeed={1.5}
          enableZoom
          enablePan={false}
        />
        <Environment preset="city" />
      </Canvas>

      <div className="absolute bottom-2 right-2">
        <button
          onClick={() => setAutoRot(r => !r)}
          aria-label={autoRot ? 'Pause rotation' : 'Resume rotation'}
          className="w-7 h-7 rounded-lg glass border border-border/60 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
        >
          <RotateCcw size={12} className={autoRot ? 'text-primary' : ''} />
        </button>
      </div>
      <p className="absolute bottom-2 left-2 text-[10px] text-text-muted/60 font-exo pointer-events-none">
        Drag to rotate · Scroll to zoom
      </p>
    </div>
  );
}
