import { useState, useCallback, useRef } from 'react';
import type { BufferGeometry } from 'three';
import { aiService } from '../services/aiService';
import { useCartStore } from '../store/cartStore';
import { fetchAndParseSTL } from '../utils/stlLoader';
import type { ChatMessage } from '../models/ChatMessage';
import type { Product } from '../models/Product';
import type { JobStatus } from '../services/aiService';

export type ChatStep = 'idle' | 'generating' | 'confirm' | 'done';

export type GenerationStage = 'upload' | 'generate' | 'download' | 'render' | null;

export interface PendingModel {
  modelUrl:      string;
  geometry:      BufferGeometry;
  designId?:     string;
  suggestedName: string;
}

const POLL_INTERVAL_MS  = 1000;
const POLL_MAX_ATTEMPTS = 240;

export function useChatViewModel() {
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [chatStep,      setChatStep]      = useState<ChatStep>('idle');
  const [loading,       setLoading]       = useState(false);
  const [jobId,         setJobId]         = useState<string | null>(null);
  const [jobStatus,     setJobStatus]     = useState<JobStatus | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [pendingModel,  setPendingModel]  = useState<PendingModel | null>(null);

  // ── 4-stage progress ──────────────────────────────────────────────────────
  const [stage,    setStage]    = useState<GenerationStage>(null);
  const [progress, setProgress] = useState(0);

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef  = useRef(0);
  const completedRef = useRef(false); // prevents stale interval ticks after completion

  const { addItem, openCart } = useCartStore();

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID(), timestamp: new Date() }]);
  }, []);

  // ── Stop polling ──────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    attemptsRef.current  = 0;
    completedRef.current = true;
  }, []);

  // ── Download + parse STL via proxy ────────────────────────────────────────

  const downloadAndParse = useCallback(async (publicUrl: string): Promise<BufferGeometry> => {
    setStage('download');
    setProgress(75);
    const geometry = await fetchAndParseSTL(publicUrl);
    setStage('render');
    setProgress(90);
    return geometry;
  }, []);

  // ── Start polling job status ──────────────────────────────────────────────

  const startPolling = useCallback((id: string, designName: string) => {
    attemptsRef.current  = 0;
    completedRef.current = false;

    pollRef.current = setInterval(async () => {
      // Guard: if already completed/stopped, skip this tick entirely
      if (completedRef.current) return;

      attemptsRef.current += 1;

      try {
        const status = await aiService.getJobStatus(id);

        // Check again after async — interval may have been cleared while awaiting
        if (completedRef.current) return;

        setJobStatus(status);
        const overallProgress = 25 + (status.progress * 0.5);
        setProgress(overallProgress);

        if (status.completed && status.result?.publicUrl) {
          stopPolling(); // sets completedRef = true

          try {
            const geometry = await downloadAndParse(status.result.publicUrl);
            // Batch all final state in one go — minimises re-renders
            setPendingModel({
              modelUrl:      status.result.publicUrl,
              geometry,
              designId:      status.result.designId,
              suggestedName: designName,
            });
            setStage(null);
            setProgress(100);
            setChatStep('confirm');
            addMessage({
              role:     'assistant',
              content:  'Your 3D model is ready! Take a look at the preview below.',
              modelUrl: status.result.publicUrl,
            });
          } catch (dlErr: unknown) {
            const msg = dlErr instanceof Error ? dlErr.message : 'Download failed';
            setError(msg);
            setStage(null);
            setChatStep('idle');
            addMessage({ role: 'assistant', content: `Download failed: ${msg}` });
          }
          return;
        }

        if (status.failed) {
          stopPolling();
          setError(status.error ?? 'Generation failed.');
          setStage(null);
          setChatStep('idle');
          addMessage({
            role:    'assistant',
            content: `Generation failed: ${status.error ?? 'Unknown error'}. Please try again.`,
          });
          return;
        }

        if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
          stopPolling();
          setError('Generation timed out. Please try again.');
          setStage(null);
          setChatStep('idle');
          addMessage({ role: 'assistant', content: 'Generation timed out. Please try again.' });
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);
  }, [addMessage, stopPolling, downloadAndParse]);

  // ── Submit image for generation ───────────────────────────────────────────

  const generateFromImage = useCallback(async (imageFile: File, designName: string) => {
    setError(null);
    setLoading(true);
    setJobStatus(null);
    setProgress(0);

    // Stage 1: Upload (0-25%)
    setStage('upload');
    setProgress(0);

    const previewUrl = URL.createObjectURL(imageFile);
    addMessage({ role: 'user', content: designName, imageUrl: previewUrl });

    try {
      const id = await aiService.generateDesign(imageFile, designName);
      setJobId(id);
      setProgress(25);

      // Stage 2: Generate (25-75%)
      setStage('generate');
      setChatStep('generating');
      addMessage({
        role:    'assistant',
        content: `Job queued (ID: ${id}). AI is generating your model…`,
      });
      startPolling(id, designName);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to queue design generation. Please try again.';
      setError(msg);
      setStage(null);
      addMessage({ role: 'assistant', content: `Sorry — ${msg}` });
    } finally {
      setLoading(false);
    }
  }, [addMessage, startPolling]);

  // ── Confirm model → add to cart ───────────────────────────────────────────

  const confirmModel = useCallback(() => {
    if (!pendingModel) return;
    const product: Product = {
      id:          crypto.randomUUID(),
      name:        pendingModel.suggestedName,
      description: 'AI-generated custom 3D model',
      imageUrl:    '',
      modelUrl:    pendingModel.modelUrl,
      price:       49.99,
      material:    'PLA',
      collection:  'Art & Sculptures',
      tags:        ['custom', 'ai-generated'],
      rating:      5,
      reviewCount: 0,
      stock:       1,
      isFeatured:  false,
      isActive:    true,
      createdAt:   new Date(),
    };
    addItem(product, 1, pendingModel.modelUrl);
    openCart();
    setChatStep('done');
    addMessage({ role: 'assistant', content: "Added to your cart! Head to checkout whenever you're ready." });
  }, [pendingModel, addItem, openCart, addMessage]);

  // ── Reject → back to idle ─────────────────────────────────────────────────

  const rejectModel = useCallback(() => {
    setChatStep('idle');
    setPendingModel(null);
    addMessage({ role: 'assistant', content: "No problem! Upload a different image and I'll generate a new version." });
  }, [addMessage]);

  // ── Full reset ────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    stopPolling();
    completedRef.current = false;
    setMessages([]);
    setChatStep('idle');
    setPendingModel(null);
    setJobId(null);
    setJobStatus(null);
    setError(null);
    setStage(null);
    setProgress(0);
  }, [stopPolling]);

  return {
    messages,
    chatStep,
    loading,
    jobId,
    jobStatus,
    error,
    pendingModel,
    stage,
    progress,
    generateFromImage,
    confirmModel,
    rejectModel,
    reset,
  };
}
