import api from './api';
import type { ApiSuccess } from '../types/api';
import type {
  Material,
  AdminMaterial,
  CreateMaterialPayload,
  UpdateMaterialPayload,
} from '../models/Material';

// ─── Response wrappers ────────────────────────────────────────────────────────

interface PublicMaterialsData  { materials: Material[] }
interface AdminMaterialsData   { results: number; materials: AdminMaterial[] }
interface AdminMaterialData    { material: AdminMaterial }

export const materialService = {
  // ── Public ──────────────────────────────────────────────────────────────

  /** GET /api/v1/materials — active materials only */
  getActive: (): Promise<Material[]> =>
    api.get<ApiSuccess<PublicMaterialsData>>('/materials')
      .then(r => r.data.data.materials),

  // ── Admin ────────────────────────────────────────────────────────────────

  /** GET /api/v1/admin/materials — all materials including inactive */
  adminGetAll: (): Promise<AdminMaterial[]> =>
    api.get<ApiSuccess<AdminMaterialsData>>('/admin/materials')
      .then(r => r.data.data.materials),

  /** POST /api/v1/admin/materials */
  adminCreate: (payload: CreateMaterialPayload): Promise<AdminMaterial> =>
    api.post<ApiSuccess<AdminMaterialData>>('/admin/materials', payload)
      .then(r => r.data.data.material),

  /** PATCH /api/v1/admin/materials/:id */
  adminUpdate: (id: string, payload: UpdateMaterialPayload): Promise<AdminMaterial> =>
    api.patch<ApiSuccess<AdminMaterialData>>(`/admin/materials/${id}`, payload)
      .then(r => r.data.data.material),

  /** DELETE /api/v1/admin/materials/:id */
  adminDelete: (id: string): Promise<void> =>
    api.delete<ApiSuccess<null>>(`/admin/materials/${id}`).then(() => undefined),
};
