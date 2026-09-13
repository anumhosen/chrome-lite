import { create } from 'zustand';

export interface ShortcutItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  faviconUrl: string;
  fallbackInitial: string;
}

const STORAGE_KEY = 'chrome_lite_home_shortcuts';

export const extractDomain = (rawUrl: string): string => {
  let u = rawUrl.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = 'https://' + u;
  }
  try {
    return new URL(u).hostname;
  } catch {
    return u.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0] || rawUrl;
  }
};

export const normalizeUrl = (rawUrl: string): string => {
  const u = rawUrl.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    return 'https://' + u;
  }
  return u;
};

export const getFaviconUrl = (domain: string): string => {
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${encodeURIComponent(domain)}&size=64`;
};

const createShortcut = (id: string, title: string, rawUrl: string): ShortcutItem => {
  const url = normalizeUrl(rawUrl);
  const domain = extractDomain(url);
  return {
    id,
    title: title.trim() || domain,
    url,
    domain,
    faviconUrl: getFaviconUrl(domain),
    fallbackInitial: (title.trim() || domain).charAt(0).toUpperCase(),
  };
};

export const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  createShortcut('google', 'Google', 'https://www.google.com'),
  createShortcut('youtube', 'YouTube', 'https://www.youtube.com'),
  createShortcut('gmail', 'Gmail', 'https://mail.google.com'),
  createShortcut('docs', 'Docs', 'https://docs.google.com'),
  createShortcut('sheets', 'Sheets', 'https://sheets.google.com'),
  createShortcut('slides', 'Slides', 'https://slides.google.com'),
  createShortcut('scholar', 'Scholar', 'https://scholar.google.com'),
  createShortcut('facebook', 'Facebook', 'https://www.facebook.com'),
  createShortcut('whatsapp', 'WhatsApp', 'https://web.whatsapp.com'),
  createShortcut('messenger', 'Messenger', 'https://www.messenger.com'),
  createShortcut('x', 'X', 'https://x.com'),
  createShortcut('github', 'GitHub', 'https://github.com'),
  createShortcut('reddit', 'Reddit', 'https://www.reddit.com'),
  createShortcut('wikipedia', 'Wikipedia', 'https://www.wikipedia.org'),
];

interface ShortcutState {
  shortcuts: ShortcutItem[];
  addShortcut: (title: string, url: string) => void;
  updateShortcut: (id: string, title: string, url: string) => void;
  removeShortcut: (id: string) => void;
  resetToDefaults: () => void;
}

const loadInitialShortcuts = (): ShortcutItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => {
          const domain = item.domain || extractDomain(item.url || '');
          return {
            ...item,
            domain,
            faviconUrl: getFaviconUrl(domain),
            fallbackInitial: item.fallbackInitial || (item.title || domain).charAt(0).toUpperCase(),
          };
        });
      }
    }
  } catch { }
  return DEFAULT_SHORTCUTS;
};

const persistShortcuts = (items: ShortcutItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { }
};

export const useShortcutStore = create<ShortcutState>((set, get) => ({
  shortcuts: loadInitialShortcuts(),

  addShortcut: (title: string, url: string) => {
    const id = 'sc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newShortcut = createShortcut(id, title, url);
    const updated = [...get().shortcuts, newShortcut];
    set({ shortcuts: updated });
    persistShortcuts(updated);
  },

  updateShortcut: (id: string, title: string, url: string) => {
    const updated = get().shortcuts.map((sc) => {
      if (sc.id === id) {
        return createShortcut(id, title, url);
      }
      return sc;
    });
    set({ shortcuts: updated });
    persistShortcuts(updated);
  },

  removeShortcut: (id: string) => {
    const updated = get().shortcuts.filter((sc) => sc.id !== id);
    set({ shortcuts: updated });
    persistShortcuts(updated);
  },

  resetToDefaults: () => {
    set({ shortcuts: DEFAULT_SHORTCUTS });
    persistShortcuts(DEFAULT_SHORTCUTS);
  },
}));
