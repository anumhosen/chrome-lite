const tabManager = require("./tab-manager");
const webviewBridge = require("./webview-bridge");
const db = require("../database");
const config = require("../config");
const logger = require("../logger").forSubsystem("BrowserService");
const { webContents } = require("electron");

function getChromeTabTitle(url) {
  if (!url || !url.startsWith("chrome://")) return undefined;
  const page = url.replace("chrome://", "").split("/")[0].toLowerCase();
  const TITLES = {
    newtab: "New Tab",
    home: "New Tab",
    extensions: "Extensions",
    apps: "Chrome Apps",
    settings: "Settings",
    history: "History",
    downloads: "Downloads",
    bookmarks: "Bookmarks",
    notebook: "Chrome Notebook",
    explorer: "Resource Explorer",
    interceptor: "API Inspector",
    userscripts: "Userscripts Manager",
    scraper: "Scraper Builder",
    "scraper-builder": "Scraper Builder",
    memory: "System Performance",
    system: "System Performance",
    console: "Developer Console"
  };
  return TITLES[page] || (page.charAt(0).toUpperCase() + page.slice(1));
}

class BrowserService {
  constructor() {
    this.mainWindow = null;
    this.hibernationInterval = null;
  }

  init(mainWindow) {
    this.mainWindow = mainWindow;
    webviewBridge.init(mainWindow);

    // Auto-create a new tab when window.open is intercepted
    webviewBridge.registerHook("onNewWindow", (url) => {
      this.createTab({ url, active: true });
    });

    // Start background hibernation timer if lowRamMode is enabled
    if (config.get("lowRamMode", true)) {
      const minutes = config.get("maxInactiveTabMinutes", 15);
      this.hibernationInterval = setInterval(() => {
        tabManager.hibernateInactiveTabs(minutes * 60 * 1000);
      }, 60 * 1000);
    }

    logger.info("Browser service initialized");
  }

  createTab(options = {}) {
    const tab = tabManager.createTab(options);
    webviewBridge.notifyRenderer("chrome:tab-created", tab);
    if (options.active !== false) {
      this.activateTab(tab.id);
    }
    return tab;
  }

  closeTab(tabId) {
    webviewBridge.unbindTab(tabId);
    const result = tabManager.closeTab(tabId);
    if (result) {
      webviewBridge.notifyRenderer("chrome:tab-closed", result);
    }
    return result;
  }

  activateTab(tabId) {
    const tab = tabManager.activateTab(tabId);
    if (tab) {
      webviewBridge.notifyRenderer("chrome:tab-activated", tab);
    }
    return tab;
  }

  navigate(tabId, targetUrl) {
    let url = targetUrl.trim();
    if (url.startsWith("chrome://")) {
      url = "chrome://" + url.slice(9);
    }
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("file://") && !url.startsWith("chrome://") && !url.startsWith("about:")) {
      if (url.includes(".") && !url.includes(" ")) {
        url = "https://" + url;
      } else {
        const searchEngine = config.get("defaultSearchEngine", "https://www.google.com/search?q=");
        url = searchEngine + encodeURIComponent(url);
      }
    }

    const contents = webviewBridge.getContents(tabId);
    let navigatedViaContents = false;
    if (contents && !url.startsWith("chrome://")) {
      navigatedViaContents = true;
      contents.loadURL(url).catch((err) => {
        if (err && err.code !== "ERR_ABORTED" && err.errno !== -3) {
          logger.warn(`Navigation error for tab ${tabId}: ${err.message}`);
        }
      });
    }

    let chromeTitle = undefined;
    if (url.startsWith("chrome://")) {
      chromeTitle = getChromeTabTitle(url);
    }

    const updates = { url };
    if (chromeTitle) updates.title = chromeTitle;

    tabManager.updateTab(tabId, updates);
    webviewBridge.notifyRenderer("chrome:tab-navigated", { tabId, url, title: chromeTitle, navigatedViaContents });
    return url;
  }

  goBack(tabId) {
    const contents = webviewBridge.getContents(tabId);
    if (contents && contents.canGoBack()) {
      contents.goBack();
    }
  }

  goForward(tabId) {
    const contents = webviewBridge.getContents(tabId);
    if (contents && contents.canGoForward()) {
      contents.goForward();
    }
  }

  reload(tabId) {
    const tab = tabManager.getTab(tabId);
    if (tab && tab.url && tab.url.startsWith("chrome://")) {
      const chromeTitle = getChromeTabTitle(tab.url);
      webviewBridge.notifyRenderer("chrome:tab-updated", { tabId, url: tab.url, title: chromeTitle || tab.title });
      return;
    }
    const contents = webviewBridge.getContents(tabId);
    if (contents) {
      contents.reload();
    }
  }

  stop(tabId) {
    const contents = webviewBridge.getContents(tabId);
    if (contents) {
      contents.stop();
    }
  }

  bindTabContents(tabId, contentsId) {
    const targetContents = webContents.fromId(contentsId);
    if (targetContents) {
      webviewBridge.bindTabToContents(tabId, targetContents);
    }
  }

  getTabs(workspaceId) {
    const wsId = workspaceId || tabManager.activeWorkspaceId;
    return tabManager.getTabsForWorkspace(wsId);
  }

  getActiveTab() {
    return tabManager.getActiveTab();
  }

  async saveSession(workspaceId) {
    try {
      const state = tabManager.serializeState(workspaceId);
      await db.run(
        `INSERT INTO sessions (id, workspace_id, tab_state, updated_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET tab_state=excluded.tab_state, updated_at=CURRENT_TIMESTAMP`,
        [`session_${workspaceId}`, workspaceId, state]
      );
      logger.info(`Session saved for workspace ${workspaceId}`);
    } catch (err) {
      logger.error("Failed to save session:", err.message);
    }
  }

  async restoreSession(workspaceId) {
    try {
      const row = await db.get(`SELECT tab_state FROM sessions WHERE workspace_id = ?`, [workspaceId]);
      if (row && row.tab_state) {
        return tabManager.restoreState(row.tab_state);
      }
    } catch (err) {
      logger.error("Failed to restore session:", err.message);
    }
    return [];
  }

  destroy() {
    if (this.hibernationInterval) {
      clearInterval(this.hibernationInterval);
    }
  }
}

module.exports = new BrowserService();
