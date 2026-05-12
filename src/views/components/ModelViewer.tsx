import { Suspense, lazy } from 'react';
import { AlertTriangle } from 'lucide-react';

// Lazy-load the heavy Three.js canvas — never blocks page render
const ModelViewerCanvas = lazy(() => import('./ModelViewerCanvas'));

interface Props {
  modelUrl: string;
  autoRotate?: boolean;
  height?: string;
}

function Skeleton({ height }: { height: string }) {
  return (
    <div
      className="shimmer rounded-2xl w-full"
      style={{ height }}
      role="status"
      aria-label="Loading 3D model"
    />
  );
}

export default function ModelViewer({ modelUrl, autoRotate = true, height = '300px' }: Props) {
  if (!modelUrl) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-2xl glass border border-border text-text-muted"
        style={{ height }}
      >
        <AlertTriangle size={22} className="text-primary/60" />
        <span className="text-sm font-exo">No model available</span>
      </div>
    );
  }

  return (
    <Suspense fallback={<Skeleton height={height} />}>
      <ModelViewerCanvas modelUrl={modelUrl} autoRotate={autoRotate} height={height} />
    </Suspense>
  );
}
