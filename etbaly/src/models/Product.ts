// ─── Enums / Union Types ─────────────────────────────────────────────────────

export type MaterialType = 'PLA' | 'ABS' | 'PETG' | 'Resin' | 'TPU' | 'Nylon';

export type CollectionType =
  | 'Home Decor'
  | 'Mechanical Parts'
  | 'Art & Sculptures'
  | 'Jewelry'
  | 'Architecture';

export type PrintQuality = 'draft' | 'standard' | 'high' | 'ultra';

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  /** Additional gallery images */
  gallery?: string[];
  /** URL to a .glb / .gltf 3D preview file */
  modelUrl?: string;
  price: number;
  material: MaterialType;
  collection: CollectionType;
  tags: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  /** Estimated print time in hours */
  printTimeHours?: number;
  /** Dimensions in mm */
  dimensions?: Dimensions;
  printQuality?: PrintQuality;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// ─── Dimensions ──────────────────────────────────────────────────────────────

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'mm' | 'cm' | 'in';
}

// ─── Product Filter / Sort ───────────────────────────────────────────────────

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating';

export interface ProductFilters {
  search: string;
  collections: CollectionType[];
  materials: MaterialType[];
  priceMin: number;
  priceMax: number;
  sort: SortOption;
  inStockOnly: boolean;
}
