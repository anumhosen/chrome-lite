import { create } from 'zustand';
import { useTabStore } from './useTabStore';
import type { ChromeTab } from '../types/chrome';
import { getChromeAPI } from '../lib/chrome';

interface TabBindingState {
  boundTabId: string | null;
  setBoundTabId: (tabId: string | null) => void;
  getBoundTab: () => ChromeTab | null;
  getAvailableWebTabs: () => ChromeTab[];
}

let queryTabInit: string | null = null;
try {
  const params = new URLSearchParams(window.location.search);
  queryTabInit = params.get('targetTab');
} catch { }

let bindingListenersAttached = false;

export const useTabBindingStore = create<TabBindingState>((set, get) => {
  if (typeof window !== 'undefined' && !bindingListenersAttached) {
    bindingListenersAttached = true;
    const api = getChromeAPI();

    // Listen for tab-bound updates from main process (e.g. focusing existing popout)
    if (api?.on) {
      api.on('chrome:tab-bound', (tabId: string) => {
        if (tabId) {
          set({ boundTabId: tabId });
        }
      });

      // If bound tab is closed, fallback to available web tab
      api.on('chrome:tab-closed', (data: any) => {
        const closedId = typeof data === 'string' ? data : data?.closedId;
        const currentBound = get().boundTabId;
        if (currentBound === closedId) {
          const webTabs = get().getAvailableWebTabs();
          const next = webTabs.find((t) => t.id !== closedId);
          set({ boundTabId: next ? next.id : null });
        }
      });
    }
  }

  return {
    boundTabId: queryTabInit,

    setBoundTabId: (tabId: string | null) => {
      set({ boundTabId: tabId });
    },

    getAvailableWebTabs: () => {
      const { tabs } = useTabStore.getState();
      return tabs.filter(
        (t) => t.url && !t.url.startsWith('chrome://') && t.url !== 'about:blank'
      );
    },

    getBoundTab: () => {
      const { tabs, activeTabId } = useTabStore.getState();
      const webTabs = tabs.filter(
        (t) => t.url && !t.url.startsWith('chrome://') && t.url !== 'about:blank'
      );

      const current = get().boundTabId;
      if (current) {
        const match = webTabs.find((t) => t.id === current);
        if (match) return match;
      }

      // If activeTabId is a valid web tab, bind to it
      if (activeTabId) {
        const activeWeb = webTabs.find((t) => t.id === activeTabId);
        if (activeWeb) return activeWeb;
      }

      // Fallback to first open web tab
      return webTabs[0] || null;
    },
  };
});
