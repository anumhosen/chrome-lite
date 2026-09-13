const { app, BrowserWindow, session, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs");

const config = require("./services/config");
const logger = require("./services/logger").forSubsystem("Main");
const db = require("./services/database");
const browserService = require("./services/browser");
const { registerIpcHandlers } = require("./ipc");

// Module references
const modules = {
  blocker: require("./modules/blocker"),
  bookmarks: require("./modules/bookmarks"),
  history: require("./modules/history"),
  downloads: require("./modules/downloads"),
  profiles: require("./modules/profiles"),
  workspaces: require("./modules/workspaces"),
  cookies: require("./modules/cookies"),
  interceptor: require("./modules/interceptor"),
  scraper: require("./modules/scraper"),
  automation: require("./modules/automation"),
  notebook: require("./modules/notebook"),
  explorer: require("./modules/explorer"),
  userscripts: require("./modules/userscripts"),
  scraperBuilder: require("./modules/scraper-builder"),
  ai: require("./modules/ai"),
  updater: require("./modules/updater")
};

const floatingWindowManager = require("./services/browser/floating-windows");

let mainWindow = null;

function openFloatingNotebook() {
  return floatingWindowManager.openFloatingWindow("notebook");
}

async function createWindow() {
  const isLight = config.get("theme", "dark") === "light";
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: isLight ? "#f9fafb" : "#181818",
    frame: false,
    icon: path.join(__dirname, "assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      backgroundThrottling: true
    }
  });

  mainWindow.setMenu(null);

  // Enable DevTools shortcuts (Ctrl+Shift+I, Cmd+Alt+I, F12) even when menu is null
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown") {
      const isDevTools =
        ((input.control || input.meta) && input.shift && input.key.toLowerCase() === "i") ||
        input.key === "F12";
      if (isDevTools) {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
    }
  });

const http = require("http");

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

  const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
  const distPath = path.join(__dirname, "./dist/index.html");

  const devServerActive = await isDevServerRunning(devUrl);
  if (devServerActive) {
    await mainWindow.loadURL(devUrl).catch(() => {
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      }
    });
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../ui/index.html")).catch(() => {
      mainWindow.loadURL(devUrl);
    });
  }

  browserService.init(mainWindow);

  mainWindow.on("maximize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("chrome:window:maximized-change", true);
    }
  });

  mainWindow.on("unmaximize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("chrome:window:maximized-change", false);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function initEnabledModules() {
  const context = { mainWindow, session: session.defaultSession, config, db };
  for (const [name, mod] of Object.entries(modules)) {
    if (config.isFeatureEnabled(name)) {
      try {
        mod.init(context);
        logger.info(`Initialized module: ${name}`);
      } catch (err) {
        logger.error(`Failed to initialize module ${name}:`, err.message);
      }
    } else {
      logger.debug(`Module disabled: ${name}`);
    }
  }
}

function initIpc() {
  registerIpcHandlers({
    getMainWindow: () => mainWindow,
    modules,
    browserService,
    config,
    db,
    openFloatingNotebook,
    session: session.defaultSession
  });
}

app.whenReady().then(async () => {
  logger.info("Chrome Lite initializing...");

  try {
    await db.init();
  } catch (err) {
    logger.error("Database failed to initialize:", err.message);
  }

  const initialTheme = config.get("theme", "dark");
  nativeTheme.themeSource = initialTheme === "light" ? "light" : "dark";

  await createWindow();
  initEnabledModules();
  initIpc();

  // Listen for DevTools shortcuts globally across all webContents (windows, popouts, webviews)
  app.on("web-contents-created", (event, contents) => {
    contents.on("before-input-event", (inputEvent, input) => {
      if (input.type === "keyDown") {
        const isDevTools =
          ((input.control || input.meta) && input.shift && input.key.toLowerCase() === "i") ||
          input.key === "F12";
        if (isDevTools) {
          contents.toggleDevTools();
          inputEvent.preventDefault();
        }
      }
    });
  });

  // Create initial tab in personal workspace
  browserService.createTab({
    url: config.get("newTabUrl") || config.get("homepage", "chrome://newtab"),
    workspaceId: "personal",
    active: true
  });
});

app.on("before-quit", async () => {
  try {
    const activeWs = modules.workspaces.service.getActiveWorkspace();
    await browserService.saveSession(activeWs);
    await modules.history.service.onBeforeQuit(session.defaultSession);
    await db.close();
    browserService.destroy();
  } catch (err) {
    logger.error("Error during shutdown cleanup:", err.message);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});