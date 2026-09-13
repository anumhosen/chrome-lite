import { create } from 'zustand';
import type { ChromeDownloadItem } from '../types/chrome';
import { chromeApi } from '../services/chromeApi';

export type DownloadTabType = 'all' | 'queue' | 'active' | 'history';

interface DownloadState {
  queue: ChromeDownloadItem[];
  history: ChromeDownloadItem[];
  downloads: ChromeDownloadItem[];
  currentTab: DownloadTabType;
  searchQuery: string;
  isLoading: boolean;
  setTab: (tab: DownloadTabType) => void;
  setSearchQuery: (query: string) => void;
  refresh: () => Promise<void>;
  refreshSilent: () => Promise<void>;
  clearDownloads: () => Promise<void>;
  clearQueue: () => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  openFolder: () => Promise<void>;
  openFile: (filePath?: string) => Promise<void>;
  showItem: (filePath?: string) => Promise<void>;
  runBatchDownload: (type: string, activeTabId: string, activeUrl?: string) => Promise<void>;
}

let downloadEventsAttached = false;

export const useDownloadStore = create<DownloadState>((set, get) => ({
  queue: [],
  history: [],
  downloads: [],
  currentTab: 'all',
  searchQuery: '',
  isLoading: false,

  setTab: (tab) => {
    set({ currentTab: tab });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  refreshSilent: async () => {
    try {
      const [queue, items] = await Promise.all([
        chromeApi.downloads.getQueue(),
        chromeApi.downloads.get(100),
      ]);
      set({ queue, downloads: items, history: items });
    } catch {
      // Silent error handling
    }
  },

  refresh: async () => {
    if (!downloadEventsAttached) {
      downloadEventsAttached = true;
      chromeApi.on('chrome:download-started', (record: ChromeDownloadItem) => {
        set((state) => {
          const exists = state.downloads.some((d) => d.id === record.id);
          const updated = exists
            ? state.downloads.map((d) => (d.id === record.id ? { ...d, ...record } : d))
            : [record, ...state.downloads];
          return { downloads: updated, history: updated };
        });
      });

      chromeApi.on('chrome:download-progress', (record: ChromeDownloadItem) => {
        set((state) => {
          const exists = state.downloads.some((d) => d.id === record.id);
          const updated = exists
            ? state.downloads.map((d) => (d.id === record.id ? { ...d, ...record } : d))
            : [record, ...state.downloads];
          return { downloads: updated, history: updated };
        });
      });

      chromeApi.on('chrome:download-done', (record: ChromeDownloadItem) => {
        set((state) => {
          const exists = state.downloads.some((d) => d.id === record.id);
          const updated = exists
            ? state.downloads.map((d) => (d.id === record.id ? { ...d, ...record } : d))
            : [record, ...state.downloads];
          return { downloads: updated, history: updated };
        });
        get().refreshSilent();
      });
    }

    set({ isLoading: true });
    try {
      const [queue, items] = await Promise.all([
        chromeApi.downloads.getQueue(),
        chromeApi.downloads.get(100),
      ]);
      set({ queue, downloads: items, history: items });
    } catch {
      // Ignore fetch error
    } finally {
      set({ isLoading: false });
    }
  },

  clearDownloads: async () => {
    await chromeApi.downloads.clear();
    await get().refreshSilent();
  },

  clearQueue: async () => {
    await chromeApi.downloads.clearQueue();
    await get().refreshSilent();
  },

  removeItem: async (id: string) => {
    set((state) => {
      const filtered = state.downloads.filter((d) => d.id !== id);
      return { downloads: filtered, history: filtered };
    });
    await chromeApi.downloads.remove(id);
    await get().refreshSilent();
  },

  openFolder: async () => {
    try {
      await chromeApi.downloads.openFolder();
    } catch (err: any) {
      alert('Could not open downloads folder: ' + err.message);
    }
  },

  openFile: async (filePath?: string) => {
    if (!filePath) return;
    try {
      const ok = await chromeApi.downloads.openFile(filePath);
      if (!ok) alert('File could not be opened or does not exist at: ' + filePath);
    } catch (err: any) {
      alert('Failed to open file: ' + err.message);
    }
  },

  showItem: async (filePath?: string) => {
    if (!filePath) return;
    try {
      await chromeApi.downloads.showItem(filePath);
    } catch (err: any) {
      alert('Failed to show file in folder: ' + err.message);
    }
  },

  runBatchDownload: async (type: string, activeTabId: string, activeUrl?: string) => {
    const rawApi = chromeApi.raw();
    if (!rawApi?.explorer) return;
    try {
      const assets = await rawApi.explorer.getAssets(activeTabId);
      const matching = (assets || []).filter((a) =>
        type === 'video' ? a.type === 'video' || a.type === 'audio' : a.type === type
      );

      if (matching.length === 0) {
        alert(`No ${type} assets found on this page. Try clicking "Scan Page" in Explorer.`);
        return;
      }

      const host = activeUrl ? new URL(activeUrl).hostname : 'site';
      if (confirm(`Queue ${matching.length} ${type} files for download into downloads/${host}/?`)) {
        await chromeApi.downloads.batchQueue(matching);
        await get().refreshSilent();
      }
    } catch (err: any) {
      alert('Batch download error: ' + err.message);
    }
  },
}));
