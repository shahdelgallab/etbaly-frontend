import api from './api';
import type { ApiSuccess, ApiDesign, ApiMaterialType } from '../types/api';

interface DesignListData    { designs: ApiDesign[] }
interface DesignData        { design: ApiDesign }
interface UploadFileData    { fileId: string; fileUrl: string }

export interface CreateDesignPayload {
  name:          string;
  fileUrl:       string;
  isPrintable?:  boolean;
  thumbnailUrl?: string;
  metadata: {
    volumeCm3?:          number;
    dimensions?:         { x?: number; y?: number; z?: number };
    estimatedPrintTime?: number;
    supportedMaterials:  ApiMaterialType[];
  };
}

// ─── Slicing history types ────────────────────────────────────────────────────

export interface SlicingHistoryDesign {
  id:                 string;
  name:               string;
  fileUrl:            string;
  thumbnailUrl:       string | null;
  isPrintable:        boolean;
  supportedMaterials: ApiMaterialType[];
  createdAt:          string;
}

export interface SlicingHistoryEntry {
  jobId:           string;
  design:          SlicingHistoryDesign;
  material:        string;
  color:           string;
  preset:          string;
  scale:           number;
  gcodeUrl:        string;
  weight:          number;
  dimensions:      { width: number; height: number; depth: number };
  printTime:       number;
  calculatedPrice: number;
  copiedFromJobId: string | null;
  createdAt:       string;
  finishedAt:      string;
}

interface SlicingHistoryData { results: number; history: SlicingHistoryEntry[] }

export const designService = {
  // ── Client (authenticated) ─────────────────────────────────────────────────

  /**
   * POST /api/v1/designs/upload  (multipart — step 1: upload file, get fileUrl)
   * Returns { fileId, fileUrl }
   * Uses no timeout — large files can take a long time to upload.
   */
  uploadFile: (file: File, name: string): Promise<UploadFileData> => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    // Do NOT set Content-Type manually — browser must set it with the correct multipart boundary
    return api.post<ApiSuccess<UploadFileData>>(
      '/designs/upload', form,
      { timeout: 0 }
    ).then(r => r.data.data);
  },

  /**
   * POST /api/v1/designs  (step 2: create design record with fileUrl)
   */
  create: (payload: CreateDesignPayload): Promise<ApiDesign> =>
    api.post<ApiSuccess<DesignData>>('/designs', payload)
      .then(r => r.data.data.design),

  /**
   * GET /api/v1/designs  — admins get all, clients get own
   */
  getMyDesigns: () =>
    api.get<ApiSuccess<DesignListData>>('/designs')
      .then(r => r.data.data.designs),

  /**
   * GET /api/v1/designs/:id
   */
  getById: (id: string) =>
    api.get<ApiSuccess<DesignData>>(`/designs/${id}`)
      .then(r => r.data.data.design),

  /**
   * GET /api/v1/designs/slicing-history
   * Returns the user's completed slicing jobs with populated design data.
   */
  getSlicingHistory: (): Promise<SlicingHistoryEntry[]> =>
    api.get<ApiSuccess<SlicingHistoryData>>('/designs/slicing-history')
      .then(r => r.data.data.history),

  /**
   * DELETE /api/v1/designs/slicing-history/:jobId
   * Deletes a slicing job from the user's history.
   */
  deleteSlicingHistoryItem: (jobId: string): Promise<void> =>
    api.delete<ApiSuccess<null>>(`/designs/slicing-history/${jobId}`)
      .then(() => undefined),

  // ── Admin ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/designs/upload  (multipart — admin step 1)
   * Uses the standard designs upload endpoint (works for all authenticated users).
   * Returns fileUrl string.
   */
  adminUploadFile: (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', file.name);
    // Do NOT set Content-Type manually — browser must set it with the correct multipart boundary
    return api.post<ApiSuccess<UploadFileData>>(
      '/designs/upload', form,
      { timeout: 0 }
    ).then(r => r.data.data.fileUrl);
  },

  /**
   * POST /api/v1/designs  (admin step 2: create record — same endpoint for all roles)
   */
  adminCreate: (payload: CreateDesignPayload): Promise<ApiDesign> =>
    api.post<ApiSuccess<DesignData>>('/designs', payload)
      .then(r => r.data.data.design),

  /**
   * PATCH /api/v1/admin/designs/:id
   */
  adminUpdate: (id: string, data: Partial<CreateDesignPayload>): Promise<ApiDesign> =>
    api.patch<ApiSuccess<DesignData>>(`/admin/designs/${id}`, data)
      .then(r => r.data.data.design),

  /**
   * DELETE /api/v1/admin/designs/:id
   */
  adminDelete: (id: string) =>
    api.delete<ApiSuccess<null>>(`/admin/designs/${id}`)
      .then(r => r.data),
};
