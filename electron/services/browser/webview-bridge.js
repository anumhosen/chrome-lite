const { app } = require("electron");
const logger = require("../logger").forSubsystem("WebViewBridge");
const tabManager = require("./tab-manager");

class WebViewBridge {
  constructor() {
    this.webContentsMap = new Map(); // tabId -> webContents
    this.contentsToTabMap = new Map(); // contents.id -> tabId
    this.mainWindow = null;
    this.eventHooks = {
      onNavigate: [],
      onTitleUpdate: [],
      onFaviconUpdate: [],
      onLoadingState: [],
      onNewWindow: []
    };
  }

  init(mainWindow) {
    this.mainWindow = mainWindow;

    app.on("web-contents-created", (event, contents) => {
      if (contents.getType() === "webview") {
        this.setupWebViewContents(contents);
      }
    });

    logger.info("WebView bridge initialized");
  }

  registerHook(eventName, callback) {
    if (this.eventHooks[eventName]) {
      this.eventHooks[eventName].push(callback);
    }
  }

  bindTabToContents(tabId, contents) {
    this.webContentsMap.set(tabId, contents);
    this.contentsToTabMap.set(contents.id, tabId);
    try {
      const url = contents.getURL();
      const title = contents.getTitle();
      if (url && url !== "about:blank") {
        tabManager.updateTab(tabId, { url, title: title || url });
        this.notifyRenderer("chrome:tab-updated", { tabId, url, title });
      }
    } catch { }
    logger.debug(`Bound tab ${tabId} to webContents ${contents.id}`);
  }

  unbindTab(tabId) {
    const contents = this.webContentsMap.get(tabId);
    if (contents) {
      this.contentsToTabMap.delete(contents.id);
      this.webContentsMap.delete(tabId);
    }
  }

  getContents(tabId) {
    return this.webContentsMap.get(tabId) || null;
  }

  setupWebViewContents(contents) {
    // Intercept window.open / popups and route them into tabs
    contents.setWindowOpenHandler(({ url }) => {
      for (const hook of this.eventHooks.onNewWindow) {
        hook(url);
      }
      return { action: "deny" };
    });

    contents.on("did-start-loading", () => {
      const tabId = this.contentsToTabMap.get(contents.id);
      if (tabId) {
        tabManager.updateTab(tabId, { isLoading: true });
        this.notifyRenderer("chrome:tab-updated", { tabId, isLoading: true });
      }
    });

    contents.on("did-stop-loading", () => {
      const tabId = this.contentsToTabMap.get(contents.id);
      if (tabId) {
        tabManager.updateTab(tabId, {
          isLoading: false,
          canGoBack: contents.canGoBack(),
          canGoForward: contents.canGoForward()
        });
        this.notifyRenderer("chrome:tab-updated", {
          tabId,
          isLoading: false,
          canGoBack: contents.canGoBack(),
          canGoForward: contents.canGoForward()
        });
      }
    });

    contents.on("did-navigate", (event, url) => {
      const tabId = this.contentsToTabMap.get(contents.id);
      if (tabId) {
        const title = contents.getTitle() || url;
        tabManager.updateTab(tabId, { url, title });
        this.notifyRenderer("chrome:tab-updated", { tabId, url, title });

        for (const hook of this.eventHooks.onNavigate) {
          hook(tabId, url, title);
        }
      }
    });

    contents.on("did-navigate-in-page", (event, url) => {
      const tabId = this.contentsToTabMap.get(contents.id);
      if (tabId) {
        const title = contents.getTitle() || url;
        tabManager.updateTab(tabId, { url, title });
        this.notifyRenderer("chrome:tab-updated", { tabId, url, title });

        for (const hook of this.eventHooks.onNavigate) {
          hook(tabId, url, title);
        }
      }
    });

    contents.on("page-title-updated", (event, title) => {
      const tabId = this.contentsToTabMap.get(contents.id);
      if (tabId) {
        tabManager.updateTab(tabId, { title });
        this.notifyRenderer("chrome:tab-updated", { tabId, title });

        for (const hook of this.eventHooks.onTitleUpdate) {
          hook(tabId, title);
        }
      }
    });

    contents.on("page-favicon-updated", (event, favicons) => {
      const tabId = this.contentsToTabMap.get(contents.id);
      if (tabId && favicons && favicons.length > 0) {
        const favicon = favicons[0];
        tabManager.updateTab(tabId, { favicon });
        this.notifyRenderer("chrome:tab-updated", { tabId, favicon });

        for (const hook of this.eventHooks.onFaviconUpdate) {
          hook(tabId, favicon);
        }
      }
    });

    contents.on("console-message", (event, level, message, line, sourceId) => {
      const tabId = this.contentsToTabMap.get(contents.id);
      if (tabId) {
        this.notifyRenderer("chrome:console-message", {
          tabId,
          level,
          message,
          line,
          sourceId,
          timestamp: Date.now()
        });
      }
    });
  }

  notifyRenderer(channel, data) {
    const { BrowserWindow } = require("electron");
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (win && !win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    }
  }
}

module.exports = new WebViewBridge();
