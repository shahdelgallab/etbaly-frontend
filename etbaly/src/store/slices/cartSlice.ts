import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartService } from '../../services/cartService';
import type { ApiCart } from '../../types/api';
import type { AddCartPayload } from '../../services/cartService';

interface CartState {
  cart:    ApiCart | null;
  isOpen:  boolean;
  loading: boolean;
  error:   string | null;
}

const initialState: CartState = {
  cart:    null,
  isOpen:  false,
  loading: false,
  error:   null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMsg(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message ?? 'Cart operation failed.';
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCartThunk = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try { return await cartService.getCart(); }
    catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

export const addCartItemThunk = createAsyncThunk(
  'cart/addItem',
  async (payload: AddCartPayload, { rejectWithValue }) => {
    try { return await cartService.addItem(payload); }
    catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

export const updateCartItemThunk = createAsyncThunk(
  'cart/updateItem',
  async (payload: { itemId: string; quantity: number }, { rejectWithValue }) => {
    try { return await cartService.updateItem(payload.itemId, { quantity: payload.quantity }); }
    catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

export const removeCartItemThunk = createAsyncThunk(
  'cart/removeItem',
  async (itemId: string, { rejectWithValue }) => {
    try { return await cartService.removeItem(itemId); }
    catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

export const clearCartThunk = createAsyncThunk(
  'cart/clear',
  async (_, { rejectWithValue }) => {
    try { await cartService.clearCart(); }
    catch (e) { return rejectWithValue(extractMsg(e)); }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    openCart:  (state) => { state.isOpen = true;  },
    closeCart: (state) => { state.isOpen = false; },
    /** Patch a cart item's display fields optimistically (name, thumbnailUrl) */
    patchItemDisplay: (
      state,
      action: { payload: { itemRefId: string; name?: string; thumbnailUrl?: string } }
    ) => {
      if (!state.cart) return;
      const { itemRefId, name, thumbnailUrl } = action.payload;
      state.cart.items = state.cart.items.map(item =>
        item.itemRefId === itemRefId
          ? {
              ...item,
              ...(name         ? { name }         : {}),
              ...(thumbnailUrl ? { thumbnailUrl }  : {}),
            }
          : item
      );
    },
  },
  extraReducers: (builder) => {
    const setCart = (state: CartState, action: { payload: ApiCart }) => {
      state.loading = false;
      state.cart    = action.payload;
    };
    const setPending = (state: CartState) => { state.loading = true; state.error = null; };
    const setError   = (state: CartState, action: { payload: unknown }) => {
      state.loading = false;
      state.error   = action.payload as string;
    };

    builder
      .addCase(fetchCartThunk.pending,   setPending)
      .addCase(fetchCartThunk.fulfilled, setCart)
      .addCase(fetchCartThunk.rejected,  setError)

      .addCase(addCartItemThunk.pending,   setPending)
      .addCase(addCartItemThunk.fulfilled, (s, a) => { setCart(s, a); s.isOpen = true; })
      .addCase(addCartItemThunk.rejected,  setError)

      .addCase(updateCartItemThunk.pending,   setPending)
      .addCase(updateCartItemThunk.fulfilled, setCart)
      .addCase(updateCartItemThunk.rejected,  setError)

      .addCase(removeCartItemThunk.pending,   setPending)
      .addCase(removeCartItemThunk.fulfilled, setCart)
      .addCase(removeCartItemThunk.rejected,  setError)

      .addCase(clearCartThunk.pending,   setPending)
      .addCase(clearCartThunk.fulfilled, s => { s.loading = false; s.cart = null; })
      .addCase(clearCartThunk.rejected,  setError);
  },
});

export const { openCart, closeCart, patchItemDisplay } = cartSlice.actions;
export default cartSlice.reducer;
