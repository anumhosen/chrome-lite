import { create } from 'zustand';

export type PanelType =
  | 'notebook'
  | 'downloads'
  | 'history'
  | 'bookmarks'
  | 'explorer'
  | 'interceptor'
  | 'userscripts'
  | 'scraperBuilder'
  | 'automation'
  | 'cookies'
  | 'settings'
  | 'memory'
  | 'console';

interface PanelState {
  currentPanel: PanelType | null;
  isOpen: boolean;
  width: number;
  openPanel: (panel: PanelType) => void;
  closePanel: () => void;
  togglePanel: (panel: PanelType) => void;
  setWidth: (width: number) => void;
}

const getInitialWidth = (): number => {
  try {
    const saved = localStorage.getItem('chrome_panel_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 320) return parsed;
    }
  } catch {
    // Ignore storage error
  }
  return 480;
};

export const usePanelStore = create<PanelState>((set, get) => ({
  currentPanel: null,
  isOpen: false,
  width: getInitialWidth(),

  openPanel: (panel: PanelType) => {
    set({ currentPanel: panel, isOpen: true });
  },

  closePanel: () => {
    set({ isOpen: false, currentPanel: null });
  },

  togglePanel: (panel: PanelType) => {
    const { currentPanel, isOpen } = get();
    if (isOpen && currentPanel === panel) {
      set({ isOpen: false, currentPanel: null });
    } else {
      set({ currentPanel: panel, isOpen: true });
    }
  },

  setWidth: (newWidth: number) => {
    const clamped = Math.min(Math.max(newWidth, 320), window.innerWidth - 80);
    try {
      localStorage.setItem('chrome_panel_width', clamped.toString());
    } catch {
      // Ignore storage error
    }
    set({ width: clamped });
  },
}));
