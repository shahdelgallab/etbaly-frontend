export type SlicingJobStatus = 'Queued' | 'Processing' | 'Completed' | 'Failed';

export type SlicingPreset = 'heavy' | 'normal' | 'draft';

export interface SlicingJobDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface SlicingJob {
  jobId: string;
  designId: string;
  designName?: string;
  status: SlicingJobStatus;
  stlFileUrl?: string;
  gcodeUrl?: string;
  fileName?: string;
  weight?: number;
  dimensions?: SlicingJobDimensions;
  printTime?: number;
  calculatedPrice?: number;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSlicingJobRequest {
  designId: string;
  material?: string;
  color?: string;
  preset?: SlicingPreset;
  scale?: number;
}

export interface CreateSlicingJobResponse {
  jobId: string;
  status: SlicingJobStatus;
  designId: string;
  designName: string;
}
