import api from './api';
import type { ApiSuccess } from '../types/api';

export type ManufacturingAction = 'start_slicing' | 'start_printing';

export interface ExecuteJobPayload {
  jobId:  string;
  action: ManufacturingAction;
}

export const manufacturingService = {
  // POST /api/v1/admin/manufacturing/execute
  execute: (payload: ExecuteJobPayload) =>
    api.post<ApiSuccess<null>>('/admin/manufacturing/execute', payload)
      .then(r => r.data),
};
