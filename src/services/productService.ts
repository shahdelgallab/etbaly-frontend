import api from './api';
import type { ApiSuccess, ApiProduct } from '../types/api';

// ─── Response shapes ──────────────────────────────────────────────────────────

interface PublicProductListData {
  total?:   number;   // total in DB (may be absent on some API versions)
  results:  number;   // count in this page
  products: ApiProduct[];
}

interface AdminProductListData {
  results:  number;   // admin endpoint only has results (count)
  products: ApiProduct[];
}

interface ProductData     { product: ApiProduct }
interface ImageUploadData { fileId: string; fileUrl: string }

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface ProductQuery {
  page?:    number;
  limit?:   number;
  sort?:    string;
  fields?:  string;
  name?:    string;
  isActive?: boolean;
  'currentBasePrice[gte]'?: number;
  'currentBasePrice[lte]'?: number;
  [key: string]: unknown;
}

export interface CreateProductPayload {
  name:            string;
  linkedDesignId:  string;
  slicingJobId:    string;   // completed SlicingJob — price & printingProperties auto-derived
  description?:    string;
  images?:         string[];
  isActive?:       boolean;
}

export interface UpdateProductPayload {
  name?:           string;
  description?:    string;
  images?:         string[];
  isActive?:       boolean;
}

export const productService = {
  // ── Public ─────────────────────────────────────────────────────────────────

  // GET /api/v1/products  →  { data: { total, results, products[] } }
  getAll: (params?: ProductQuery) =>
    api.get<ApiSuccess<PublicProductListData>>('/products', { params })
      .then(r => r.data.data),

  // GET /api/v1/products/:id  →  { data: { product } }
  getById: (id: string) =>
    api.get<ApiSuccess<ProductData>>(`/products/${id}`)
      .then(r => r.data.data.product),

  // ── Admin ──────────────────────────────────────────────────────────────────

  // GET /api/v1/admin/products  →  { data: { results, products[] } }
  adminGetAll: (params?: ProductQuery) =>
    api.get<ApiSuccess<AdminProductListData>>('/admin/products', { params })
      .then(r => r.data.data),

  // GET /api/v1/admin/products/:id
  adminGetById: (id: string) =>
    api.get<ApiSuccess<ProductData>>(`/admin/products/${id}`)
      .then(r => r.data.data.product),

  // POST /api/v1/admin/products/upload-image  (multipart — returns { fileId, fileUrl })
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    // Do NOT set Content-Type manually — browser must set it with the correct multipart boundary
    return api.post<ApiSuccess<ImageUploadData>>(
      '/admin/products/upload-image', form
    ).then(r => r.data.data.fileUrl);
  },

  // POST /api/v1/admin/products
  create: (data: CreateProductPayload) =>
    api.post<ApiSuccess<ProductData>>('/admin/products', data)
      .then(r => r.data.data.product),

  // PATCH /api/v1/admin/products/:id
  update: (id: string, data: UpdateProductPayload) =>
    api.patch<ApiSuccess<ProductData>>(`/admin/products/${id}`, data)
      .then(r => r.data.data.product),

  // DELETE /api/v1/admin/products/:id
  delete: (id: string) =>
    api.delete<ApiSuccess<null>>(`/admin/products/${id}`).then(r => r.data),
};
