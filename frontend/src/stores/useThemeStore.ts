import { create } from 'zustand';
import { getChromeAPI } from '../lib/chrome';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const getInitialTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem('chrome_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Ignore localStorage errors in restricted environments
  }
  return 'dark'; // Chrome dark theme default
};

const applyThemeToDOM = (theme: ThemeMode) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

let themeListenersAttached = false;

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme: ThemeMode) => {
    try {
      localStorage.setItem('chrome_theme', theme);
    } catch {
      // Ignore storage errors
    }
    applyThemeToDOM(theme);

    const api = getChromeAPI();
    if (api?.system?.setSetting) {
      api.system.setSetting('theme', theme).catch(() => { });
    }

    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: () => {
    const current = get().theme;
    applyThemeToDOM(current);

    const api = getChromeAPI();

    if (!themeListenersAttached) {
      themeListenersAttached = true;

      // Sync across windows via Web Storage API
      window.addEventListener('storage', (e) => {
        if (e.key === 'chrome_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
          applyThemeToDOM(e.newValue);
          set({ theme: e.newValue });
        }
      });

      // Sync across windows via Electron IPC
      if (api?.on) {
        api.on('chrome:theme-changed', (newTheme: any) => {
          if (newTheme === 'light' || newTheme === 'dark') {
            applyThemeToDOM(newTheme);
            try {
              localStorage.setItem('chrome_theme', newTheme);
            } catch { }
            set({ theme: newTheme });
          }
        });
      }
    }

    if (api?.system?.getConfig) {
      api.system.getConfig().then((cfg: any) => {
        const remoteTheme = cfg?.settings?.theme;
        if (remoteTheme && (remoteTheme === 'dark' || remoteTheme === 'light')) {
          if (remoteTheme !== get().theme) {
            get().setTheme(remoteTheme);
          }
        }
      }).catch(() => { });
    }
  },
}));
