import { useState, useCallback, useRef } from 'react';
import type { BufferGeometry } from 'three';
import { aiService } from '../services/aiService';
import { slicingService } from '../services/slicingService';
import { cartService } from '../services/cartService';
import { useAppDispatch } from '../store/hooks';
import { fetchCartThunk, openCart as reduxOpenCart, patchItemDisplay } from '../store/slices/cartSlice';
import { fetchAndParseSTL } from '../utils/stlLoader';
import { getDirectImageUrl } from '../utils/imageUtils';
import type { ChatMessage } from '../models/ChatMessage';
import type { SlicingPreset } from '../models/SlicingJob';

// ─── Public types ─────────────────────────────────────────────────────────────

/** Which AI mode the user has selected */
export type ChatMode = 'text-to-3d' | 'image-to-3d';

/**
 * Overall chat step:
 *  idle          → waiting for user input
 *  generating    → job is running (text→image or image→3d)
 *  image-preview → text-to-3d only: generated image shown, waiting for approval
 *  confirm       → 3D model ready, waiting for cart confirmation
 *  quotation     → showing slicing options (material, scale, preset)
 *  slicing       → slicing job in progress
 *  quote-ready   → slicing complete, showing design details
 *  done          → model added to cart
 */
export type ChatStep =
  | 'idle'
  | 'generating'
  | 'image-preview'
  | 'confirm'
  | 'quotation'
  | 'slicing'
  | 'quote-ready'
  | 'done';

/** Sub-stage labels shown in the progress bar */
export type GenerationStage = 'upload' | 'generate' | 'download' | 'render' | null;

export interface PendingModel {
  modelUrl:      string;
  geometry:      BufferGeometry;
  designId?:     string;
  suggestedName: string;
}

export interface SlicingOptions {
  material: string;
  preset: SlicingPreset;
  scale: number;
  color: string; // Color name: 'Red' | 'Green' | 'Blue'
}

export interface QuotationData {
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  printTime: number;
  calculatedPrice: number;
  gcodeUrl: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS  = 1500;
const POLL_MAX_ATTEMPTS = 240;   // 6 minutes max

const QUEUE_IMAGE_TO_3D  = 'AI_GENERATION';
const QUEUE_TEXT_TO_IMAGE = 'TEXT_TO_IMAGE';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatViewModel() {
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [chatStep,     setChatStep]     = useState<ChatStep>('idle');
  const [chatMode,     setChatMode]     = useState<ChatMode | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [pendingModel, setPendingModel] = useState<PendingModel | null>(null);

  // Text-to-3D intermediate: the generated image URL before 3D conversion
  const [pendingImageUrl,  setPendingImageUrl]  = useState<string | null>(null);
  const [pendingImageJobId, setPendingImageJobId] = useState<string | null>(null);
  const [pendingDesignName, setPendingDesignName] = useState<string>('');

  // Slicing state
  const [slicingOptions, setSlicingOptions] = useState<SlicingOptions>({
    material: 'PLA',
    preset: 'normal',
    scale: 100,
    color: 'Red',
  });
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null);
  const [slicingJobId, setSlicingJobId] = useState<string | null>(null);

  // Progress
  const [stage,    setStage]    = useState<GenerationStage>(null);
  const [progress, setProgress] = useState(0);

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef  = useRef(0);
  const completedRef = useRef(false);

  const dispatch = useAppDispatch();

  const { openCart } = { openCart: () => dispatch(reduxOpenCart()) };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      { ...msg, id: crypto.randomUUID(), timestamp: new Date() },
    ]);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    attemptsRef.current  = 0;
    completedRef.current = true;
  }, []);

  const downloadAndParse = useCallback(async (publicUrl: string): Promise<BufferGeometry> => {
    setStage('download');
    setProgress(75);
    const geometry = await fetchAndParseSTL(publicUrl);
    setStage('render');
    setProgress(90);
    return geometry;
  }, []);

  // ── Poll a job until completion ───────────────────────────────────────────

  const startPolling = useCallback((
    queueName: string,
    jobId: string,
    designName: string,
    onComplete: (result: NonNullable<ReturnType<typeof aiService.getJobStatus> extends Promise<infer T> ? T : never>['result']) => void,
    onFail: (errMsg: string) => void,
  ) => {
    attemptsRef.current  = 0;
    completedRef.current = false;

    pollRef.current = setInterval(async () => {
      if (completedRef.current) return;
      attemptsRef.current += 1;

      try {
        const status = await aiService.getJobStatus(queueName, jobId);
        if (completedRef.current) return;

        // Update progress bar (25–75% range during generation)
        const overallProgress = 25 + (status.progress * 0.5);
        setProgress(Math.min(overallProgress, 74));

        if (status.completed && status.result) {
          stopPolling();
          onComplete(status.result);
          return;
        }

        if (status.failed) {
          stopPolling();
          onFail(status.error ?? 'Generation failed.');
          return;
        }

        if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
          stopPolling();
          onFail('Generation timed out. Please try again.');
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  // ── IMAGE-TO-3D: submit image, poll, show 3D ──────────────────────────────

  const generateFromImage = useCallback(async (imageFile: File, designName: string) => {
    setError(null);
    setLoading(true);
    setProgress(0);
    setStage('upload');

    const previewUrl = URL.createObjectURL(imageFile);
    addMessage({ role: 'user', content: designName, imageUrl: previewUrl });

    try {
      const jobId = await aiService.imageTo3D(imageFile, designName);
      setProgress(25);
      setStage('generate');
      setChatStep('generating');
      addMessage({
        role:    'assistant',
        content: `Job queued (ID: ${jobId}). AI is generating your 3D model…`,
      });

      startPolling(
        QUEUE_IMAGE_TO_3D,
        jobId,
        designName,
        async (result) => {
          if (!result?.publicUrl) {
            setError('No model URL returned.');
            setStage(null);
            setChatStep('idle');
            addMessage({ role: 'assistant', content: 'Generation completed but no model was returned. Please try again.' });
            return;
          }
          try {
            const geometry = await downloadAndParse(result.publicUrl);
            setPendingModel({
              modelUrl:      result.publicUrl,
              geometry,
              designId:      result.designId,
              suggestedName: designName,
            });
            setStage(null);
            setProgress(100);
            setChatStep('confirm');
            addMessage({
              role:     'assistant',
              content:  'Your 3D model is ready! Review the preview below.',
              modelUrl: result.publicUrl,
            });
          } catch (dlErr: unknown) {
            const msg = dlErr instanceof Error ? dlErr.message : 'Download failed';
            setError(msg);
            setStage(null);
            setChatStep('idle');
            addMessage({ role: 'assistant', content: `Download failed: ${msg}` });
          }
        },
        (errMsg) => {
          setError(errMsg);
          setStage(null);
          setChatStep('idle');
          addMessage({ role: 'assistant', content: `Generation failed: ${errMsg}` });
        },
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to queue generation. Please try again.';
      setError(msg);
      setStage(null);
      addMessage({ role: 'assistant', content: `Sorry — ${msg}` });
    } finally {
      setLoading(false);
    }
  }, [addMessage, startPolling, downloadAndParse]);

  // ── TEXT-TO-3D step 1: submit prompt, poll, show generated image ──────────

  const generateImageFromText = useCallback(async (prompt: string, designName: string) => {
    setError(null);
    setLoading(true);
    setProgress(0);
    setStage('generate');
    setPendingDesignName(designName);

    addMessage({ role: 'user', content: `"${prompt}" — ${designName}` });

    try {
      const jobId = await aiService.textToImage(prompt, designName);
      setPendingImageJobId(jobId);
      setProgress(25);
      setChatStep('generating');
      addMessage({
        role:    'assistant',
        content: `Generating image from your description (Job: ${jobId})…`,
      });

      startPolling(
        QUEUE_TEXT_TO_IMAGE,
        jobId,
        designName,
        async (result) => {
          if (!result?.imagePublicUrl) {
            setError('No image URL returned.');
            setStage(null);
            setChatStep('idle');
            addMessage({ role: 'assistant', content: 'Image generation completed but no image was returned. Please try again.' });
            return;
          }
          console.log('✅ Image generated successfully:', result.imagePublicUrl);
          
          // Convert Google Drive URLs to use backend proxy
          const apiBaseUrl = import.meta.env.VITE_API_URL || '';
          const finalImageUrl = getDirectImageUrl(result.imagePublicUrl, apiBaseUrl);
          console.log('✅ Using proxied URL:', finalImageUrl);
          
          // Show the generated image for approval
          setPendingImageUrl(finalImageUrl);
          setStage(null);
          setProgress(100);
          setChatStep('image-preview');
          // Add message with the generated image
          addMessage({
            role:     'assistant',
            content:  'Here is the generated image! Does this look right?',
            imageUrl: finalImageUrl,
          });
        },
        (errMsg) => {
          setError(errMsg);
          setStage(null);
          setChatStep('idle');
          addMessage({ role: 'assistant', content: `Image generation failed: ${errMsg}` });
        },
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to queue image generation. Please try again.';
      setError(msg);
      setStage(null);
      addMessage({ role: 'assistant', content: `Sorry — ${msg}` });
    } finally {
      setLoading(false);
    }
  }, [addMessage, startPolling]);

  // ── TEXT-TO-3D step 2: user approved image → convert to 3D ───────────────

  const approveImageAndConvertTo3D = useCallback(async () => {
    if (!pendingImageUrl) return;
    setError(null);
    setLoading(true);
    setProgress(0);
    setStage('upload');
    setChatStep('generating');

    addMessage({ role: 'user', content: 'Looks good! Convert this to a 3D model.' });

    try {
      // Fetch the image as a Blob so we can POST it as multipart
      console.log('📤 Fetching generated image from:', pendingImageUrl);
      const resp = await fetch(pendingImageUrl);
      if (!resp.ok) {
        throw new Error(`Failed to fetch image: ${resp.status} ${resp.statusText}`);
      }
      
      const blob = await resp.blob();
      const ext  = blob.type.includes('png') ? 'png' : 'jpg';
      const file = new File([blob], `generated.${ext}`, { type: blob.type });
      
      console.log('📤 Submitting image for 3D conversion...');
      const jobId = await aiService.imageTo3D(file, pendingDesignName);
      setProgress(25);
      setStage('generate');
      addMessage({
        role:    'assistant',
        content: `Converting image to 3D model (Job: ${jobId})…`,
      });

      startPolling(
        QUEUE_IMAGE_TO_3D,
        jobId,
        pendingDesignName,
        async (result) => {
          if (!result?.publicUrl) {
            setError('No model URL returned.');
            setStage(null);
            setChatStep('idle');
            addMessage({ role: 'assistant', content: 'Conversion completed but no model was returned. Please try again.' });
            return;
          }
          try {
            const geometry = await downloadAndParse(result.publicUrl);
            setPendingModel({
              modelUrl:      result.publicUrl,
              geometry,
              designId:      result.designId,
              suggestedName: pendingDesignName,
            });
            setStage(null);
            setProgress(100);
            setChatStep('confirm');
            addMessage({
              role:     'assistant',
              content:  'Your 3D model is ready! Review the preview below.',
              modelUrl: result.publicUrl,
            });
          } catch (dlErr: unknown) {
            const msg = dlErr instanceof Error ? dlErr.message : 'Download failed';
            setError(msg);
            setStage(null);
            setChatStep('idle');
            addMessage({ role: 'assistant', content: `Download failed: ${msg}` });
          }
        },
        (errMsg) => {
          setError(errMsg);
          setStage(null);
          setChatStep('idle');
          addMessage({ role: 'assistant', content: `3D conversion failed: ${errMsg}` });
        },
      );
    } catch (err: unknown) {
      console.error('❌ Error in approveImageAndConvertTo3D:', err);
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to start 3D conversion.';
      setError(msg);
      setStage(null);
      setChatStep('image-preview'); // go back to image preview
      addMessage({ role: 'assistant', content: `Sorry — ${msg}` });
    } finally {
      setLoading(false);
    }
  }, [pendingImageUrl, pendingDesignName, addMessage, startPolling, downloadAndParse]);

  // ── Reject generated image → back to text input ───────────────────────────

  const rejectGeneratedImage = useCallback(() => {
    setPendingImageUrl(null);
    setPendingImageJobId(null);
    setChatStep('idle');
    addMessage({ role: 'assistant', content: "No problem! Describe your idea differently and I'll generate a new image." });
  }, [addMessage]);

  // ── Request quotation → show slicing options ──────────────────────────────

  const requestQuotation = useCallback(() => {
    setChatStep('quotation');
    addMessage({ role: 'assistant', content: "Let's get a quote for printing this model. Please select your preferences:" });
  }, [addMessage]);

  // ── Update slicing options ────────────────────────────────────────────────

  const updateSlicingOptions = useCallback((options: Partial<SlicingOptions>) => {
    setSlicingOptions(prev => ({ ...prev, ...options }));
  }, []);

  // ── Go back to options from quote ─────────────────────────────────────────

  const backToOptions = useCallback(() => {
    setChatStep('quotation');
    setQuotationData(null);
    addMessage({ role: 'assistant', content: "No problem! Adjust your preferences and get a new quote:" });
  }, [addMessage]);

  // ── Execute slicing → get quotation ───────────────────────────────────────

  const executeSlicing = useCallback(async () => {
    if (!pendingModel?.designId) return;

    setChatStep('slicing');
    setLoading(true);
    setError(null);
    setProgress(0);
    addMessage({ role: 'assistant', content: 'Analyzing your model and calculating print details...' });

    try {
      // Execute slicing job
      const response = await slicingService.executeSlicing({
        designId: pendingModel.designId,
        material: slicingOptions.material,
        color: slicingOptions.color,
        preset: slicingOptions.preset,
        scale: slicingOptions.scale,
      });

      setSlicingJobId(response.jobId);
      setProgress(20);

      // Poll for completion
      const completedJob = await slicingService.pollJobStatus(
        response.jobId,
        (job) => {
          // Update progress based on status
          if (job.status === 'Processing') {
            setProgress(50);
          }
        },
        120, // 10 minutes max
        5000 // 5 second intervals
      );

      // Set quotation data
      if (completedJob.weight && completedJob.dimensions && completedJob.printTime && completedJob.calculatedPrice && completedJob.gcodeUrl) {
        setQuotationData({
          weight: completedJob.weight,
          dimensions: completedJob.dimensions,
          printTime: completedJob.printTime,
          calculatedPrice: completedJob.calculatedPrice,
          gcodeUrl: completedJob.gcodeUrl,
        });
        setProgress(100);
        setChatStep('quote-ready');
        addMessage({
          role: 'assistant',
          content: `Perfect! Here are the details for your ${slicingOptions.material} print at ${slicingOptions.scale}% scale:`,
        });
      } else {
        throw new Error('Incomplete slicing data');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to get quotation';
      setError(msg);
      setChatStep('quotation');
      addMessage({ role: 'assistant', content: `Sorry, there was an error: ${msg}. Please try again.` });
    } finally {
      setLoading(false);
    }
  }, [pendingModel, slicingOptions, addMessage]);

  // ── Confirm 3D model → add to cart ───────────────────────────────────────

  const confirmModel = useCallback(async () => {
    if (!pendingModel || !quotationData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call backend cart API to add the design
      await cartService.addItem({
        itemType: 'Design',
        itemRefId: pendingModel.designId!,
        quantity: 1,
        printingProperties: {
          material: slicingOptions.material as 'PLA' | 'ABS' | 'PETG' | 'TPU' | 'Resin',
          color: slicingOptions.color,
          scale: slicingOptions.scale,
          preset: slicingOptions.preset,
          customFields: [
            { key: 'printTime', value: String(quotationData.printTime) },
            { key: 'weight', value: String(quotationData.weight) },
            { key: 'width', value: String(quotationData.dimensions.width) },
            { key: 'height', value: String(quotationData.dimensions.height) },
            { key: 'depth', value: String(quotationData.dimensions.depth) },
            { key: 'gcodeUrl', value: quotationData.gcodeUrl },
          ],
        },
      });
      
      // Sync Redux cart from backend then open the sidebar
      await dispatch(fetchCartThunk());

      // Patch the item's display name and image with what the user saw in the chat.
      // pendingImageUrl is already proxied through the backend (set by generateImageFromText).
      // For image-to-3d flows, use the user's original upload preview as fallback.
      const displayName  = pendingModel.suggestedName || 'Custom 3D Model';
      const displayImage = pendingImageUrl ?? '';
      if (pendingModel.designId) {
        dispatch(patchItemDisplay({
          itemRefId:    pendingModel.designId,
          name:         displayName,
          thumbnailUrl: displayImage,
        }));
      }

      openCart();
      setChatStep('done');
      addMessage({ 
        role: 'assistant', 
        content: "Added to your cart! Head to checkout whenever you're ready." 
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as Error)?.message ?? 'Failed to add item to cart.';
      setError(msg);
      addMessage({ 
        role: 'assistant', 
        content: `Sorry, there was an error adding to cart: ${msg}` 
      });
    } finally {
      setLoading(false);
    }
  }, [pendingModel, quotationData, slicingOptions, openCart, addMessage, dispatch, pendingImageUrl]);

  // ── Reject 3D model → back to idle ───────────────────────────────────────

  const rejectModel = useCallback(() => {
    setChatStep('idle');
    setPendingModel(null);
    addMessage({ role: 'assistant', content: "No problem! Try uploading a different image or describing it differently." });
  }, [addMessage]);

  // ── Full reset ────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    stopPolling();
    completedRef.current = false;
    setMessages([]);
    setChatStep('idle');
    setChatMode(null);
    setPendingModel(null);
    setPendingImageUrl(null);
    setPendingImageJobId(null);
    setPendingDesignName('');
    setSlicingOptions({ material: 'PLA', preset: 'normal', scale: 100, color: 'Red' });
    setQuotationData(null);
    setSlicingJobId(null);
    setError(null);
    setStage(null);
    setProgress(0);
    setLoading(false);
  }, [stopPolling]);

  return {
    // State
    messages,
    chatStep,
    chatMode,
    loading,
    error,
    pendingModel,
    pendingImageUrl,
    pendingImageJobId,
    stage,
    progress,
    slicingOptions,
    quotationData,
    slicingJobId,

    // Actions
    setChatMode,
    generateFromImage,
    generateImageFromText,
    approveImageAndConvertTo3D,
    rejectGeneratedImage,
    requestQuotation,
    updateSlicingOptions,
    executeSlicing,
    backToOptions,
    confirmModel,
    rejectModel,
    reset,
  };
}
