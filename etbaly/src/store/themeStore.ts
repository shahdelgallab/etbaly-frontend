import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

/** Applies theme to <html>: sets data-theme attr AND toggles 'dark' class for Tailwind v3 */
function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', t);
  if (t === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },

      setTheme: (t) => {
        applyTheme(t);
        set({ theme: t });
      },
    }),
    {
      name: 'etbaly_theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
