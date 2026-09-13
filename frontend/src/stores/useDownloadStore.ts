import { create } from 'zustand';
import type { ChromeDownloadItem } from '../types/chrome';
import { chromeApi } from '../services/chromeApi';

interface DownloadState {
  queue: ChromeDownloadItem[];
  history: ChromeDownloadItem[];
  currentTab: 'active' | 'history';
  isLoading: boolean;
  setTab: (tab: 'active' | 'history') => void;
  refresh: () => Promise<void>;
  clearQueue: () => Promise<void>;
  openFile: (filePath?: string) => Promise<void>;
  showItem: (filePath?: string) => Promise<void>;
  runBatchDownload: (type: string, activeTabId: string, activeUrl?: string) => Promise<void>;
}

let downloadEventsAttached = false;

export const useDownloadStore = create<DownloadState>((set, get) => ({
  queue: [],
  history: [],
  currentTab: 'active',
  isLoading: false,

  setTab: (tab) => {
    set({ currentTab: tab });
    get().refresh();
  },

  refresh: async () => {
    if (!downloadEventsAttached) {
      downloadEventsAttached = true;
      chromeApi.on('chrome:download-started', () => { get().refresh(); });
      chromeApi.on('chrome:download-progress', () => { get().refresh(); });
      chromeApi.on('chrome:download-done', () => { get().refresh(); });
    }

    set({ isLoading: true });
    try {
      const queue = await chromeApi.downloads.getQueue();
      const history = await chromeApi.downloads.get(50);
      set({ queue, history });
    } catch {
      // Ignore fetch error
    } finally {
      set({ isLoading: false });
    }
  },

  clearQueue: async () => {
    await chromeApi.downloads.clearQueue();
    await get().refresh();
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
        await get().refresh();
      }
    } catch (err: any) {
      alert('Batch download error: ' + err.message);
    }
  },
}));
