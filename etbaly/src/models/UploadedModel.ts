import type { MaterialType, PrintQuality } from './Product';

// ─── Supported 3D File Formats ────────────────────────────────────────────────

export type ModelFileFormat = 'stl' | 'obj' | 'glb' | 'gltf';

// ─── Upload Status ────────────────────────────────────────────────────────────

export type UploadStatus = 'pending' | 'processing' | 'ready' | 'error';

// ─── Uploaded Model ───────────────────────────────────────────────────────────

export interface UploadedModel {
  id: string;
  userId: string;
  name: string;
  /** Blob / object-store URL of the raw file */
  fileUrl: string;
  /** URL to the processed .glb for in-browser preview */
  previewUrl?: string;
  format: ModelFileFormat;
  /** File size in bytes */
  fileSizeBytes: number;
  material: MaterialType;
  color: string;
  quantity: number;
  price: number;
  printQuality: PrintQuality;
  status: UploadStatus;
  errorMessage?: string;
  createdAt: Date;
}

// ─── Upload Form State ────────────────────────────────────────────────────────

export interface UploadFormValues {
  name: string;
  material: MaterialType;
  color: string;
  quantity: number;
  price: number;
  printQuality: PrintQuality;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export const ACCEPTED_FORMATS: ModelFileFormat[] = ['stl', 'obj', 'glb', 'gltf'];
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function getFileFormat(filename: string): ModelFileFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ACCEPTED_FORMATS.includes(ext as ModelFileFormat)
    ? (ext as ModelFileFormat)
    : null;
}
