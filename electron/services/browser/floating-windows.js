const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const logger = require("../logger").forSubsystem("FloatingWindows");

function isDevServerRunning(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const req = http.request(
        {
          hostname: parsed.hostname || "127.0.0.1",
          port: parsed.port || 5173,
          path: "/",
          method: "HEAD",
          timeout: 250
        },
        () => resolve(true)
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

const PANEL_TITLES = {
  notebook: "Chrome Notebook",
  history: "Browsing History",
  downloads: "Downloads Manager",
  bookmarks: "Bookmarks",
  settings: "Browser Settings",
  cookies: "Cookie Jar",
  explorer: "Resource Explorer",
  interceptor: "Network Inspector",
  userscripts: "Userscripts Manager",
  scraperBuilder: "Scraper Builder",
  memory: "System Performance",
  console: "Developer Console"
};

const config = require("../config");

class FloatingWindowManager {
  constructor() {
    this.windows = new Map(); // panelName -> BrowserWindow
  }

  async openFloatingWindow(panelName = "notebook", targetTabId = null) {
    if (this.windows.has(panelName)) {
      const existing = this.windows.get(panelName);
      if (existing && !existing.isDestroyed()) {
        existing.show();
        existing.focus();
        if (targetTabId) {
          existing.webContents.send("chrome:tab-bound", targetTabId);
        }
        return existing;
      }
    }

    const title = PANEL_TITLES[panelName] || `Chrome ${panelName.charAt(0).toUpperCase() + panelName.slice(1)}`;
    const preloadPath = path.join(__dirname, "../../preload.js");
    const iconPath = path.join(__dirname, "../../assets/icon.png");
    const isLight = config.get("theme", "dark") === "light";

    const win = new BrowserWindow({
      width: 950,
      height: 700,
      minWidth: 500,
      minHeight: 400,
      backgroundColor: isLight ? "#f9fafb" : "#181818",
      frame: false,
      title,
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true,
        backgroundThrottling: false
      }
    });

    win.setMenu(null);

    win.on("maximize", () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send("chrome:window:maximized-change", true);
      }
    });

    win.on("unmaximize", () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send("chrome:window:maximized-change", false);
      }
    });

    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    const distPath = path.join(__dirname, "../../dist/index.html");

    const query = { popout: panelName };
    if (targetTabId) query.targetTab = targetTabId;
    const queryString = new URLSearchParams(query).toString();
    const targetUrl = `${devUrl}?${queryString}`;

    const devServerActive = await isDevServerRunning(devUrl);
    if (devServerActive) {
      win.loadURL(targetUrl).catch(() => {
        if (fs.existsSync(distPath)) {
          win.loadFile(distPath, { query });
        }
      });
    } else if (fs.existsSync(distPath)) {
      win.loadFile(distPath, { query });
    } else {
      win.loadURL(targetUrl).catch(() => { });
    }

    this.windows.set(panelName, win);
    logger.info(`Opened floating window for panel: ${panelName}`);

    win.on("closed", () => {
      this.windows.delete(panelName);
    });

    return win;
  }

  closeAll() {
    for (const win of this.windows.values()) {
      if (win && !win.isDestroyed()) {
        win.close();
      }
    }
    this.windows.clear();
  }
}

module.exports = new FloatingWindowManager();
