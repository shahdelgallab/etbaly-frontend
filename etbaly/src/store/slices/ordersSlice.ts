import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderService } from '../../services/orderService';
import type { ApiOrder, ApiOrderStatus } from '../../types/api';
import type { AdminOrdersQuery } from '../../services/orderService';

interface OrdersState {
  items:    ApiOrder[];
  total:    number;
  loading:  boolean;
  error:    string | null;
  selected: ApiOrder | null;
}

const initialState: OrdersState = {
  items:    [],
  total:    0,
  loading:  false,
  error:    null,
  selected: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchMyOrdersThunk = createAsyncThunk(
  'orders/fetchMine',
  async (_: void | undefined, { rejectWithValue }) => {
    try {
      // Returns ApiOrder[] directly (already unwrapped in service)
      const orders = await orderService.getMyOrders();
      return orders;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to load orders.';
      return rejectWithValue(msg);
    }
  }
);

export const fetchAllOrdersThunk = createAsyncThunk(
  'orders/fetchAll',
  async (params: AdminOrdersQuery | undefined, { rejectWithValue }) => {
    try {
      const res = await orderService.getAll(params);
      // res is ApiSuccess<AdminOrdersData>, data has { orders, total, page, limit }
      return { orders: res.data.orders, total: res.data.total };
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to load orders.';
      return rejectWithValue(msg);
    }
  }
);

export const updateOrderStatusThunk = createAsyncThunk(
  'orders/updateStatus',
  async (payload: { id: string; status: ApiOrderStatus }, { rejectWithValue }) => {
    try {
      // Returns ApiOrder directly (already unwrapped in service)
      return await orderService.updateStatus(payload.id, payload.status);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to update order.';
      return rejectWithValue(msg);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    selectOrder:   (state, action: { payload: ApiOrder }) => { state.selected = action.payload; },
    clearSelected: (state) => { state.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchMyOrders — returns ApiOrder[] directly
      .addCase(fetchMyOrdersThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(fetchMyOrdersThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.items   = a.payload;
        s.total   = a.payload.length;
      })
      .addCase(fetchMyOrdersThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      // fetchAllOrders — returns { orders, total }
      .addCase(fetchAllOrdersThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(fetchAllOrdersThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.items   = a.payload.orders;
        s.total   = a.payload.total;
      })
      .addCase(fetchAllOrdersThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      // updateStatus — returns updated ApiOrder
      .addCase(updateOrderStatusThunk.fulfilled, (s, a) => {
        const idx = s.items.findIndex(o => o._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      });
  },
});

export const { selectOrder, clearSelected } = ordersSlice.actions;
export default ordersSlice.reducer;
