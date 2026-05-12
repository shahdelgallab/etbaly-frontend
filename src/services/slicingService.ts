import api from './api';
import type { ApiSuccess } from '../types/api';
import type {
  SlicingJob,
  CreateSlicingJobRequest,
  CreateSlicingJobResponse,
} from '../models/SlicingJob';

export const slicingService = {
  /**
   * POST /api/v1/slicing/execute
   * Creates a slicing job and dispatches it to the automated slicing queue
   */
  executeSlicing: async (data: CreateSlicingJobRequest): Promise<CreateSlicingJobResponse> => {
    const response = await api.post<ApiSuccess<CreateSlicingJobResponse>>(
      '/slicing/execute',
      data
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/slicing/status/:jobId
   * Retrieves the current status and details of a slicing job
   */
  getJobStatus: async (jobId: string): Promise<SlicingJob> => {
    const response = await api.get<ApiSuccess<SlicingJob>>(
      `/slicing/status/${jobId}`
    );
    return response.data.data;
  },

  /**
   * Poll job status until completion or failure
   * Returns the final job status
   */
  pollJobStatus: async (
    jobId: string,
    onProgress?: (job: SlicingJob) => void,
    maxAttempts: number = 120, // 10 minutes with 5-second intervals
    intervalMs: number = 5000
  ): Promise<SlicingJob> => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const job = await slicingService.getJobStatus(jobId);

          // Call progress callback
          onProgress?.(job);

          // Check if job is complete
          if (job.status === 'Completed') {
            resolve(job);
            return;
          }

          if (job.status === 'Failed') {
            reject(new Error('Slicing job failed'));
            return;
          }

          // Check max attempts
          if (attempts >= maxAttempts) {
            reject(new Error('Slicing job timed out'));
            return;
          }

          // Continue polling
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  },
};
