import api from './api';
import type { ApiSuccess } from '../types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueJobData {
  success: boolean;
  message: string;
  jobId:   string;
}

export interface JobResultImageTo3D {
  success:    boolean;
  designId?:  string;
  fileId?:    string;
  publicUrl?: string;
  isMock?:    boolean;
}

export interface JobResultTextToImage {
  success:          boolean;
  imageFileId?:     string;
  imagePublicUrl?:  string;
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
  result?:     JobResultImageTo3D & JobResultTextToImage;
}

interface LightningUrlData { url: string }

// ─── Service ──────────────────────────────────────────────────────────────────

export const aiService = {
  // ── User endpoints ──────────────────────────────────────────────────────────

  /**
   * POST /api/v1/ai/image-to-3d
   * Submits an image for 3D model generation.
   * Returns jobId for polling (queue: AI_GENERATION).
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
        const d = r.data as unknown as { data?: { data?: { jobId?: string }; jobId?: string } };
        return (d?.data?.data?.jobId ?? d?.data?.jobId ?? '') as string;
      });
  },

  /**
   * POST /api/v1/ai/text-to-image
   * Submits a text prompt for image generation.
   * Returns jobId for polling (queue: TEXT_TO_IMAGE).
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
   * Polls job status. queueName: 'AI_GENERATION' | 'TEXT_TO_IMAGE'
   */
  getJobStatus: (queueName: string, jobId: string): Promise<JobStatus> =>
    api
      .get<ApiSuccess<JobStatus>>(`/ai/job/${queueName}/${jobId}`)
      .then(r => r.data.data),

  // ── Admin endpoints ──────────────────────────────────────────────────────────

  /**
   * POST /api/v1/admin/ai/set-text-to-image-url
   */
  setTextToImageUrl: (url: string): Promise<string> =>
    api.post<ApiSuccess<LightningUrlData>>('/admin/ai/set-text-to-image-url', { url })
      .then(r => r.data.data.url),

  /**
   * GET /api/v1/admin/ai/text-to-image-url
   */
  getTextToImageUrl: (): Promise<string> =>
    api.get<ApiSuccess<LightningUrlData>>('/admin/ai/text-to-image-url')
      .then(r => r.data.data.url),

  /**
   * DELETE /api/v1/admin/ai/text-to-image-url/cache
   */
  clearTextToImageUrlCache: (): Promise<void> =>
    api.delete('/admin/ai/text-to-image-url/cache').then(() => undefined),

  /**
   * POST /api/v1/admin/ai/set-image-to-3d-url
   */
  setImageTo3dUrl: (url: string): Promise<string> =>
    api.post<ApiSuccess<LightningUrlData>>('/admin/ai/set-image-to-3d-url', { url })
      .then(r => r.data.data.url),

  /**
   * GET /api/v1/admin/ai/image-to-3d-url
   */
  getImageTo3dUrl: (): Promise<string> =>
    api.get<ApiSuccess<LightningUrlData>>('/admin/ai/image-to-3d-url')
      .then(r => r.data.data.url),

  /**
   * DELETE /api/v1/admin/ai/image-to-3d-url/cache
   */
  clearImageTo3dUrlCache: (): Promise<void> =>
    api.delete('/admin/ai/image-to-3d-url/cache').then(() => undefined),

  // ── Legacy aliases (kept for backward compatibility with AdminPage) ──────────

  /** @deprecated Use setImageTo3dUrl() instead */
  setLightningUrl: (url: string): Promise<string> =>
    api.post<ApiSuccess<LightningUrlData>>('/admin/ai/set-image-to-3d-url', { url })
      .then(r => r.data.data.url),

  /** @deprecated Use getImageTo3dUrl() instead */
  getLightningUrl: (): Promise<string> =>
    api.get<ApiSuccess<LightningUrlData>>('/admin/ai/image-to-3d-url')
      .then(r => r.data.data.url),

  /** @deprecated Use clearImageTo3dUrlCache() instead */
  clearLightningUrlCache: (): Promise<void> =>
    api.delete('/admin/ai/image-to-3d-url/cache').then(() => undefined),
};
