import { create } from 'zustand';
import { getChromeAPI } from '../lib/chrome';

interface SettingsState {
  showStatusBar: boolean;
  showBookmarksBar: boolean;
  showDeveloperSidebar: boolean;
  setShowStatusBar: (show: boolean) => void;
  setShowBookmarksBar: (show: boolean) => void;
  setShowDeveloperSidebar: (show: boolean) => void;
  toggleStatusBar: () => void;
  toggleBookmarksBar: () => void;
  toggleDeveloperSidebar: () => void;
  initSettings: () => void;
}

const getStoredShowStatusBar = (): boolean => {
  try {
    const saved = localStorage.getItem('chrome_show_statusbar');
    if (saved !== null) return saved === 'true';
  } catch { }
  return false; // Modern Chrome hides status bar by default
};

const getStoredShowBookmarksBar = (): boolean => {
  try {
    const saved = localStorage.getItem('chrome_show_bookmarks_bar');
    if (saved !== null) return saved === 'true';
  } catch { }
  return true; // Shown by default on Chrome
};

const getStoredShowDeveloperSidebar = (): boolean => {
  try {
    const saved = localStorage.getItem('chrome_show_developer_sidebar');
    if (saved !== null) return saved === 'true';
  } catch { }
  return false; // Hidden by default for authentic Chrome layout, toggleable via Settings / Menu
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  showStatusBar: getStoredShowStatusBar(),
  showBookmarksBar: getStoredShowBookmarksBar(),
  showDeveloperSidebar: getStoredShowDeveloperSidebar(),

  setShowStatusBar: (show: boolean) => {
    try {
      localStorage.setItem('chrome_show_statusbar', String(show));
    } catch { }
    const api = getChromeAPI();
    if (api?.system?.setSetting) {
      api.system.setSetting('showStatusBar', show).catch(() => { });
    }
    set({ showStatusBar: show });
  },

  setShowBookmarksBar: (show: boolean) => {
    try {
      localStorage.setItem('chrome_show_bookmarks_bar', String(show));
    } catch { }
    set({ showBookmarksBar: show });
  },

  setShowDeveloperSidebar: (show: boolean) => {
    try {
      localStorage.setItem('chrome_show_developer_sidebar', String(show));
    } catch { }
    set({ showDeveloperSidebar: show });
  },

  toggleStatusBar: () => {
    get().setShowStatusBar(!get().showStatusBar);
  },

  toggleBookmarksBar: () => {
    get().setShowBookmarksBar(!get().showBookmarksBar);
  },

  toggleDeveloperSidebar: () => {
    get().setShowDeveloperSidebar(!get().showDeveloperSidebar);
  },

  initSettings: () => {
    const api = getChromeAPI();
    if (api?.system?.getConfig) {
      api.system.getConfig().then((cfg: any) => {
        if (cfg?.settings?.showStatusBar !== undefined) {
          const remoteVal = Boolean(cfg.settings.showStatusBar);
          if (remoteVal !== get().showStatusBar) {
            get().setShowStatusBar(remoteVal);
          }
        }
      }).catch(() => { });
    }
  },
}));
