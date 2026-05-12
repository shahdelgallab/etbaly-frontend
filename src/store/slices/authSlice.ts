import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { tokenStorage } from '../../services/api';
import type { ApiUser } from '../../types/api';
import type { LoginPayload, RegisterPayload, VerifyOtpPayload, ResetPasswordPayload } from '../../services/authService';

// ─── Ensure user always has a valid profile object ───────────────────────────

function sanitizeUser(user: ApiUser): ApiUser {
  return {
    ...user,
    profile: {
      firstName:   user.profile?.firstName   ?? '',
      lastName:    user.profile?.lastName    ?? '',
      phoneNumber: user.profile?.phoneNumber,
      bio:         user.profile?.bio,
      avatarUrl:   user.profile?.avatarUrl,
    },
    savedAddresses: Array.isArray(user.savedAddresses) ? user.savedAddresses : [],
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  user:         ApiUser | null;
  accessToken:  string | null;
  refreshToken: string | null;
  loading:      boolean;
  /** True while the initial getMe() re-hydration is in-flight */
  hydrating:    boolean;
  error:        string | null;
  /** Email waiting for OTP verification after register */
  pendingEmail: string | null;
}

const _hasToken = Boolean(tokenStorage.getAccess());

const initialState: AuthState = {
  user:         null,
  accessToken:  tokenStorage.getAccess(),
  refreshToken: tokenStorage.getRefresh(),
  loading:      false,
  // If there's a token we'll fire getMe() — stay in hydrating state until it resolves
  hydrating:    _hasToken,
  error:        null,
  pendingEmail: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const res = await authService.register(payload);
      return { email: payload.email, user: res.data.user };
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; data?: { errors?: { field: string; message: string }[] } } };
        message?: string;
        code?: string;
      };

      // Network error — backend not reachable
      if (!axiosErr.response) {
        const msg = axiosErr.code === 'ECONNABORTED'
          ? 'Request timed out. Is the backend running?'
          : `Cannot reach the server. Check that the backend is running at ${import.meta.env.VITE_API_URL}`;
        console.error('[register] Network error:', axiosErr.message);
        return rejectWithValue(msg);
      }

      // Validation errors from backend
      const validationErrors = axiosErr.response.data?.data?.errors;
      if (validationErrors?.length) {
        const msg = validationErrors.map(e => `${e.field}: ${e.message}`).join(' · ');
        return rejectWithValue(msg);
      }

      const msg = axiosErr.response.data?.message ?? 'Registration failed.';
      console.error('[register] Server error:', msg);
      return rejectWithValue(msg);
    }
  }
);

export const verifyOtpThunk = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: VerifyOtpPayload, { rejectWithValue }) => {
    try {
      const res = await authService.verifyOtp(payload);
      tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      return { ...res.data, user: sanitizeUser(res.data.user) };
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'OTP verification failed.';
      return rejectWithValue(msg);
    }
  }
);

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await authService.login(payload);
      tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      // Fetch full profile to ensure profile object is complete
      try {
        const fullUser = await userService.getMe();
        return { ...res.data, user: sanitizeUser(fullUser) };
      } catch {
        return { ...res.data, user: sanitizeUser(res.data.user) };
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
        code?: string;
      };
      if (!axiosErr.response) {
        return rejectWithValue(`Cannot reach the server. Check that the backend is running at ${import.meta.env.VITE_API_URL}`);
      }
      const msg = axiosErr.response.data?.message ?? 'Login failed.';
      return rejectWithValue(msg);
    }
  }
);

export const googleLoginThunk = createAsyncThunk(
  'auth/googleLogin',
  async (idToken: string, { rejectWithValue }) => {
    try {
      const res = await authService.googleAuth(idToken);
      tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      try {
        const fullUser = await userService.getMe();
        return { ...res.data, user: sanitizeUser(fullUser) };
      } catch {
        return { ...res.data, user: sanitizeUser(res.data.user) };
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
        code?: string;
      };
      if (!axiosErr.response) {
        return rejectWithValue(`Cannot reach the server at ${import.meta.env.VITE_API_URL}`);
      }
      return rejectWithValue(axiosErr.response.data?.message ?? 'Google sign-in failed.');
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const refreshToken = state.auth.refreshToken ?? undefined;
    try { await authService.logout(refreshToken); } catch { /* silent */ }
    tokenStorage.clearTokens();
  }
);

export const forgotPasswordThunk = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await authService.forgotPassword(email);
      return email;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Request failed.';
      return rejectWithValue(msg);
    }
  }
);

export const resetPasswordThunk = createAsyncThunk(
  'auth/resetPassword',
  async (payload: ResetPasswordPayload, { rejectWithValue }) => {
    try {
      await authService.resetPassword(payload);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Reset failed.';
      return rejectWithValue(msg);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser:    (state, action: { payload: ApiUser }) => { state.user = sanitizeUser(action.payload); },
    setHydrating: (state, action: { payload: boolean }) => { state.hydrating = action.payload; },
    patchUser:  (state, action: { payload: Partial<ApiUser> }) => {
      if (state.user) state.user = {
        ...state.user,
        ...action.payload,
        profile: { ...state.user.profile, ...(action.payload.profile ?? {}) },
        savedAddresses: action.payload.savedAddresses ?? state.user.savedAddresses,
      };
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(registerThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.pendingEmail = a.payload.email;
      })
      .addCase(registerThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // Verify OTP
    builder
      .addCase(verifyOtpThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(verifyOtpThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.user         = a.payload.user;
        s.accessToken  = a.payload.accessToken;
        s.refreshToken = a.payload.refreshToken;
        s.pendingEmail = null;
      })
      .addCase(verifyOtpThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // Login
    builder
      .addCase(loginThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.hydrating    = false;
        s.user         = a.payload.user;
        s.accessToken  = a.payload.accessToken;
        s.refreshToken = a.payload.refreshToken;
      })
      .addCase(loginThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // Google Login
    builder
      .addCase(googleLoginThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(googleLoginThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.hydrating    = false;
        s.user         = a.payload.user;
        s.accessToken  = a.payload.accessToken;
        s.refreshToken = a.payload.refreshToken;
      })
      .addCase(googleLoginThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });

    // Logout
    builder.addCase(logoutThunk.fulfilled, s => {
      s.user = null; s.accessToken = null; s.refreshToken = null; s.hydrating = false;
    });

    // Forgot / Reset password
    builder
      .addCase(forgotPasswordThunk.pending,  s => { s.loading = true;  s.error = null; })
      .addCase(forgotPasswordThunk.fulfilled,s => { s.loading = false; })
      .addCase(forgotPasswordThunk.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(resetPasswordThunk.pending,   s => { s.loading = true;  s.error = null; })
      .addCase(resetPasswordThunk.fulfilled, s => { s.loading = false; })
      .addCase(resetPasswordThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; });
  },
});

export const { clearError, setUser, setHydrating, patchUser } = authSlice.actions;
export default authSlice.reducer;
