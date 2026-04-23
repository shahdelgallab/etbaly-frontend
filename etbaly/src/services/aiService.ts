import api from './api';
import type { ApiSuccess } from '../types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueJobData {
  success: boolean;
  message: string;
  jobId:   string;
}

export interface JobResultImageTo3D {
  success:   boolean;
  designId?: string;
  fileId?:   string;
  publicUrl?: string;   // STL public URL
  isMock?:   boolean;
}

export interface JobResultTextToImage {
  success:          boolean;
  imageFileId?:     string;
  imagePublicUrl?:  string;  // generated image URL
}

export interface JobStatus {
  jobId:       string;
  queueName:   string;
  state:       'waiting' | 'active' | 'completed' | 'failed';
  progress:    number;
  designName:  string;
  createdAt:   number;
  completed:   boolean;
  waiting?:    boolean;
  processing?: boolean;
  failed?:     boolean;
  error?:      string;
  // result is either image-to-3d or text-to-image result
  result?:     JobResultImageTo3D & JobResultTextToImage;
}

interface LightningUrlData { url: string }

// ─── User endpoints ───────────────────────────────────────────────────────────

export const aiService = {

  /**
   * POST /api/v1/ai/image-to-3d
   * Submits an image file for 3D model generation.
   * Returns the jobId for polling (queue: AI_GENERATION).
   */
  imageTo3D: (image: File, designName: string): Promise<string> => {
    const form = new FormData();
    form.append('image', image);
    form.append('designName', designName.trim());
    return api
      .post<ApiSuccess<{ data: QueueJobData }>>('/ai/image-to-3d', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => {
        // Handle both response shapes
        const d = r.data as unknown as { data?: { data?: { jobId?: string }; jobId?: string }; success?: boolean };
        return (d?.data?.data?.jobId ?? d?.data?.jobId ?? '') as string;
      });
  },

  /**
   * POST /api/v1/ai/text-to-image
   * Submits a text prompt for image generation.
   * Returns the jobId for polling (queue: TEXT_TO_IMAGE).
   */
  textToImage: (prompt: string, designName: string): Promise<string> =>
    api
      .post<ApiSuccess<{ data: QueueJobData }>>('/ai/text-to-image', {
        prompt:     prompt.trim(),
        designName: designName.trim(),
      })
      .then(r => {
        const d = r.data as unknown as { data?: { data?: { jobId?: string }; jobId?: string } };
        return (d?.data?.data?.jobId ?? d?.data?.jobId ?? '') as string;
      }),

  /**
   * GET /api/v1/ai/job/:queueName/:jobId
   * Polls job status. queueName is 'AI_GENERATION' or 'TEXT_TO_IMAGE'.
   */
  getJobStatus: (queueName: string, jobId: string): Promise<JobStatus> =>
    api
      .get<ApiSuccess<JobStatus>>(`/ai/job/${queueName}/${jobId}`)
      .then(r => r.data.data),

  // ── Admin ──────────────────────────────────────────────────────────────────

  setLightningUrl: (url: string): Promise<string> =>
    api.post<ApiSuccess<LightningUrlData>>('/admin/ai/set-lightning-url', { url })
      .then(r => r.data.data.url),

  getLightningUrl: (): Promise<string> =>
    api.get<ApiSuccess<LightningUrlData>>('/admin/ai/lightning-url')
      .then(r => r.data.data.url),

  clearLightningUrlCache: (): Promise<void> =>
    api.delete('/admin/ai/lightning-url/cache').then(() => undefined),
};
