const { contextBridge, ipcRenderer } = require("electron");

const VALID_CHANNELS = [
  "chrome:tab-created",
  "chrome:tab-closed",
  "chrome:tab-activated",
  "chrome:tab-updated",
  "chrome:tab-navigated",
  "chrome:download-started",
  "chrome:download-progress",
  "chrome:download-done",
  "chrome:network-request",
  "chrome:network-response",
  "chrome:window:maximized-change",
  "chrome:theme-changed",
  "chrome:console-message",
  "chrome:tab-bound",
  "chrome:automation:progress",
  "chrome:automation:task-updated"
];

const chromeLiteApi = {
  version: "0.2.0",

  tabs: {
    create: (options) => ipcRenderer.invoke("chrome:tab:create", options),
    close: (tabId) => ipcRenderer.invoke("chrome:tab:close", tabId),
    activate: (tabId) => ipcRenderer.invoke("chrome:tab:activate", tabId),
    navigate: (tabId, url) => ipcRenderer.invoke("chrome:tab:navigate", { tabId, url }),
    goBack: (tabId) => ipcRenderer.invoke("chrome:tab:back", tabId),
    goForward: (tabId) => ipcRenderer.invoke("chrome:tab:forward", tabId),
    reload: (tabId) => ipcRenderer.invoke("chrome:tab:reload", tabId),
    stop: (tabId) => ipcRenderer.invoke("chrome:tab:stop", tabId),
    bindContents: (tabId, contentsId) => ipcRenderer.invoke("chrome:tab:bind-contents", { tabId, contentsId }),
    getAll: (workspaceId) => ipcRenderer.invoke("chrome:tab:get-all", workspaceId),
    getActive: () => ipcRenderer.invoke("chrome:tab:get-active")
  },

  workspaces: {
    getAll: () => ipcRenderer.invoke("chrome:workspace:get-all"),
    create: (data) => ipcRenderer.invoke("chrome:workspace:create", data),
    switch: (workspaceId) => ipcRenderer.invoke("chrome:workspace:switch", workspaceId)
  },

  profiles: {
    getAll: () => ipcRenderer.invoke("chrome:profile:get-all"),
    create: (data) => ipcRenderer.invoke("chrome:profile:create", data)
  },

  bookmarks: {
    get: (wsId) => ipcRenderer.invoke("chrome:bookmarks:get", wsId),
    add: (data) => ipcRenderer.invoke("chrome:bookmarks:add", data),
    remove: (id) => ipcRenderer.invoke("chrome:bookmarks:remove", id),
    check: (url) => ipcRenderer.invoke("chrome:bookmarks:check", url)
  },

  history: {
    get: (limit) => ipcRenderer.invoke("chrome:history:get", limit),
    clear: () => ipcRenderer.invoke("chrome:history:clear"),
    toggle: (enabled) => ipcRenderer.invoke("chrome:history:toggle", enabled),
    clearCache: () => ipcRenderer.invoke("chrome:history:clear-cache"),
    clearStorage: () => ipcRenderer.invoke("chrome:history:clear-storage")
  },

  downloads: {
    get: (limit) => ipcRenderer.invoke("chrome:downloads:get", limit),
    queueAsset: (asset) => ipcRenderer.invoke("chrome:downloads:queue-asset", asset),
    batchQueue: (assets) => ipcRenderer.invoke("chrome:downloads:batch-queue", assets),
    getQueue: () => ipcRenderer.invoke("chrome:downloads:get-queue"),
    clearQueue: () => ipcRenderer.invoke("chrome:downloads:clear-queue"),
    openFile: (filePath) => ipcRenderer.invoke("chrome:downloads:open-file", filePath),
    showItem: (filePath) => ipcRenderer.invoke("chrome:downloads:show-item", filePath)
  },

  notebook: {
    execute: (tabIdOrObj, code, cellId) =>
      ipcRenderer.invoke(
        "chrome:notebook:execute",
        typeof tabIdOrObj === "object" ? tabIdOrObj : { tabId: tabIdOrObj, code, cellId }
      ),
    save: (notebook) => ipcRenderer.invoke("chrome:notebook:save", notebook),
    listLibrary: () => ipcRenderer.invoke("chrome:notebook:list-library"),
    load: (id) => ipcRenderer.invoke("chrome:notebook:load", id),
    getHistory: (limit) => ipcRenderer.invoke("chrome:notebook:get-history", limit),
    openFile: (filePath) => ipcRenderer.invoke("chrome:notebook:open-file", filePath),
    saveFile: (filePath, content) => ipcRenderer.invoke("chrome:notebook:save-file", { filePath, content }),
    chooseFileOpen: () => ipcRenderer.invoke("chrome:notebook:choose-file-open"),
    chooseFileSave: (content, defaultPath) => ipcRenderer.invoke("chrome:notebook:choose-file-save", content, defaultPath),
    openFloating: () => ipcRenderer.invoke("chrome:notebook:open-floating")
  },

  explorer: {
    getAssets: (filter) => ipcRenderer.invoke("chrome:explorer:get-assets", filter),
    scanPage: (tabId) => ipcRenderer.invoke("chrome:explorer:scan-page", tabId),
    getPreview: (assetId) => ipcRenderer.invoke("chrome:explorer:get-preview", assetId),
    exportAssets: (format, filter) => ipcRenderer.invoke("chrome:explorer:export-assets", { format, filter })
  },

  userscripts: {
    getAll: () => ipcRenderer.invoke("chrome:userscripts:get-all"),
    save: (script) => ipcRenderer.invoke("chrome:userscripts:save", script),
    toggle: (id, enabled) => ipcRenderer.invoke("chrome:userscripts:toggle", { id, enabled }),
    delete: (id) => ipcRenderer.invoke("chrome:userscripts:delete", id)
  },

  scraperBuilder: {
    detectPagination: (tabId) => ipcRenderer.invoke("chrome:scraper-builder:detect-pagination", tabId),
    saveWorkflow: (data) => ipcRenderer.invoke("chrome:scraper-builder:save-workflow", data)
  },

  blocker: {
    getStats: () => ipcRenderer.invoke("chrome:blocker:get-stats"),
    toggle: (enabled) => ipcRenderer.invoke("chrome:blocker:toggle", enabled)
  },

  interceptor: {
    getRequests: (limit) => ipcRenderer.invoke("chrome:interceptor:get-requests", limit),
    replay: (requestId) => ipcRenderer.invoke("chrome:interceptor:replay", requestId),
    clear: () => ipcRenderer.invoke("chrome:interceptor:clear"),
    getMockRules: () => ipcRenderer.invoke("chrome:interceptor:get-mock-rules"),
    saveMockRule: (rule) => ipcRenderer.invoke("chrome:interceptor:save-mock-rule", rule),
    deleteMockRule: (id) => ipcRenderer.invoke("chrome:interceptor:delete-mock-rule", id),
    toggleMockRule: (id, enabled) => ipcRenderer.invoke("chrome:interceptor:toggle-mock-rule", { id, enabled }),
    generateOpenApi: (domainFilter) => ipcRenderer.invoke("chrome:interceptor:generate-openapi", domainFilter)
  },

  cookies: {
    get: (filter) => ipcRenderer.invoke("chrome:cookies:get", filter),
    export: () => ipcRenderer.invoke("chrome:cookies:export"),
    remove: (url, name) => ipcRenderer.invoke("chrome:cookies:remove", { url, name })
  },

  scraper: {
    extract: (tabId, selector, isTable = false) => ipcRenderer.invoke("chrome:scraper:extract", { tabId, selector, isTable }),
    startPicker: (tabId) => ipcRenderer.invoke("chrome:scraper:start-picker", tabId),
    save: (url, selector, data) => ipcRenderer.invoke("chrome:scraper:save", { url, selector, data }),
    exportFile: (data, format, filename) => ipcRenderer.invoke("chrome:scraper:export-file", { data, format, filename }),
    getHistory: (limit) => ipcRenderer.invoke("chrome:scraper:get-history", limit)
  },

  automation: {
    getFlows: () => ipcRenderer.invoke("chrome:automation:get-flows"),
    saveFlow: (flow) => ipcRenderer.invoke("chrome:automation:save-flow", flow),
    deleteFlow: (id) => ipcRenderer.invoke("chrome:automation:delete-flow", id),
    runFlow: (tabId, flow) => ipcRenderer.invoke("chrome:automation:run-flow", { tabId, flow }),
    startRecorder: (tabId) => ipcRenderer.invoke("chrome:automation:start-recorder", tabId),
    stopRecorder: (tabId) => ipcRenderer.invoke("chrome:automation:stop-recorder", tabId),
    exportFlow: (flow) => ipcRenderer.invoke("chrome:automation:export-flow", flow),
    exportPlaywright: (flow) => ipcRenderer.invoke("chrome:automation:export-playwright", flow),
    getTasks: () => ipcRenderer.invoke("chrome:automation:get-tasks"),
    saveTask: (task) => ipcRenderer.invoke("chrome:automation:save-task", task),
    deleteTask: (id) => ipcRenderer.invoke("chrome:automation:delete-task", id),
    runTaskNow: (id) => ipcRenderer.invoke("chrome:automation:run-task-now", id),
    runFlowHeadless: (flow, initialUrl) => ipcRenderer.invoke("chrome:automation:run-flow-headless", { flow, initialUrl }),
    getTaskLogs: (taskId, limit) => ipcRenderer.invoke("chrome:automation:get-task-logs", { taskId, limit }),
    testWebhook: (url) => ipcRenderer.invoke("chrome:automation:test-webhook", url),
    onProgress: (callback) => {
      const handler = (event, data) => callback(data);
      ipcRenderer.on("chrome:automation:progress", handler);
      return () => ipcRenderer.removeListener("chrome:automation:progress", handler);
    },
    onTaskUpdated: (callback) => {
      const handler = (event, data) => callback(data);
      ipcRenderer.on("chrome:automation:task-updated", handler);
      return () => ipcRenderer.removeListener("chrome:automation:task-updated", handler);
    }
  },

  system: {
    getConfig: () => ipcRenderer.invoke("chrome:system:get-config"),
    setFeature: (name, enabled) => ipcRenderer.invoke("chrome:system:set-feature", { name, enabled }),
    setSetting: (key, value) => ipcRenderer.invoke("chrome:system:set-setting", { key, value }),
    getMemory: () => ipcRenderer.invoke("chrome:system:get-memory"),
    getDetailedMemory: () => ipcRenderer.invoke("chrome:system:get-detailed-memory"),
    forceHibernate: () => ipcRenderer.invoke("chrome:system:force-hibernate")
  },

  window: {
    minimize: () => ipcRenderer.invoke("chrome:window:minimize"),
    maximize: () => ipcRenderer.invoke("chrome:window:maximize"),
    close: () => ipcRenderer.invoke("chrome:window:close"),
    isMaximized: () => ipcRenderer.invoke("chrome:window:is-maximized"),
    openFloating: (panel, targetTabId) => ipcRenderer.invoke("chrome:window:open-floating", panel, targetTabId),
    toggleDevTools: () => ipcRenderer.invoke("chrome:window:toggle-devtools")
  },

  on: (channel, listener) => {
    if (VALID_CHANNELS.includes(channel)) {
      const wrapped = (event, ...args) => listener(...args);
      ipcRenderer.on(channel, wrapped);
      return () => ipcRenderer.removeListener(channel, wrapped);
    }
    return () => { };
  }
};

try {
  contextBridge.exposeInMainWorld("chromeLite", chromeLiteApi);
} catch (err) {
  console.error("Failed to expose chromeLite:", err);
}

try {
  contextBridge.exposeInMainWorld("chromeAPI", chromeLiteApi);
} catch (err) {
  console.error("Failed to expose chromeAPI:", err);
}

try {
  contextBridge.exposeInMainWorld("api", chromeLiteApi);
} catch (err) {
  console.error("Failed to expose api:", err);
}

try {
  contextBridge.exposeInMainWorld("chrome", chromeLiteApi);
} catch (err) {
  // Expected in Chromium: window.chrome already exists
}