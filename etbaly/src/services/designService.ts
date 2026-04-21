import api from './api';
import type { ApiSuccess, ApiDesign, ApiMaterialType } from '../types/api';

interface DesignListData { designs: ApiDesign[] }
interface DesignData     { design: ApiDesign }
interface UploadFileData { fileUrl: string }

export interface CreateDesignPayload {
  name:        string;
  fileUrl:     string;
  isPrintable?: boolean;
  metadata: {
    volumeCm3?:          number;
    dimensions?:         { x?: number; y?: number; z?: number };
    estimatedPrintTime?: number;
    supportedMaterials:  ApiMaterialType[];
  };
}

export const designService = {
  // ── Client (authenticated) ─────────────────────────────────────────────────

  // GET /api/v1/designs  — admins get all, clients get own
  getMyDesigns: () =>
    api.get<ApiSuccess<DesignListData>>('/designs')
      .then(r => r.data.data.designs),

  // GET /api/v1/designs/:id
  getById: (id: string) =>
    api.get<ApiSuccess<DesignData>>(`/designs/${id}`)
      .then(r => r.data.data.design),

  // ── Admin ──────────────────────────────────────────────────────────────────

  // POST /api/v1/admin/designs/upload  (multipart — step 1: get fileUrl)
  adminUploadFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ApiSuccess<UploadFileData>>(
      '/admin/designs/upload', form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data.data.fileUrl);
  },

  // POST /api/v1/admin/designs  (step 2: create record with returned fileUrl)
  adminCreate: (payload: CreateDesignPayload) =>
    api.post<ApiSuccess<DesignData>>('/admin/designs', payload)
      .then(r => r.data.data.design),

  // PATCH /api/v1/admin/designs/:id
  adminUpdate: (id: string, data: Partial<CreateDesignPayload>) =>
    api.patch<ApiSuccess<DesignData>>(`/admin/designs/${id}`, data)
      .then(r => r.data.data.design),

  // DELETE /api/v1/admin/designs/:id
  adminDelete: (id: string) =>
    api.delete<ApiSuccess<null>>(`/admin/designs/${id}`)
      .then(r => r.data),
};
