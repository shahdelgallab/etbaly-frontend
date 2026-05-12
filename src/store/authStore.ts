import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../models/User';

interface AuthStore {
  user: User | null;
  token: string | null;
  setUser: (user: User, token: string) => void;
  clearUser: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setUser: (user, token) => {
        localStorage.setItem('etbaly_token', token);
        set({ user, token });
      },
      clearUser: () => {
        localStorage.removeItem('etbaly_token');
        set({ user: null, token: null });
      },
      updateUser: (data) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...data } });
      },
    }),
    { name: 'etbaly_auth' }
  )
);
