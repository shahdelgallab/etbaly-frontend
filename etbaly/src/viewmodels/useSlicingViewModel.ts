import { useState, useCallback, useRef } from 'react';
import { slicingService } from '../services/slicingService';
import type {
  SlicingJob,
  CreateSlicingJobRequest,
  SlicingPreset,
} from '../models/SlicingJob';

export type SlicingPhase = 'idle' | 'submitting' | 'queued' | 'processing' | 'completed' | 'failed';

export function useSlicingViewModel() {
  const [phase, setPhase] = useState<SlicingPhase>('idle');
  const [job, setJob] = useState<SlicingJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const pollingRef = useRef<boolean>(false);

  /**
   * Execute slicing for a design
   */
  const executeSlicing = useCallback(async (
    designId: string,
    material: string = 'PLA',
    preset: SlicingPreset = 'normal',
    scale: number = 100
  ) => {
    setPhase('submitting');
    setError(null);
    setProgress(0);

    try {
      const request: CreateSlicingJobRequest = {
        designId,
        material,
        preset,
        scale,
      };

      const response = await slicingService.executeSlicing(request);
      
      setJob({
        jobId: response.jobId,
        jobNumber: response.jobNumber,
        designId: response.designId,
        designName: response.designName,
        status: response.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setPhase('queued');
      setProgress(10);

      // Start polling for status
      startPolling(response.jobId);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to start slicing job';
      setError(msg);
      setPhase('failed');
    }
  }, []);

  /**
   * Poll job status until completion
   */
  const startPolling = useCallback((jobId: string) => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    slicingService.pollJobStatus(
      jobId,
      (updatedJob) => {
        setJob(updatedJob);
        
        // Update phase and progress based on status
        if (updatedJob.status === 'Queued') {
          setPhase('queued');
          setProgress(20);
        } else if (updatedJob.status === 'Processing') {
          setPhase('processing');
          setProgress(50);
        } else if (updatedJob.status === 'Completed') {
          setPhase('completed');
          setProgress(100);
          pollingRef.current = false;
        } else if (updatedJob.status === 'Failed') {
          setPhase('failed');
          setError('Slicing job failed');
          pollingRef.current = false;
        }
      },
      120, // max attempts (10 minutes)
      5000 // 5 second intervals
    ).then((completedJob) => {
      setJob(completedJob);
      setPhase('completed');
      setProgress(100);
      pollingRef.current = false;
    }).catch((err) => {
      setError(err.message || 'Slicing failed');
      setPhase('failed');
      pollingRef.current = false;
    });
  }, []);

  /**
   * Get job status manually
   */
  const refreshStatus = useCallback(async (jobId: string) => {
    try {
      const updatedJob = await slicingService.getJobStatus(jobId);
      setJob(updatedJob);
      
      if (updatedJob.status === 'Completed') {
        setPhase('completed');
        setProgress(100);
      } else if (updatedJob.status === 'Failed') {
        setPhase('failed');
        setError('Slicing job failed');
      } else if (updatedJob.status === 'Processing') {
        setPhase('processing');
        setProgress(50);
      } else if (updatedJob.status === 'Queued') {
        setPhase('queued');
        setProgress(20);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to get job status';
      setError(msg);
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    pollingRef.current = false;
    setPhase('idle');
    setJob(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    phase,
    job,
    error,
    progress,
    executeSlicing,
    refreshStatus,
    reset,
  };
}
