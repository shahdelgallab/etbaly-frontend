import api from './api';
import type { ApiSuccess } from '../types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrintingJobStatus =
  | 'Pending Review'
  | 'Approved'
  | 'Rejected'
  | 'Queued'
  | 'Processing'
  | 'Completed'
  | 'Failed';

export interface PrintingJob {
  jobId:        string;
  jobNumber:    string;
  status:       PrintingJobStatus;
  slicingJobId?: string;
  gcodeUrl?:    string;
  machineId?:   string;
  fileName?:    string;
  startedAt?:   string;
  finishedAt?:  string;
  createdAt:    string;
  updatedAt:    string;
}

interface PrintingJobData  { jobId: string; jobNumber: string; status: PrintingJobStatus; slicingJobId?: string; fileName?: string; gcodeUrl?: string }
interface PrintingJobFull  { jobId: string; jobNumber: string; status: PrintingJobStatus; gcodeUrl?: string; machineId?: string; fileName?: string; startedAt?: string; finishedAt?: string; createdAt: string; updatedAt: string }
interface QueuedJobsData   { jobs: PrintingJobFull[] }

export const printingService = {
  // ── User ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/printing/execute
   * Creates a PrintingJob from a completed slicing job.
   */
  execute: (slicingJobId: string): Promise<PrintingJobData> =>
    api.post<ApiSuccess<PrintingJobData>>('/printing/execute', { slicingJobId })
      .then(r => r.data.data),

  /**
   * GET /api/v1/printing/status/:jobId
   * Retrieves the current status of a printing job.
   */
  getStatus: (jobId: string): Promise<PrintingJobFull> =>
    api.get<ApiSuccess<PrintingJobFull>>(`/printing/status/${jobId}`)
      .then(r => r.data.data),

  // ── Admin / Operator ──────────────────────────────────────────────────────

  /**
   * POST /api/v1/printing/review
   * Approves or rejects a PrintingJob in "Pending Review" status.
   */
  review: (jobId: string, action: 'approve' | 'reject'): Promise<{ jobId: string; jobNumber: string; status: PrintingJobStatus }> =>
    api.post<ApiSuccess<{ jobId: string; jobNumber: string; status: PrintingJobStatus }>>('/printing/review', { jobId, action })
      .then(r => r.data.data),

  /**
   * GET /api/v1/printing/queued
   * Returns all PrintingJobs with status "Queued".
   */
  getQueued: (): Promise<PrintingJobFull[]> =>
    api.get<ApiSuccess<QueuedJobsData>>('/printing/queued')
      .then(r => r.data.data.jobs),

  /**
   * POST /api/v1/printing/start
   * Starts a PrintingJob (Queued → Processing).
   */
  start: (jobId: string, machineId?: string): Promise<{ jobId: string; jobNumber: string; status: PrintingJobStatus; machineId?: string; startedAt?: string; gcodeUrl?: string }> =>
    api.post<ApiSuccess<{ jobId: string; jobNumber: string; status: PrintingJobStatus; machineId?: string; startedAt?: string; gcodeUrl?: string }>>('/printing/start', { jobId, ...(machineId ? { machineId } : {}) })
      .then(r => r.data.data),

  /**
   * POST /api/v1/printing/complete
   * Completes a PrintingJob (Processing → Completed).
   */
  complete: (jobId: string): Promise<{ jobId: string; jobNumber: string; status: PrintingJobStatus; finishedAt?: string }> =>
    api.post<ApiSuccess<{ jobId: string; jobNumber: string; status: PrintingJobStatus; finishedAt?: string }>>('/printing/complete', { jobId })
      .then(r => r.data.data),

  /**
   * POST /api/v1/printing/fail
   * Fails a PrintingJob (Processing → Failed).
   */
  fail: (jobId: string, reason?: string): Promise<{ jobId: string; jobNumber: string; status: PrintingJobStatus; finishedAt?: string }> =>
    api.post<ApiSuccess<{ jobId: string; jobNumber: string; status: PrintingJobStatus; finishedAt?: string }>>('/printing/fail', { jobId, ...(reason ? { reason } : {}) })
      .then(r => r.data.data),
};
