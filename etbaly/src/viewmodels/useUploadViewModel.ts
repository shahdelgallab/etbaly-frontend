import { useState, useCallback, useRef } from 'react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { BufferGeometry } from 'three';
import { useCartStore } from '../store/cartStore';
import { designService } from '../services/designService';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { addCartItemThunk } from '../store/slices/cartSlice';import {
  ACCEPTED_FORMATS,
  MAX_FILE_SIZE_BYTES,
  getFileFormat,
} from '../models/UploadedModel';
import type { UploadFormValues, ModelFileFormat } from '../models/UploadedModel';
import type { PrintQuality } from '../models/Product';

// ─── Re-export for convenience ────────────────────────────────────────────────
export type { UploadFormValues };

// ─── Upload progress state ────────────────────────────────────────────────────

export type UploadPhase = 'idle' | 'dragging' | 'validating' | 'ready' | 'added';

const DEFAULT_FORM: UploadFormValues = {
  name:         '',
  material:     'PLA',
  color:        '#1e3a5f',  // Navy blue
  quantity:     1,
  price:        29.99,
  printQuality: 'standard',
};

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useUploadViewModel() {
  const [file, setFile]             = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [geometry, setGeometry]     = useState<BufferGeometry | null>(null);
  const [format, setFormat]         = useState<ModelFileFormat | null>(null);
  const [phase, setPhase]           = useState<UploadPhase>('idle');
  const [error, setError]           = useState<string | null>(null);
  const [form, setForm]             = useState<UploadFormValues>(DEFAULT_FORM);
  const objectUrlRef                = useRef<string | null>(null);

  const { addItem, openCart } = useCartStore();
  const dispatch              = useAppDispatch();
  const { user }              = useAppSelector(s => s.auth);

  // ── Validation ──
  const validate = (f: File): string | null => {
    const fmt = getFileFormat(f.name);
    if (!fmt) {
      return `Unsupported format. Accepted: ${ACCEPTED_FORMATS.map(x => `.${x}`).join(', ')}`;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 200 MB.`;
    }
    return null;
  };

  // ── Core file handler ──
  const handleFile = useCallback((f: File) => {
    setPhase('validating');
    const err = validate(f);
    if (err) {
      setError(err);
      setPhase('idle');
      return;
    }

    // Revoke previous object URL to avoid memory leaks
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

    const url = URL.createObjectURL(f);
    objectUrlRef.current = url;

    const fmt = getFileFormat(f.name)!;
    setError(null);
    setFile(f);
    setFormat(fmt);
    setGeometry(null);
    setForm(prev => ({ ...prev, name: f.name.replace(/\.[^.]+$/, '') }));

    if (fmt === 'glb' || fmt === 'gltf') {
      // GLB/GLTF: use object URL directly in ModelViewerCanvas
      setPreviewUrl(url);
      setPhase('ready');
    } else if (fmt === 'stl') {
      // STL: parse client-side into BufferGeometry for Three.js canvas
      setPreviewUrl(url); // keep url for cart
      f.arrayBuffer().then(buffer => {
        const loader = new STLLoader();
        const geom   = loader.parse(buffer);
        geom.center();
        geom.computeVertexNormals();
        setGeometry(geom);
        setPhase('ready');
      }).catch(() => {
        setError('Failed to parse STL file.');
        setPhase('idle');
      });
    } else {
      // OBJ: no client-side preview
      setPreviewUrl(url);
      setPhase('ready');
    }
  }, []);

  // ── Drag events ──
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setPhase('dragging'); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setPhase('idle'); }, []);
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
    else setPhase('idle');
  }, [handleFile]);

  // ── File input ──
  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = ''; // allow re-selecting same file
  }, [handleFile]);

  // ── Form updates ──
  const updateForm = useCallback(<K extends keyof UploadFormValues>(
    field: K,
    value: UploadFormValues[K],
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Add to cart ──
  const addToCart = useCallback(async () => {
    if (!file) return;

    // Admin: upload to backend (two-step: upload file → create design record → add to cart)
    if (user?.role === 'admin') {
      setPhase('validating');
      try {
        const fileUrl = await designService.adminUploadFile(file);
        const design  = await designService.adminCreate({
          name:     form.name || file.name,
          fileUrl,
          metadata: { supportedMaterials: ['PLA'] },
        });
        await dispatch(addCartItemThunk({
          itemType:      'Design',
          itemRefId:     design._id,
          quantity:      form.quantity,
          customization: { color: form.color },
        }));
        openCart();
        setPhase('added');
        return;
      } catch {
        setError('Upload failed. Please try again.');
        setPhase('ready');
        return;
      }
    }

    // Regular user / guest — local Zustand cart only
    addItem(
      {
        id:           crypto.randomUUID(),
        name:         form.name || file.name,
        description:  `Custom uploaded 3D model (${format?.toUpperCase() ?? 'unknown'})`,
        imageUrl:     '',
        modelUrl:     previewUrl ?? undefined,
        price:        form.price,
        material:     form.material,
        collection:   'Art & Sculptures',
        tags:         ['custom', 'upload', format ?? 'model'],
        rating:       5,
        reviewCount:  0,
        stock:        form.quantity,
        isFeatured:   false,
        isActive:     true,
        printQuality: form.printQuality,
        createdAt:    new Date(),
      },
      form.quantity,
      previewUrl ?? undefined,
    );
    openCart();
    setPhase('added');
  }, [file, format, previewUrl, form, addItem, openCart, user, dispatch]);

  // ── Reset ──
  const reset = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setFile(null);
    setPreviewUrl(null);
    setGeometry(null);
    setFormat(null);
    setError(null);
    setPhase('idle');
    setForm(DEFAULT_FORM);
  }, []);

  // ── Derived ──
  const fileSizeMB   = file ? (file.size / 1024 / 1024).toFixed(2) : null;
  const canPreview   = previewUrl !== null || geometry !== null;
  const canAddToCart = phase === 'ready' || phase === 'added';

  return {
    file,
    previewUrl,
    geometry,
    format,
    phase,
    error,
    form,
    fileSizeMB,
    canPreview,
    canAddToCart,
    updateForm,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileInput,
    addToCart,
    reset,
  };
}

// ─── Print quality options ────────────────────────────────────────────────────

export const PRINT_QUALITY_OPTIONS: { value: PrintQuality; label: string; desc: string }[] = [
  { value: 'draft',    label: 'Draft',    desc: 'Fast print, visible layers'     },
  { value: 'standard', label: 'Standard', desc: 'Balanced quality & speed'       },
  { value: 'high',     label: 'High',     desc: 'Fine detail, slower print'      },
  { value: 'ultra',    label: 'Ultra',    desc: 'Maximum detail, longest time'   },
];
