import { useState, useCallback, useRef } from 'react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { BufferGeometry } from 'three';
import { designService } from '../services/designService';
import { slicingService } from '../services/slicingService';
import { cartService } from '../services/cartService';
import { useAppDispatch } from '../store/hooks';
import { fetchCartThunk, openCart as reduxOpenCart } from '../store/slices/cartSlice';
import {
  ACCEPTED_FORMATS,
  MAX_FILE_SIZE_BYTES,
  getFileFormat,
} from '../models/UploadedModel';
import type { ModelFileFormat } from '../models/UploadedModel';
import type { SlicingPreset } from '../models/SlicingJob';

// ─── Phase state machine ──────────────────────────────────────────────────────
//
//  idle → dragging → validating → preview
//       → options   (file uploaded to backend, design created)
//       → slicing   (slicing job running)
//       → quoted    (slicing complete, showing results)
//       → added     (added to cart)

export type UploadPhase =
  | 'idle'
  | 'dragging'
  | 'validating'
  | 'preview'       // file selected, showing local preview
  | 'uploading'     // uploading to backend
  | 'options'       // design created, showing QuotationPanel
  | 'slicing'       // slicing job in progress
  | 'quoted'        // slicing complete, showing quote
  | 'added';        // added to cart

export interface SlicingOptions {
  material: string;
  color:    string;
  preset:   SlicingPreset;
  scale:    number;
}

export interface QuoteResult {
  weight:          number;
  dimensions:      { width: number; height: number; depth: number };
  printTime:       number;
  calculatedPrice: number;
  gcodeUrl:        string;
}

const DEFAULT_SLICING: SlicingOptions = {
  material: 'PLA',
  color:    '',
  preset:   'normal',
  scale:    100,
};

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useUploadViewModel() {
  const [file,        setFile]        = useState<File | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [geometry,    setGeometry]    = useState<BufferGeometry | null>(null);
  const [format,      setFormat]      = useState<ModelFileFormat | null>(null);
  const [phase,       setPhase]       = useState<UploadPhase>('idle');
  const [error,       setError]       = useState<string | null>(null);
  const [designName,  setDesignName]  = useState('');
  const [designId,    setDesignId]    = useState<string | null>(null);
  const [slicingOpts, setSlicingOpts] = useState<SlicingOptions>(DEFAULT_SLICING);
  const [quote,       setQuote]       = useState<QuoteResult | null>(null);
  const [progress,    setProgress]    = useState(0);

  const objectUrlRef = useRef<string | null>(null);
  const dispatch     = useAppDispatch();

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (f: File): string | null => {
    const fmt = getFileFormat(f.name);
    if (!fmt) return `Unsupported format. Accepted: ${ACCEPTED_FORMATS.map(x => `.${x}`).join(', ')}`;
    if (f.size > MAX_FILE_SIZE_BYTES) return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 200 MB.`;
    return null;
  };

  // ── Core file handler ────────────────────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    setPhase('validating');
    const err = validate(f);
    if (err) { setError(err); setPhase('idle'); return; }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(f);
    objectUrlRef.current = url;

    const fmt = getFileFormat(f.name)!;
    setError(null);
    setFile(f);
    setFormat(fmt);
    setGeometry(null);
    setDesignName(f.name.replace(/\.[^.]+$/, ''));

    if (fmt === 'glb' || fmt === 'gltf') {
      setPreviewUrl(url);
      setPhase('preview');
    } else if (fmt === 'stl') {
      setPreviewUrl(url);
      f.arrayBuffer().then(buffer => {
        const loader = new STLLoader();
        const geom   = loader.parse(buffer);
        geom.center();
        geom.computeVertexNormals();
        setGeometry(geom);
        setPhase('preview');
      }).catch(() => { setError('Failed to parse STL file.'); setPhase('idle'); });
    } else {
      setPreviewUrl(url);
      setPhase('preview');
    }
  }, []);

  // ── Drag / input events ──────────────────────────────────────────────────────
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setPhase('dragging'); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setPhase('idle'); }, []);
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f); else setPhase('idle');
  }, [handleFile]);
  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  }, [handleFile]);

  // ── Upload to backend → create design ───────────────────────────────────────
  const uploadAndProceed = useCallback(async () => {
    if (!file) return;
    const name = designName.trim() || file.name.replace(/\.[^.]+$/, '');
    setPhase('uploading');
    setError(null);
    setProgress(0);

    try {
      // Step 1: upload file to Google Drive
      const { fileUrl } = await designService.uploadFile(file, name);
      setProgress(50);

      // Step 2: create design record
      const design = await designService.create({
        name,
        fileUrl,
        metadata: { supportedMaterials: ['PLA'] },
      });
      setProgress(100);
      setDesignId(design._id);
      setPhase('options');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Upload failed. Please try again.';
      setError(msg);
      setPhase('preview');
    }
  }, [file, designName]);

  // ── Update slicing options ───────────────────────────────────────────────────
  const updateSlicingOpts = useCallback((patch: Partial<SlicingOptions>) => {
    setSlicingOpts(prev => ({ ...prev, ...patch }));
  }, []);

  // ── Execute slicing → get quote ──────────────────────────────────────────────
  const getQuote = useCallback(async () => {
    if (!designId) return;
    setPhase('slicing');
    setError(null);
    setProgress(0);

    try {
      const response = await slicingService.executeSlicing({
        designId,
        material: slicingOpts.material,
        color:    slicingOpts.color || undefined,
        preset:   slicingOpts.preset,
        scale:    slicingOpts.scale,
      });
      setProgress(20);

      const completed = await slicingService.pollJobStatus(
        response.jobId,
        job => { if (job.status === 'Processing') setProgress(50); },
        120,
        5000,
      );

      if (
        completed.weight &&
        completed.dimensions &&
        completed.printTime &&
        completed.calculatedPrice &&
        completed.gcodeUrl
      ) {
        setQuote({
          weight:          completed.weight,
          dimensions:      completed.dimensions,
          printTime:       completed.printTime,
          calculatedPrice: completed.calculatedPrice,
          gcodeUrl:        completed.gcodeUrl,
        });
        setProgress(100);
        setPhase('quoted');
      } else {
        throw new Error('Incomplete slicing data returned.');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Slicing failed. Please try again.';
      setError(msg);
      setPhase('options');
    }
  }, [designId, slicingOpts]);

  // ── Add to cart ──────────────────────────────────────────────────────────────
  const addToCart = useCallback(async () => {
    if (!designId || !quote) return;
    setError(null);

    try {
      await cartService.addItem({
        itemType:  'Design',
        itemRefId: designId,
        quantity:  1,
        printingProperties: {
          material: slicingOpts.material as 'PLA' | 'ABS' | 'PETG' | 'TPU' | 'Resin',
          color:    slicingOpts.color || undefined,
          scale:    slicingOpts.scale,
          preset:   slicingOpts.preset,
          customFields: [
            { key: 'printTime',  value: String(quote.printTime)  },
            { key: 'weight',     value: String(quote.weight)     },
            { key: 'width',      value: String(quote.dimensions.width)  },
            { key: 'height',     value: String(quote.dimensions.height) },
            { key: 'depth',      value: String(quote.dimensions.depth)  },
            { key: 'gcodeUrl',   value: quote.gcodeUrl           },
          ],
        },
      });

      await dispatch(fetchCartThunk());
      dispatch(reduxOpenCart());
      setPhase('added');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to add to cart.';
      setError(msg);
    }
  }, [designId, quote, slicingOpts, dispatch]);

  // ── Back to options from quote ───────────────────────────────────────────────
  const backToOptions = useCallback(() => {
    setQuote(null);
    setPhase('options');
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    setFile(null);
    setPreviewUrl(null);
    setGeometry(null);
    setFormat(null);
    setError(null);
    setPhase('idle');
    setDesignName('');
    setDesignId(null);
    setSlicingOpts(DEFAULT_SLICING);
    setQuote(null);
    setProgress(0);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : null;
  const canPreview = previewUrl !== null || geometry !== null;

  return {
    // file state
    file, previewUrl, geometry, format, fileSizeMB, canPreview,
    // phase & feedback
    phase, error, progress,
    // design name
    designName, setDesignName,
    // slicing options
    slicingOpts, updateSlicingOpts,
    // quote result
    quote,
    // drag/drop
    onDragOver, onDragLeave, onDrop, onFileInput,
    // actions
    uploadAndProceed,
    getQuote,
    addToCart,
    backToOptions,
    reset,
  };
}
