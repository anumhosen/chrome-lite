export interface ChromeTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isAudioPlaying?: boolean;
  partition?: string;
}

export interface ChromeDownloadItem {
  id: string;
  url: string;
  filename: string;
  domain?: string;
  save_path?: string;
  received_bytes?: number;
  total_bytes?: number;
  size?: number;
  state: string;
}

export interface ChromeHistoryItem {
  id?: string;
  title: string;
  url: string;
  visited_at?: number | string;
  last_visited?: number | string;
  visit_count?: number;
}

export interface ChromeBookmarkItem {
  id: string;
  title: string;
  url: string;
}

export interface ChromeAsset {
  id: string;
  tab_id: string;
  url: string;
  type: string;
  mime_type?: string;
  size?: number;
  timestamp?: number;
  filename?: string;
  domain?: string;
}

export interface ChromeNotebookResult {
  success: boolean;
  outputStr: string;
  result?: any;
  error?: string;
  durationMs: number;
}

export interface ChromeExtension {
  id: string;
  name: string;
  shortName?: string;
  version: string;
  description: string;
  icon: string;
  author?: string;
  enabled: boolean;
  pinned: boolean;
  hasPopup: boolean;
  badge?: string | number;
  permissions?: string[];
  optionsPage?: string;
  homepage?: string;
}

export type ExtensionPopupType = 'shield' | 'cookies' | 'userscripts' | 'interceptor' | null;

export interface TopSiteShortcut {
  id: string;
  title: string;
  url: string;
  icon?: string;
  isCustom?: boolean;
}

export interface ChromeAPI {
  version: string;
  tabs: {
    create: (options?: { url?: string; active?: boolean }) => Promise<ChromeTab>;
    close: (tabId: string) => Promise<void>;
    activate: (tabId: string) => Promise<void>;
    navigate: (tabId: string, url: string) => Promise<void>;
    goBack: (tabId: string) => Promise<void>;
    goForward: (tabId: string) => Promise<void>;
    reload: (tabId: string) => Promise<void>;
    stop: (tabId: string) => Promise<void>;
    bindContents: (tabId: string, contentsId: number) => Promise<void>;
    getAll: (workspaceId?: string) => Promise<ChromeTab[]>;
    getActive: () => Promise<ChromeTab | null>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    openFloating: (panel: string, targetTabId?: string | null) => Promise<{ success: boolean; panel?: string }>;
    toggleDevTools?: () => Promise<void>;
  };
  bookmarks: {
    get: (wsId?: string) => Promise<ChromeBookmarkItem[]>;
    add: (data: { title: string; url: string }) => Promise<ChromeBookmarkItem>;
    remove: (id: string) => Promise<void>;
    check: (url: string) => Promise<boolean>;
  };
  history: {
    get: (limit?: number) => Promise<ChromeHistoryItem[]>;
    clear: () => Promise<void>;
    remove?: (id: string) => Promise<void>;
    clearCache?: () => Promise<void>;
    clearStorage?: () => Promise<void>;
  };
  downloads: {
    get: (limit?: number) => Promise<ChromeDownloadItem[]>;
    getQueue: () => Promise<ChromeDownloadItem[]>;
    clearQueue: () => Promise<void>;
    batchQueue: (assets: any[]) => Promise<void>;
    openFile?: (filePath: string) => Promise<boolean>;
    showItem?: (filePath: string) => Promise<boolean>;
  };
  notebook: {
    execute: (tabId: string, code: string, opts?: any) => Promise<ChromeNotebookResult>;
    save: (notebook: any) => Promise<any>;
    listLibrary: () => Promise<{ name: string; size: number }[]>;
    load?: (id: string) => Promise<any>;
    getHistory?: (limit?: number) => Promise<any[]>;
    openFile: (filePath: string) => Promise<{ content: string }>;
    saveFile: (filePath: string, content: string) => Promise<void>;
    chooseFileOpen?: () => Promise<{ canceled?: boolean; filePath?: string; content?: string }>;
    chooseFileSave?: (content: string, defaultPath?: string) => Promise<{ canceled?: boolean; filePath?: string; success?: boolean }>;
    openFloating: () => Promise<void>;
  };
  explorer: {
    getAssets: (filter?: any) => Promise<ChromeAsset[]>;
    scanPage: (tabId: string) => Promise<ChromeAsset[]>;
    exportAssets?: (format: string, filter: any) => Promise<any>;
  };
  cookies: {
    get: (filter?: any) => Promise<any[]>;
    export: () => Promise<string | any[]>;
    remove: (url: string, name: string) => Promise<boolean>;
  };
  userscripts: {
    getAll: () => Promise<any[]>;
    save: (script: any) => Promise<any>;
    toggle: (id: string, enabled: boolean) => Promise<any>;
    delete: (id: string) => Promise<any>;
  };
  interceptor: {
    getRequests: (limit?: number) => Promise<any[]>;
    replay: (requestId: string) => Promise<any>;
    clear: () => Promise<void>;
    getMockRules?: () => Promise<any[]>;
    saveMockRule?: (rule: any) => Promise<any>;
    deleteMockRule?: (id: string) => Promise<boolean>;
    toggleMockRule?: (id: string, enabled: boolean) => Promise<boolean>;
    generateOpenApi?: (domainFilter?: string) => Promise<any>;
  };
  scraperBuilder: {
    detectPagination: (tabId?: string) => Promise<any>;
    saveWorkflow: (data: any) => Promise<any>;
  };
  scraper: {
    extract: (tabId: string, selector: string, isTable?: boolean) => Promise<any>;
    startPicker: (tabId: string) => Promise<{ selector: string; tagName: string; textPreview: string } | null>;
    save: (url: string, selector: string, data: any) => Promise<any>;
    exportFile: (data: any[], format: string, filename: string) => Promise<any>;
    getHistory: (limit?: number) => Promise<any[]>;
  };
  automation: {
    getFlows: () => Promise<any[]>;
    saveFlow: (flow: any) => Promise<any>;
    deleteFlow: (id: string) => Promise<boolean>;
    runFlow: (tabId: string, flow: any) => Promise<any>;
    startRecorder: (tabId: string) => Promise<boolean>;
    stopRecorder: (tabId: string) => Promise<any[]>;
    exportFlow: (flow: any) => Promise<any>;
    exportPlaywright?: (flow: any) => Promise<string>;
    getTasks?: () => Promise<any[]>;
    saveTask?: (task: any) => Promise<any>;
    deleteTask?: (id: string) => Promise<boolean>;
    runTaskNow?: (id: string) => Promise<any>;
    runFlowHeadless?: (flow: any, initialUrl?: string) => Promise<any>;
    getTaskLogs?: (taskId: string, limit?: number) => Promise<any[]>;
    testWebhook?: (url: string) => Promise<{ success: boolean; status?: number; error?: string }>;
    onProgress: (callback: (data: any) => void) => () => void;
    onTaskUpdated?: (callback: (data: any) => void) => () => void;
  };
  blocker?: {
    getStats: () => Promise<{ enabled: boolean; totalBlocked: number; rulesCount?: number }>;
    toggle: (enabled: boolean) => Promise<boolean>;
  };
  system: {
    getConfig: () => Promise<any>;
    setFeature: (name: string, enabled: boolean) => Promise<any>;
    setSetting: (key: string, value: any) => Promise<any>;
    getMemory: () => Promise<any>;
    getDetailedMemory: () => Promise<any>;
    forceHibernate: () => Promise<any>;
  };
  on: (channel: string, listener: (...args: any[]) => void) => () => void;
}

declare global {
  interface Window {
    chrome?: ChromeAPI;
    chromeLite?: ChromeAPI;
    chromeAPI?: ChromeAPI;
    api?: ChromeAPI;
  }
}
