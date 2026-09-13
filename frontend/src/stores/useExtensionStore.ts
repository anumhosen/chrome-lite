import { create } from 'zustand';
import type { ChromeExtension, ExtensionPopupType } from '../types/chrome';
import { getChromeAPI } from '../lib/chrome';

interface ExtensionStoreState {
  extensions: ChromeExtension[];
  activePopup: ExtensionPopupType;
  popupAnchorRect: DOMRect | null;
  isExtensionsMenuOpen: boolean;
  togglePin: (id: string) => void;
  toggleEnabled: (id: string) => void;
  initExtensionStates: () => Promise<void>;
  openPopup: (id: ExtensionPopupType, anchorEl?: HTMLElement | null) => void;
  closePopup: () => void;
  toggleExtensionsMenu: () => void;
  closeExtensionsMenu: () => void;
}

const DEFAULT_EXTENSIONS: ChromeExtension[] = [
  {
    id: 'shield',
    name: 'Chrome Shield (AdBlock)',
    shortName: 'Shield',
    version: '1.2.0',
    description: 'Blocks malicious trackers, ads, and telemetry across all tabs.',
    icon: 'shield',
    enabled: true,
    pinned: true,
    hasPopup: true,
    permissions: ['webRequest', 'declarativeNetRequest', 'cookies'],
  },
  {
    id: 'cookies',
    name: 'Cookie Jar Manager',
    shortName: 'Cookies',
    version: '2.0.1',
    description: 'Inspect, modify, delete, and export cookies for the active domain.',
    icon: 'cookies',
    enabled: true,
    pinned: true,
    hasPopup: true,
    permissions: ['cookies', 'activeTab'],
  },
  {
    id: 'userscripts',
    name: 'Userscript Engine',
    shortName: 'Userscripts',
    version: '1.4.0',
    description: 'Run custom Tampermonkey-compatible scripts and CSS injections.',
    icon: 'userscripts',
    enabled: true,
    pinned: false,
    hasPopup: true,
    permissions: ['scripting', 'activeTab'],
  },
  {
    id: 'interceptor',
    name: 'Network & API Inspector',
    shortName: 'API Inspector',
    version: '2.3.0',
    description: 'Intercept, replay, and mock HTTP requests with live OpenAPI export.',
    icon: 'interceptor',
    enabled: true,
    pinned: false,
    hasPopup: false,
    permissions: ['webRequest', 'webRequestBlocking'],
  },
  {
    id: 'scraper',
    name: 'Visual Web Scraper',
    shortName: 'Scraper',
    version: '1.1.0',
    description: 'Extract tables, articles, and paginated content from any website.',
    icon: 'scraper',
    enabled: true,
    pinned: false,
    hasPopup: false,
    permissions: ['activeTab'],
  },
  {
    id: 'automation',
    name: 'Browser Macro & Automation',
    shortName: 'Macros',
    version: '1.5.0',
    description: 'Record user interactions and schedule headless automated tasks.',
    icon: 'automation',
    enabled: true,
    pinned: false,
    hasPopup: false,
    permissions: ['activeTab', 'alarms'],
  },
  {
    id: 'notebook',
    name: 'Interactive Dev Notebook',
    shortName: 'Notebook',
    version: '2.0.0',
    description: 'Code scratchpad with live JavaScript execution against web pages.',
    icon: 'notebook',
    enabled: true,
    pinned: false,
    hasPopup: false,
    permissions: ['activeTab', 'storage'],
  },
  {
    id: 'explorer',
    name: 'Media & Asset Grabber',
    shortName: 'Explorer',
    version: '1.3.0',
    description: 'Discover and batch-download images, media, and stylesheets.',
    icon: 'explorer',
    enabled: true,
    pinned: false,
    hasPopup: false,
    permissions: ['downloads', 'activeTab'],
  },
];

const loadPersistedExtensions = (): ChromeExtension[] => {
  try {
    const raw = localStorage.getItem('chrome_lite_extensions');
    if (raw) {
      const parsed: Partial<ChromeExtension>[] = JSON.parse(raw);
      return DEFAULT_EXTENSIONS.map((ext) => {
        const match = parsed.find((p) => p.id === ext.id);
        return match ? { ...ext, pinned: match.pinned ?? ext.pinned, enabled: match.enabled ?? ext.enabled } : ext;
      });
    }
  } catch {
    // Ignore storage parse error
  }
  return DEFAULT_EXTENSIONS;
};

const persistExtensions = (exts: ChromeExtension[]) => {
  try {
    const data = exts.map(({ id, pinned, enabled }) => ({ id, pinned, enabled }));
    localStorage.setItem('chrome_lite_extensions', JSON.stringify(data));
  } catch {
    // Ignore storage write error
  }
};

export const useExtensionStore = create<ExtensionStoreState>((set) => ({
  extensions: loadPersistedExtensions(),
  activePopup: null,
  popupAnchorRect: null,
  isExtensionsMenuOpen: false,

  togglePin: (id: string) => {
    set((state) => {
      const next = state.extensions.map((ext) =>
        ext.id === id ? { ...ext, pinned: !ext.pinned } : ext
      );
      persistExtensions(next);
      return { extensions: next };
    });
  },

  toggleEnabled: (id: string) => {
    set((state) => {
      let newEnabled = false;
      const next = state.extensions.map((ext) => {
        if (ext.id === id) {
          newEnabled = !ext.enabled;
          return { ...ext, enabled: newEnabled };
        }
        return ext;
      });
      persistExtensions(next);

      // Synchronize with Electron backend subsystems
      try {
        const api = getChromeAPI();
        if (api) {
          const featureName = id === 'shield' ? 'blocker' : id;
          if (api.system?.setFeature) {
            api.system.setFeature(featureName, newEnabled).catch(() => {});
          }
          if (id === 'shield' && api.blocker?.toggle) {
            api.blocker.toggle(newEnabled).catch(() => {});
          }
        }
      } catch (err) {
        console.debug('Failed to sync extension enabled state to backend:', err);
      }

      return { extensions: next };
    });
  },

  initExtensionStates: async () => {
    try {
      const api = getChromeAPI();
      if (api?.system?.getConfig) {
        const cfg = await api.system.getConfig();
        const features = cfg?.features;
        if (features) {
          set((state) => {
            const next = state.extensions.map((ext) => {
              const featureKey = ext.id === 'shield' ? 'blocker' : ext.id;
              if (features[featureKey] !== undefined) {
                return { ...ext, enabled: Boolean(features[featureKey]) };
              }
              return ext;
            });
            persistExtensions(next);
            return { extensions: next };
          });
        }
      }
    } catch { }
  },

  openPopup: (id: ExtensionPopupType, anchorEl?: HTMLElement | null) => {
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : null;
    set({
      activePopup: id,
      popupAnchorRect: rect,
      isExtensionsMenuOpen: false,
    });
  },

  closePopup: () => {
    set({ activePopup: null, popupAnchorRect: null });
  },

  toggleExtensionsMenu: () => {
    set((state) => ({
      isExtensionsMenuOpen: !state.isExtensionsMenuOpen,
      activePopup: null,
    }));
  },

  closeExtensionsMenu: () => {
    set({ isExtensionsMenuOpen: false });
  },
}));
