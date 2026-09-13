import { create } from 'zustand';
import type { ChromeBookmarkItem, ChromeHistoryItem } from '../types/chrome';
import { chromeApi } from '../services/chromeApi';

interface HistoryBookmarkState {
  history: ChromeHistoryItem[];
  bookmarks: ChromeBookmarkItem[];
  searchQuery: string;
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  removeHistoryItem: (id: string) => Promise<void>;
  loadBookmarks: () => Promise<void>;
  addBookmark: (title: string, url: string) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
}

export const useHistoryBookmarkStore = create<HistoryBookmarkState>((set) => ({
  history: [],
  bookmarks: [],
  searchQuery: '',
  isLoading: false,

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  loadHistory: async () => {
    set({ isLoading: true });
    try {
      const items = await chromeApi.history.get(100);
      set({ history: items });
    } catch {
      // Ignore error
    } finally {
      set({ isLoading: false });
    }
  },

  clearHistory: async () => {
    await chromeApi.history.clear();
    set({ history: [] });
  },

  removeHistoryItem: async (id: string) => {
    await chromeApi.history.remove(id);
    set((state) => ({ history: state.history.filter((h) => h.id !== id) }));
  },

  loadBookmarks: async () => {
    try {
      const items = await chromeApi.bookmarks.get();
      set({ bookmarks: items });
    } catch {
      // Ignore error
    }
  },

  addBookmark: async (title: string, url: string) => {
    const added = await chromeApi.bookmarks.add({ title, url });
    if (added) {
      set((state) => ({ bookmarks: [added, ...state.bookmarks] }));
    }
  },

  removeBookmark: async (id: string) => {
    await chromeApi.bookmarks.remove(id);
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) }));
  },
}));
