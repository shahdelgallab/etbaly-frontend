export type MaterialType = 'PLA' | 'ABS' | 'PETG' | 'TPU' | 'Resin';

/** Shape returned by GET /api/v1/materials (public, active only) */
export interface Material {
  type:         MaterialType;
  name:         string;
  pricePerGram: number;
  color?:       string;
}

/** Shape returned by GET /api/v1/admin/materials (all, including inactive) */
export interface AdminMaterial {
  id:           string;
  type:         MaterialType;
  name:         string;
  pricePerGram: number;
  color?:       string;
  isActive:     boolean;
  createdAt:    string;
  updatedAt:    string;
}

export interface CreateMaterialPayload {
  name:                string;
  type:                MaterialType;
  currentPricePerGram: number;
  color?:              string;
  isActive?:           boolean;
}

export interface UpdateMaterialPayload {
  name?:               string;
  currentPricePerGram?: number;
  color?:              string;
  isActive?:           boolean;
}
