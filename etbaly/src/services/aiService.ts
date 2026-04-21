import api from './api';
import type { ApiSuccess } from '../types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateJobData {
  success: boolean;
  message: string;
  jobId: string;
}

export interface JobResult {
  success: boolean;
  designId?: string;
  fileId?: string;
  publicUrl?: string;
  isMock?: boolean;
}

export interface JobStatus {
  jobId:       string;
  state:       'waiting' | 'active' | 'completed' | 'failed';
  progress:    number;
  designName:  string;
  createdAt:   number;
  completed:   boolean;
  waiting?:    boolean;
  processing?: boolean;
  failed?:     boolean;
  error?:      string;
  result?:     JobResult;
}

interface LightningUrlData { url: string }

// ─── User endpoints ───────────────────────────────────────────────────────────

export const aiService = {
  // POST /api/v1/ai/generate-design  (multipart)
  generateDesign: (image: File, designName: string): Promise<string> => {
    const form = new FormData();
    form.append('image', image);
    form.append('designName', designName.trim());
    return api
      .post<ApiSuccess<GenerateJobData>>('/ai/generate-design', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data.data.jobId);
  },

  // GET /api/v1/ai/job/:jobId
  getJobStatus: (jobId: string): Promise<JobStatus> =>
    api.get<ApiSuccess<JobStatus>>(`/ai/job/${jobId}`)
      .then(r => r.data.data),

  // ── Admin ──────────────────────────────────────────────────────────────────

  // POST /api/v1/admin/ai/set-lightning-url
  setLightningUrl: (url: string): Promise<string> =>
    api.post<ApiSuccess<LightningUrlData>>('/admin/ai/set-lightning-url', { url })
      .then(r => r.data.data.url),

  // GET /api/v1/admin/ai/lightning-url
  getLightningUrl: (): Promise<string> =>
    api.get<ApiSuccess<LightningUrlData>>('/admin/ai/lightning-url')
      .then(r => r.data.data.url),

  // DELETE /api/v1/admin/ai/lightning-url/cache
  clearLightningUrlCache: (): Promise<void> =>
    api.delete('/admin/ai/lightning-url/cache').then(() => undefined),
};
