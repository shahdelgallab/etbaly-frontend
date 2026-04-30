import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { slicingService } from '../services/slicingService';
import { cartService } from '../services/cartService';
import { useAppDispatch } from '../store/hooks';
import { fetchCartThunk, openCart as reduxOpenCart } from '../store/slices/cartSlice';
import { getDirectImageUrl } from '../utils/imageUtils';
import type { ApiProduct } from '../types/api';
import type { SlicingPreset } from '../models/SlicingJob';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DetailPhase = 'idle' | 'slicing' | 'quoted' | 'adding' | 'added';

export interface PrintOptions {
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

const DEFAULT_OPTIONS: PrintOptions = {
  material: 'PLA',
  color:    'White',
  preset:   'normal',
  scale:    100,
};

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useProductDetailViewModel() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [product,  setProduct]  = useState<ApiProduct | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Print options — defaults to PLA / White / normal / 100%
  const [opts, setOpts] = useState<PrintOptions>(DEFAULT_OPTIONS);

  // Phase state machine
  const [phase,       setPhase]       = useState<DetailPhase>('idle');
  const [quote,       setQuote]       = useState<QuoteResult | null>(null);
  const [slicingJobId, setSlicingJobId] = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  // Whether the re-quote panel is open
  const [showReQuote, setShowReQuote] = useState(false);

  // ── Load product ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    productService.getById(id)
      .then(p => setProduct(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const apiBase    = import.meta.env.VITE_API_URL as string ?? '';
  const rawImage   = product?.images?.[0] ?? '';
  const imageUrl   = rawImage ? getDirectImageUrl(rawImage, apiBase) : '';
  const isProxied  = imageUrl.includes('/files/proxy');

  // ── Update options ──────────────────────────────────────────────────────────
  const updateOpts = useCallback((patch: Partial<PrintOptions>) => {
    setOpts(prev => ({ ...prev, ...patch }));
  }, []);

  // ── Add to cart with current options (no slicing) ───────────────────────────
  const addToCart = useCallback(async () => {
    if (!product) return;
    setPhase('adding');
    setError(null);
    try {
      await cartService.addItem({
        itemType:  'Product',
        itemRefId: product._id,
        quantity:  1,
        printingProperties: {
          material: opts.material as 'PLA' | 'ABS' | 'PETG' | 'TPU' | 'Resin',
          color:    opts.color || undefined,
          scale:    opts.scale,
          preset:   opts.preset,
        },
      });
      await dispatch(fetchCartThunk());
      dispatch(reduxOpenCart());
      setPhase('added');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to add to cart.';
      setError(msg);
      setPhase('idle');
    }
  }, [product, opts, dispatch]);

  // ── Run slicing to get a quote ───────────────────────────────────────────────
  const runSlicing = useCallback(async () => {
    if (!product?.linkedDesignId) {
      setError('This product has no linked 3D design for slicing.');
      return;
    }
    setPhase('slicing');
    setError(null);
    try {
      const resp = await slicingService.executeSlicing({
        designId: product.linkedDesignId,
        material: opts.material,
        color:    opts.color || undefined,
        preset:   opts.preset,
        scale:    opts.scale,
      });

      const completed = await slicingService.pollJobStatus(resp.jobId, undefined, 120, 5000);

      if (
        completed.weight && completed.dimensions &&
        completed.printTime && completed.calculatedPrice && completed.gcodeUrl
      ) {
        setSlicingJobId(resp.jobId);
        setQuote({
          weight:          completed.weight,
          dimensions:      completed.dimensions,
          printTime:       completed.printTime,
          calculatedPrice: completed.calculatedPrice,
          gcodeUrl:        completed.gcodeUrl,
        });
        setPhase('quoted');
      } else {
        throw new Error('Incomplete slicing data returned.');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Slicing failed.';
      setError(msg);
      setPhase('idle');
    }
  }, [product, opts]);

  // ── Add to cart after getting a quote — uses slicingJobId (Mode 1) ──────────
  const addToCartAfterQuote = useCallback(async () => {
    if (!slicingJobId) return;
    setPhase('adding');
    setError(null);
    try {
      await cartService.addItem({
        slicingJobId,
        quantity: 1,
      } as Parameters<typeof cartService.addItem>[0]);
      await dispatch(fetchCartThunk());
      dispatch(reduxOpenCart());
      setPhase('added');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to add to cart.';
      setError(msg);
      setPhase('quoted');
    }
  }, [slicingJobId, dispatch]);

  const backToOptions = useCallback(() => {
    setQuote(null);
    setSlicingJobId(null);
    setPhase('idle');
  }, []);

  const resetAdded = useCallback(() => {
    setPhase('idle');
    setQuote(null);
    setSlicingJobId(null);
    setShowReQuote(false);
  }, []);

  const goBack = () => navigate(-1);

  return {
    product,
    loading,
    notFound,
    imageUrl,
    isProxied,
    opts,
    updateOpts,
    phase,
    quote,
    error,
    showReQuote,
    setShowReQuote,
    addToCart,
    runSlicing,
    addToCartAfterQuote,
    backToOptions,
    resetAdded,
    goBack,
  };
}
