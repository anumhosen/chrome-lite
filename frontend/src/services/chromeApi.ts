import { getChromeAPI } from '../lib/chrome';
import type {
  ChromeAPI,
  ChromeTab,
  ChromeBookmarkItem,
  ChromeHistoryItem,
  ChromeDownloadItem,
  ChromeNotebookResult,
} from '../types/chrome';

/**
 * Type-safe, centralized Chrome Lite API Service Client.
 * Automatically accesses the exposed Electron bridge (`chromeLite`, `chromeAPI`, or `api`)
 * and provides safe fallbacks when running in standalone browser preview mode.
 */
export const chromeApi = {
  /**
   * Check if the Chrome Lite Electron API bridge is available.
   */
  isAvailable(): boolean {
    return Boolean(getChromeAPI());
  },

  /**
   * Retrieve the underlying ChromeAPI instance directly.
   */
  raw(): ChromeAPI | undefined {
    return getChromeAPI();
  },

  /**
   * Tab management subsystem
   */
  tabs: {
    async create(options?: { url?: string; active?: boolean }): Promise<ChromeTab> {
      const api = getChromeAPI();
      if (!api?.tabs?.create) {
        return {
          id: `tab_${Date.now()}`,
          title: 'New Tab',
          url: options?.url || 'https://google.com',
          isLoading: false,
        };
      }
      return api.tabs.create(options);
    },

    async close(tabId: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.tabs?.close) {
        await api.tabs.close(tabId);
      }
    },

    async activate(tabId: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.tabs?.activate) {
        await api.tabs.activate(tabId);
      }
    },

    async navigate(tabId: string, url: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.tabs?.navigate) {
        await api.tabs.navigate(tabId, url);
      }
    },

    async goBack(tabId: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.tabs?.goBack) {
        await api.tabs.goBack(tabId);
      }
    },

    async goForward(tabId: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.tabs?.goForward) {
        await api.tabs.goForward(tabId);
      }
    },

    async reload(tabId: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.tabs?.reload) {
        await api.tabs.reload(tabId);
      }
    },

    async stop(tabId: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.tabs?.stop) {
        await api.tabs.stop(tabId);
      }
    },

    async bindContents(tabId: string, contentsId: number): Promise<void> {
      const api = getChromeAPI();
      if (api?.tabs?.bindContents) {
        await api.tabs.bindContents(tabId, contentsId);
      }
    },

    async getAll(workspaceId?: string): Promise<ChromeTab[]> {
      const api = getChromeAPI();
      if (!api?.tabs?.getAll) return [];
      return (await api.tabs.getAll(workspaceId)) || [];
    },

    async getActive(): Promise<ChromeTab | null> {
      const api = getChromeAPI();
      if (!api?.tabs?.getActive) return null;
      return (await api.tabs.getActive()) || null;
    },
  },

  /**
   * Window controls and popouts
   */
  window: {
    async minimize(): Promise<void> {
      const api = getChromeAPI();
      if (api?.window?.minimize) await api.window.minimize();
    },

    async maximize(): Promise<void> {
      const api = getChromeAPI();
      if (api?.window?.maximize) await api.window.maximize();
    },

    async close(): Promise<void> {
      const api = getChromeAPI();
      if (api?.window?.close) await api.window.close();
    },

    async isMaximized(): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.window?.isMaximized) return false;
      return api.window.isMaximized();
    },

    async openFloating(panel: string, targetTabId?: string | null): Promise<{ success: boolean; panel?: string }> {
      const api = getChromeAPI();
      if (!api?.window?.openFloating) return { success: false };
      return api.window.openFloating(panel, targetTabId);
    },

    async toggleDevTools(): Promise<void> {
      const api = getChromeAPI();
      if (api?.window?.toggleDevTools) await api.window.toggleDevTools();
    },
  },

  /**
   * System settings and hardware memory stats
   */
  system: {
    async getConfig(): Promise<any> {
      const api = getChromeAPI();
      if (!api?.system?.getConfig) return {};
      return (await api.system.getConfig()) || {};
    },

    async setFeature(name: string, enabled: boolean): Promise<any> {
      const api = getChromeAPI();
      if (!api?.system?.setFeature) return;
      return api.system.setFeature(name, enabled);
    },

    async setSetting(key: string, value: any): Promise<any> {
      const api = getChromeAPI();
      if (!api?.system?.setSetting) return;
      return api.system.setSetting(key, value);
    },

    async getMemory(): Promise<any> {
      const api = getChromeAPI();
      if (!api?.system?.getMemory) return null;
      return api.system.getMemory();
    },

    async getDetailedMemory(): Promise<any> {
      const api = getChromeAPI();
      if (!api?.system?.getDetailedMemory) return null;
      return api.system.getDetailedMemory();
    },

    async forceHibernate(): Promise<any> {
      const api = getChromeAPI();
      if (!api?.system?.forceHibernate) return null;
      return api.system.forceHibernate();
    },
  },

  /**
   * Interceptor & Mock Rules subsystem
   */
  interceptor: {
    async getRequests(limit: number = 100): Promise<any[]> {
      const api = getChromeAPI();
      if (!api?.interceptor?.getRequests) return [];
      return (await api.interceptor.getRequests(limit)) || [];
    },

    async replay(requestId: string): Promise<any> {
      const api = getChromeAPI();
      if (!api?.interceptor?.replay) return;
      return api.interceptor.replay(requestId);
    },

    async clear(): Promise<void> {
      const api = getChromeAPI();
      if (api?.interceptor?.clear) {
        await api.interceptor.clear();
      }
    },

    async getMockRules(): Promise<any[]> {
      const api = getChromeAPI();
      if (!api?.interceptor?.getMockRules) return [];
      return (await api.interceptor.getMockRules()) || [];
    },

    async saveMockRule(rule: any): Promise<any> {
      const api = getChromeAPI();
      if (!api?.interceptor?.saveMockRule) return;
      return api.interceptor.saveMockRule(rule);
    },

    async deleteMockRule(id: string): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.interceptor?.deleteMockRule) return false;
      return api.interceptor.deleteMockRule(id);
    },

    async toggleMockRule(id: string, enabled: boolean): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.interceptor?.toggleMockRule) return false;
      return api.interceptor.toggleMockRule(id, enabled);
    },

    async generateOpenApi(domainFilter?: string): Promise<any> {
      const api = getChromeAPI();
      if (!api?.interceptor?.generateOpenApi) return null;
      return api.interceptor.generateOpenApi(domainFilter);
    },
  },

  /**
   * Automation and Scheduler subsystem
   */
  automation: {
    async getFlows(): Promise<any[]> {
      const api = getChromeAPI();
      if (!api?.automation?.getFlows) return [];
      return (await api.automation.getFlows()) || [];
    },

    async saveFlow(flow: any): Promise<any> {
      const api = getChromeAPI();
      if (!api?.automation?.saveFlow) return null;
      return api.automation.saveFlow(flow);
    },

    async deleteFlow(id: string): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.automation?.deleteFlow) return false;
      return api.automation.deleteFlow(id);
    },

    async runFlow(tabId: string, flow: any): Promise<any> {
      const api = getChromeAPI();
      if (!api?.automation?.runFlow) return null;
      return api.automation.runFlow(tabId, flow);
    },

    async runFlowHeadless(flow: any, initialUrl?: string): Promise<any> {
      const api = getChromeAPI();
      if (!api?.automation?.runFlowHeadless) return null;
      return api.automation.runFlowHeadless(flow, initialUrl);
    },

    async startRecorder(tabId: string): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.automation?.startRecorder) return false;
      return api.automation.startRecorder(tabId);
    },

    async stopRecorder(tabId: string): Promise<any[]> {
      const api = getChromeAPI();
      if (!api?.automation?.stopRecorder) return [];
      return (await api.automation.stopRecorder(tabId)) || [];
    },

    async exportFlow(flow: any): Promise<any> {
      const api = getChromeAPI();
      if (!api?.automation?.exportFlow) return null;
      return api.automation.exportFlow(flow);
    },

    async exportPlaywright(flow: any): Promise<string> {
      const api = getChromeAPI();
      if (!api?.automation?.exportPlaywright) return '';
      return (await api.automation.exportPlaywright(flow)) || '';
    },

    async getTasks(): Promise<any[]> {
      const api = getChromeAPI();
      if (!api?.automation?.getTasks) return [];
      return (await api.automation.getTasks()) || [];
    },

    async saveTask(task: any): Promise<any> {
      const api = getChromeAPI();
      if (!api?.automation?.saveTask) return null;
      return api.automation.saveTask(task);
    },

    async deleteTask(id: string): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.automation?.deleteTask) return false;
      return api.automation.deleteTask(id);
    },

    async runTaskNow(id: string): Promise<any> {
      const api = getChromeAPI();
      if (!api?.automation?.runTaskNow) return null;
      return api.automation.runTaskNow(id);
    },

    async getTaskLogs(taskId: string, limit?: number): Promise<any[]> {
      const api = getChromeAPI();
      if (!api?.automation?.getTaskLogs) return [];
      return (await api.automation.getTaskLogs(taskId, limit)) || [];
    },

    async testWebhook(url: string): Promise<{ success: boolean; status?: number; error?: string }> {
      const api = getChromeAPI();
      if (!api?.automation?.testWebhook) return { success: false, error: 'API unavailable' };
      return api.automation.testWebhook(url);
    },

    onProgress(callback: (data: any) => void): () => void {
      const api = getChromeAPI();
      if (!api?.automation?.onProgress) return () => {};
      return api.automation.onProgress(callback);
    },

    onTaskUpdated(callback: (data: any) => void): () => void {
      const api = getChromeAPI();
      if (!api?.automation?.onTaskUpdated) return () => {};
      return api.automation.onTaskUpdated(callback);
    },
  },

  /**
   * Browsing history
   */
  history: {
    async get(limit: number = 100): Promise<ChromeHistoryItem[]> {
      const api = getChromeAPI();
      if (!api?.history?.get) return [];
      return (await api.history.get(limit)) || [];
    },

    async clear(): Promise<void> {
      const api = getChromeAPI();
      if (api?.history?.clear) await api.history.clear();
    },

    async remove(id: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.history?.remove) await api.history.remove(id);
    },

    async clearCache(): Promise<void> {
      const api = getChromeAPI();
      if (api?.history?.clearCache) await api.history.clearCache();
    },

    async clearStorage(): Promise<void> {
      const api = getChromeAPI();
      if (api?.history?.clearStorage) await api.history.clearStorage();
    },
  },

  /**
   * Bookmarks management
   */
  bookmarks: {
    async get(wsId?: string): Promise<ChromeBookmarkItem[]> {
      const api = getChromeAPI();
      if (!api?.bookmarks?.get) return [];
      return (await api.bookmarks.get(wsId)) || [];
    },

    async add(data: { title: string; url: string }): Promise<ChromeBookmarkItem | null> {
      const api = getChromeAPI();
      if (!api?.bookmarks?.add) return null;
      return api.bookmarks.add(data);
    },

    async remove(id: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.bookmarks?.remove) await api.bookmarks.remove(id);
    },

    async check(url: string): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.bookmarks?.check) return false;
      return api.bookmarks.check(url);
    },
  },

  /**
   * Downloads manager
   */
  downloads: {
    async get(limit: number = 50): Promise<ChromeDownloadItem[]> {
      const api = getChromeAPI();
      if (!api?.downloads?.get) return [];
      return (await api.downloads.get(limit)) || [];
    },

    async getQueue(): Promise<ChromeDownloadItem[]> {
      const api = getChromeAPI();
      if (!api?.downloads?.getQueue) return [];
      return (await api.downloads.getQueue()) || [];
    },

    async clearQueue(): Promise<void> {
      const api = getChromeAPI();
      if (api?.downloads?.clearQueue) await api.downloads.clearQueue();
    },

    async batchQueue(assets: any[]): Promise<void> {
      const api = getChromeAPI();
      if (api?.downloads?.batchQueue) await api.downloads.batchQueue(assets);
    },

    async openFile(filePath: string): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.downloads?.openFile) return false;
      return api.downloads.openFile(filePath);
    },

    async showItem(filePath: string): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.downloads?.showItem) return false;
      return api.downloads.showItem(filePath);
    },
  },

  /**
   * Notebook execution & storage
   */
  notebook: {
    async execute(tabId: string, code: string, opts?: any): Promise<ChromeNotebookResult | null> {
      const api = getChromeAPI();
      if (!api?.notebook?.execute) return null;
      return api.notebook.execute(tabId, code, opts);
    },

    async save(notebook: any): Promise<any> {
      const api = getChromeAPI();
      if (!api?.notebook?.save) return null;
      return api.notebook.save(notebook);
    },

    async listLibrary(): Promise<{ name: string; size: number }[]> {
      const api = getChromeAPI();
      if (!api?.notebook?.listLibrary) return [];
      return (await api.notebook.listLibrary()) || [];
    },

    async openFile(filePath: string): Promise<{ content: string } | null> {
      const api = getChromeAPI();
      if (!api?.notebook?.openFile) return null;
      return api.notebook.openFile(filePath);
    },

    async saveFile(filePath: string, content: string): Promise<void> {
      const api = getChromeAPI();
      if (api?.notebook?.saveFile) await api.notebook.saveFile(filePath, content);
    },

    async chooseFileOpen(): Promise<{ canceled?: boolean; filePath?: string; content?: string }> {
      const api = getChromeAPI();
      if (!api?.notebook?.chooseFileOpen) return { canceled: true };
      return api.notebook.chooseFileOpen();
    },

    async chooseFileSave(content: string, defaultPath?: string): Promise<{ canceled?: boolean; filePath?: string; success?: boolean }> {
      const api = getChromeAPI();
      if (!api?.notebook?.chooseFileSave) return { canceled: true };
      return api.notebook.chooseFileSave(content, defaultPath);
    },

    async openFloating(): Promise<void> {
      const api = getChromeAPI();
      if (api?.notebook?.openFloating) await api.notebook.openFloating();
    },
  },

  /**
   * Ad & tracker blocker
   */
  blocker: {
    async getStats(): Promise<{ enabled: boolean; totalBlocked: number; rulesCount?: number }> {
      const api = getChromeAPI();
      if (!api?.blocker?.getStats) return { enabled: true, totalBlocked: 0 };
      return api.blocker.getStats();
    },

    async toggle(enabled: boolean): Promise<boolean> {
      const api = getChromeAPI();
      if (!api?.blocker?.toggle) return enabled;
      return api.blocker.toggle(enabled);
    },
  },

  /**
   * Event listener subscription helper
   */
  on(channel: string, listener: (...args: any[]) => void): () => void {
    const api = getChromeAPI();
    if (!api?.on) return () => {};
    return api.on(channel, listener);
  },
};
