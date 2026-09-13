import { create } from 'zustand';
import type { ChromeTab } from '../types/chrome';
import { getChromeAPI } from '../lib/chrome';

interface TabState {
  tabs: ChromeTab[];
  activeTabId: string | null;
  urlInput: string;
  blockedCount: number;
  initTabs: () => Promise<void>;
  createTab: (url?: string) => Promise<void>;
  closeTab: (tabId: string) => Promise<void>;
  activateTab: (tabId: string) => Promise<void>;
  navigate: (url: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  reload: () => Promise<void>;
  setUrlInput: (val: string) => void;
  updateTab: (tab: any) => void;
}

let listenersAttached = false;

const addOrUpdateTab = (currentTabs: ChromeTab[], tab: any): ChromeTab[] => {
  const targetId = tab.id || tab.tabId;
  if (!targetId) return currentTabs;
  const normalized: ChromeTab = { ...tab, id: targetId };
  const idx = currentTabs.findIndex((t) => t.id === targetId);
  if (idx >= 0) {
    const next = [...currentTabs];
    next[idx] = { ...next[idx], ...normalized };
    return next;
  }
  return [...currentTabs, normalized];
};

const getChromeTabTitle = (url: string): string => {
  if (!url) return 'New Tab';
  if (url.startsWith('chrome://') || url.startsWith('chrome://')) {
    const page = url.replace(/^(chrome|chrome):\/\//i, '').split('/')[0].toLowerCase();
    const TITLES: Record<string, string> = {
      newtab: 'New Tab',
      extensions: 'Extensions',
      apps: 'Apps',
      settings: 'Settings',
      history: 'History',
      downloads: 'Downloads',
      bookmarks: 'Bookmarks',
      notebook: 'Notebook',
      explorer: 'Resource Explorer',
      interceptor: 'API Inspector',
      userscripts: 'Userscripts',
      scraper: 'Scraper Builder',
      'scraper-builder': 'Scraper Builder',
      scrapper: 'Scraper Builder',
      'scrapper-builder': 'Scraper Builder',
      scraperbuilder: 'Scraper Builder',
      scrapperbuilder: 'Scraper Builder',
      memory: 'Task Manager',
      system: 'Task Manager',
      console: 'Developer Console',
      cookies: 'Cookie Jar',
    };
    return TITLES[page] || (page.charAt(0).toUpperCase() + page.slice(1));
  }
  return 'New Tab';
};

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  urlInput: '',
  blockedCount: 0,

  initTabs: async () => {
    const api = getChromeAPI();
    if (!api?.tabs) {
      if (get().tabs.length === 0) {
        let fallbackUrl = 'chrome://newtab';
        try {
          const localNewTab = localStorage.getItem('chrome_new_tab_url');
          const localHome = localStorage.getItem('chrome_homepage');
          if (localNewTab) fallbackUrl = localNewTab;
          else if (localHome) fallbackUrl = localHome;
        } catch { }
        set({
          tabs: [{ id: 'tab-1', title: 'New Tab', url: fallbackUrl, isLoading: false }],
          activeTabId: 'tab-1',
          urlInput: fallbackUrl,
        });
      }
      return;
    }

    try {
      const all = await api.tabs.getAll();
      const active = await api.tabs.getActive();
      if (all && all.length > 0) {
        const unique = all.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
        const currentActiveId = active?.id || unique[0]?.id || null;
        const currentActive = unique.find((t) => t.id === currentActiveId);
        set({ tabs: unique, activeTabId: currentActiveId, urlInput: currentActive?.url || '' });
      }
    } catch { }

    if (api?.on && !listenersAttached) {
      listenersAttached = true;
      api.on('chrome:tab-created', (tab: any) => {
        set((state) => ({
          tabs: addOrUpdateTab(state.tabs, tab),
          activeTabId: tab.id || tab.tabId,
          urlInput: tab.url || '',
        }));
      });

      api.on('chrome:tab-closed', (data: any) => {
        const closedId = typeof data === 'string' ? data : data?.closedId;
        const nextActiveId = typeof data === 'object' ? data?.activeTabId : undefined;
        set((state) => {
          const remaining = state.tabs.filter((t) => t.id !== closedId);
          const nextActive = nextActiveId !== undefined ? nextActiveId
            : state.activeTabId === closedId ? remaining[remaining.length - 1]?.id || null
              : state.activeTabId;
          const nextTab = remaining.find((t) => t.id === nextActive);
          return { tabs: remaining, activeTabId: nextActive, urlInput: nextTab?.url || '' };
        });
      });

      api.on('chrome:tab-activated', (data: any) => {
        const id = typeof data === 'string' ? data : data?.id;
        if (!id) return;
        set((state) => {
          const current = state.tabs.find((t) => t.id === id);
          return { activeTabId: id, urlInput: current?.url || '' };
        });
      });

      api.on('chrome:tab-navigated', ({ tabId, url, title }: { tabId: string; url: string; title?: string }) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, url, ...(title ? { title } : {}) } : t)),
          urlInput: state.activeTabId === tabId ? url : state.urlInput,
        }));
      });

      api.on('chrome:tab-updated', (tab: any) => {
        get().updateTab(tab);
      });
    }
  },

  createTab: async (url?: string) => {
    const api = getChromeAPI();
    let targetUrl = url;
    if (!targetUrl) {
      try {
        const localNewTab = localStorage.getItem('chrome_new_tab_url');
        const localHome = localStorage.getItem('chrome_homepage');
        if (localNewTab) {
          targetUrl = localNewTab;
        } else if (localHome) {
          targetUrl = localHome;
        } else if (api?.system?.getConfig) {
          const cfg = await api.system.getConfig();
          const remote = cfg?.settings?.newTabUrl || cfg?.settings?.homepage || cfg?.newTabUrl || cfg?.homepage;
          if (remote) targetUrl = remote;
        }
      } catch { }
    }
    if (!targetUrl) targetUrl = 'chrome://newtab';
    if (targetUrl.startsWith('chrome://')) {
      targetUrl = 'chrome://' + targetUrl.slice(9);
    }

    const chromeTitle = targetUrl.startsWith('chrome://') ? getChromeTabTitle(targetUrl) : undefined;

    if (api?.tabs) {
      const tab = await api.tabs.create({ url: targetUrl, active: true });
      if (tab) {
        const enhancedTab = chromeTitle ? { ...tab, title: chromeTitle } : tab;
        set((state) => ({
          tabs: addOrUpdateTab(state.tabs, enhancedTab),
          activeTabId: tab.id,
          urlInput: tab.url || targetUrl,
        }));
      }
    } else {
      const id = `tab-${Date.now()}`;
      const newTab: ChromeTab = {
        id,
        title: chromeTitle || 'New Tab',
        url: targetUrl,
        isLoading: false,
      };
      set((state) => ({
        tabs: addOrUpdateTab(state.tabs, newTab),
        activeTabId: id,
        urlInput: targetUrl,
      }));
    }
  },

  closeTab: async (tabId: string) => {
    const api = getChromeAPI();
    if (api?.tabs) await api.tabs.close(tabId);
    set((state) => {
      const remaining = state.tabs.filter((t) => t.id !== tabId);
      const nextActive = state.activeTabId === tabId ? remaining[remaining.length - 1]?.id || null : state.activeTabId;
      const nextTab = remaining.find((t) => t.id === nextActive);
      return { tabs: remaining, activeTabId: nextActive, urlInput: nextTab?.url || '' };
    });
  },

  activateTab: async (tabId: string) => {
    const api = getChromeAPI();
    if (api?.tabs) await api.tabs.activate(tabId);
    set((state) => {
      const current = state.tabs.find((t) => t.id === tabId);
      return { activeTabId: tabId, urlInput: current?.url || '' };
    });
  },

  navigate: async (url: string) => {
    const { activeTabId, updateTab } = get();
    if (!activeTabId) return;

    let target = url.trim();
    if (!target) return;
    if (target.startsWith('chrome://')) {
      target = 'chrome://' + target.slice(9);
    }
    if (!/^https?:\/\//i.test(target) && !target.startsWith('about:') && !target.startsWith('file:') && !target.startsWith('chrome:')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = `https://${target}`;
      } else {
        let engine = 'https://www.google.com/search?q=';
        try {
          const localEngine = localStorage.getItem('chrome_default_search_engine');
          if (localEngine) engine = localEngine;
        } catch { }
        target = `${engine}${encodeURIComponent(target)}`;
      }
    }

    const chromeTitle = target.startsWith('chrome://') ? getChromeTabTitle(target) : undefined;

    set({ urlInput: target });
    updateTab({ id: activeTabId, url: target, ...(chromeTitle ? { title: chromeTitle } : {}) });
    const api = getChromeAPI();
    if (api?.tabs) await api.tabs.navigate(activeTabId, target);
  },

  goBack: async () => {
    const api = getChromeAPI();
    if (get().activeTabId && api?.tabs) await api.tabs.goBack(get().activeTabId!);
  },
  goForward: async () => {
    const api = getChromeAPI();
    if (get().activeTabId && api?.tabs) await api.tabs.goForward(get().activeTabId!);
  },
  reload: async () => {
    const api = getChromeAPI();
    if (get().activeTabId && api?.tabs) await api.tabs.reload(get().activeTabId!);
  },
  setUrlInput: (val: string) => set({ urlInput: val }),
  updateTab: (tab: any) => {
    const targetId = tab.id || tab.tabId;
    if (!targetId) return;
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === targetId ? { ...t, ...tab, id: targetId } : t)),
      urlInput: state.activeTabId === targetId && tab.url !== undefined ? tab.url : state.urlInput,
    }));
  },
}));
