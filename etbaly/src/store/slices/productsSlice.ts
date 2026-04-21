import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '../../services/productService';
import type { ApiProduct } from '../../types/api';
import type { ProductQuery, CreateProductPayload, UpdateProductPayload } from '../../services/productService';

interface ProductsState {
  items:    ApiProduct[];
  total:    number;
  loading:  boolean;
  error:    string | null;
  selected: ApiProduct | null;
}

const initialState: ProductsState = {
  items:    [],
  total:    0,
  loading:  false,
  error:    null,
  selected: null,
};

function extractMsg(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message ?? 'Operation failed.';
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchProductsThunk = createAsyncThunk(
  'products/fetchAll',
  async (params: ProductQuery | undefined, { rejectWithValue }) => {
    try {
      const data = await productService.getAll(params);
      return { products: data.products, total: data.total };
    } catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);
export const fetchProductByIdThunk = createAsyncThunk(
  'products/fetchById',
  async (id: string, { rejectWithValue }) => {
    try { return await productService.getById(id); }
    catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

// ── Admin thunks ──────────────────────────────────────────────────────────────

export const adminFetchProductsThunk = createAsyncThunk(
  'products/adminFetchAll',
  async (params: ProductQuery | undefined, { rejectWithValue }) => {
    try {
      const data = await productService.adminGetAll(params);
      return { products: data.products, total: data.results };
    } catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

export const adminCreateProductThunk = createAsyncThunk(
  'products/adminCreate',
  async (payload: CreateProductPayload, { rejectWithValue }) => {
    try { return await productService.create(payload); }
    catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

export const adminUpdateProductThunk = createAsyncThunk(
  'products/adminUpdate',
  async (payload: { id: string; data: UpdateProductPayload }, { rejectWithValue }) => {
    try { return await productService.update(payload.id, payload.data); }
    catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

export const adminDeleteProductThunk = createAsyncThunk(
  'products/adminDelete',
  async (id: string, { rejectWithValue }) => {
    try { await productService.delete(id); return id; }
    catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSelected: (state) => { state.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      // Public fetch all
      .addCase(fetchProductsThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(fetchProductsThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.items   = a.payload.products;
        s.total   = a.payload.total;
      })
      .addCase(fetchProductsThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      // Public fetch by id
      .addCase(fetchProductByIdThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(fetchProductByIdThunk.fulfilled, (s, a) => { s.loading = false; s.selected = a.payload; })
      .addCase(fetchProductByIdThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      // Admin fetch all
      .addCase(adminFetchProductsThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(adminFetchProductsThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.items   = a.payload.products;
        s.total   = a.payload.total;
      })
      .addCase(adminFetchProductsThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      // Admin create
      .addCase(adminCreateProductThunk.fulfilled, (s, a) => {
        s.items = [a.payload, ...s.items];
        s.total += 1;
      })

      // Admin update
      .addCase(adminUpdateProductThunk.fulfilled, (s, a) => {
        const idx = s.items.findIndex(p => p._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      })

      // Admin delete
      .addCase(adminDeleteProductThunk.fulfilled, (s, a) => {
        s.items = s.items.filter(p => p._id !== a.payload);
        s.total = Math.max(0, s.total - 1);
      });
  },
});

export const { clearSelected } = productsSlice.actions;
export default productsSlice.reducer;
