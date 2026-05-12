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

// Full populated job returned by GET /status/:jobId
export interface PrintingJobPopulated {
  _id:          string;
  status:       PrintingJobStatus;
  gcodeUrl?:    string;
  fileName?:    string;
  machineId?:   string | null;
  orderItemId?: string;
  startedAt?:   string | null;
  finishedAt?:  string | null;
  createdAt:    string;
  updatedAt:    string;
  orderId?: {
    _id:    string;
    status: string;
    userId: string;
    shippingAddressSnapshot?: { street?: string; city?: string; country?: string; zip?: string };
    pricingSummary?: { subtotal: number; total: number };
  };
  slicingJobId?: {
    _id:             string;
    stlFileUrl?:     string;
    gcodeUrl?:       string;
    fileName?:       string;
    material?:       string;
    color?:          string;
    preset?:         string;
    scale?:          number;
    weight?:         number;
    dimensions?:     { width: number; height: number; depth: number };
    printTime?:      number;
    calculatedPrice?: number;
    status?:         string;
  };
  operatorId?: string | null;
}

interface PrintingJobData  { jobId: string; jobNumber: string; status: PrintingJobStatus; slicingJobId?: string; fileName?: string; gcodeUrl?: string }
interface PrintingJobFull  { _id?: string; jobId?: string; jobNumber?: string; status: PrintingJobStatus; gcodeUrl?: string; machineId?: string; fileName?: string; startedAt?: string; finishedAt?: string; createdAt: string; updatedAt: string }
interface JobsListData     { total: number; results: number; jobs: PrintingJobFull[] }
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
   * Retrieves a single PrintingJob with full population.
   */
  getStatus: (jobId: string): Promise<PrintingJobPopulated> =>
    api.get<ApiSuccess<{ job: PrintingJobPopulated }>>(`/printing/status/${jobId}`)
      .then(r => r.data.data.job),

  // ── Admin / Operator ──────────────────────────────────────────────────────

  /**
   * GET /api/v1/printing/jobs?status=...
   * Returns PrintingJobs filtered by status (default: Queued).
   */
  getJobs: (status?: PrintingJobStatus): Promise<PrintingJobFull[]> =>
    api.get<ApiSuccess<JobsListData>>('/printing/jobs', { params: status ? { status } : {} })
      .then(r => r.data.data.jobs),

  /**
   * POST /api/v1/printing/review
   * Approves or rejects a PrintingJob in "Pending Review" status.
   */
  review: (jobId: string, action: 'approve' | 'reject'): Promise<{ jobId: string; status: PrintingJobStatus }> =>
    api.post<ApiSuccess<{ jobId: string; status: PrintingJobStatus }>>('/printing/review', { jobId, action })
      .then(r => r.data.data),

  /**
   * POST /api/v1/printing/queue
   * Queues an approved PrintingJob (Approved → Queued).
   */
  queue: (jobId: string): Promise<{ jobId: string; status: PrintingJobStatus }> =>
    api.post<ApiSuccess<{ jobId: string; status: PrintingJobStatus }>>('/printing/queue', { jobId })
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
  start: (jobId: string, machineId?: string): Promise<{ jobId: string; status: PrintingJobStatus; machineId?: string; startedAt?: string; gcodeUrl?: string }> =>
    api.post<ApiSuccess<{ jobId: string; status: PrintingJobStatus; machineId?: string; startedAt?: string; gcodeUrl?: string }>>('/printing/start', { jobId, ...(machineId ? { machineId } : {}) })
      .then(r => r.data.data),

  /**
   * POST /api/v1/printing/complete
   * Completes a PrintingJob (Processing → Completed).
   */
  complete: (jobId: string): Promise<{ jobId: string; status: PrintingJobStatus; finishedAt?: string }> =>
    api.post<ApiSuccess<{ jobId: string; status: PrintingJobStatus; finishedAt?: string }>>('/printing/complete', { jobId })
      .then(r => r.data.data),

  /**
   * POST /api/v1/printing/fail
   * Fails a PrintingJob (Processing → Failed).
   */
  fail: (jobId: string, reason?: string): Promise<{ jobId: string; status: PrintingJobStatus; finishedAt?: string }> =>
    api.post<ApiSuccess<{ jobId: string; status: PrintingJobStatus; finishedAt?: string }>>('/printing/fail', { jobId, ...(reason ? { reason } : {}) })
      .then(r => r.data.data),
};
