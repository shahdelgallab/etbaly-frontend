import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// ─── Base instance ────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers ────────────────────────────────────────────────────────────

const TOKEN_KEY   = 'etbaly_access_token';
const REFRESH_KEY = 'etbaly_refresh_token';

export const tokenStorage = {
  getAccess:    ()          => localStorage.getItem(TOKEN_KEY),
  getRefresh:   ()          => localStorage.getItem(REFRESH_KEY),
  setTokens:    (a: string, r: string) => {
    localStorage.setItem(TOKEN_KEY, a);
    localStorage.setItem(REFRESH_KEY, r);
  },
  clearTokens:  () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ─── Request interceptor — attach access token + fix multipart uploads ────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // When sending FormData, delete the default application/json Content-Type so
  // axios can set multipart/form-data with the correct boundary automatically.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// ─── Response interceptor — auto refresh on 401 ──────────────────────────────

let isRefreshing = false;
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  failedQueue = [];
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401, and not on the refresh endpoint itself
    if (err.response?.status === 401 && !original._retry && !original.url?.includes('/auth/refresh-token')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        window.location.href = '/signin';
        return Promise.reject(err);
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefresh } = data.data;
        tokenStorage.setTokens(accessToken, newRefresh);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        tokenStorage.clearTokens();
        window.location.href = '/signin';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
