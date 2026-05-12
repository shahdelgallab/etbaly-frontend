import api from './api';
import type { ApiSuccess } from '../types/api';

// ─── Response types ───────────────────────────────────────────────────────────

export interface AiChatResponse {
  message: string;
  modelUrl?: string;
  productId?: string;
}

interface GenerateJobData {
  success: boolean;
  message: string;
  jobId: string;
}

export interface GenerateDesignResult {
  jobId: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const chatService = {
  /**
   * Text-only chat — existing endpoint
   */
  sendMessage: (text: string, imageBase64?: string) =>
    api.post<AiChatResponse>('/chat', { text, image: imageBase64 }).then(r => r.data),

  /**
   * POST /api/v1/ai/generate-design
   * Submits an image + design name for async AI 3D model generation.
   * Returns a jobId immediately — processing is async.
   */
  generateDesignFromImage: (image: File, designName: string): Promise<GenerateDesignResult> => {
    const form = new FormData();
    form.append('image', image);
    form.append('designName', designName.trim());
    return api
      .post<ApiSuccess<GenerateJobData>>('/ai/generate-design', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => ({ jobId: r.data.data.jobId }));
  },
};
