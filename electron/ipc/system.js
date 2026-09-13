const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const tabManager = require("../services/browser/tab-manager");

function registerSystemIpc({ config, browserService }) {
  ipcMain.handle("chrome:system:get-config", () => config.getAll());

  ipcMain.handle("chrome:system:set-feature", (e, { name, enabled }) => {
    config.setFeature(name, enabled);
    return config.getAll();
  });

  ipcMain.handle("chrome:system:set-setting", (e, { key, value }) => {
    config.set(key, value);
    if (key === "theme") {
      const { nativeTheme, BrowserWindow } = require("electron");
      nativeTheme.themeSource = value === "light" ? "light" : "dark";
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send("chrome:theme-changed", value);
        }
      });
    }
    return config.getAll();
  });

  ipcMain.handle("chrome:system:get-memory", async () => {
    const memoryInfo = await process.getProcessMemoryInfo();
    const memUsage = process.memoryUsage();
    return {
      residentSet: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      privateMemory: Math.round(memoryInfo.private / 1024)
    };
  });

  ipcMain.handle("chrome:system:get-detailed-memory", async () => {
    const memoryInfo = await process.getProcessMemoryInfo();
    const memUsage = process.memoryUsage();
    let dbSizeMb = 0;
    try {
      const dbPath = path.join(__dirname, "../data/chrome.db");
      if (fs.existsSync(dbPath)) {
        dbSizeMb = (fs.statSync(dbPath).size / 1024 / 1024).toFixed(2);
      }
    } catch { }

    const tabs = browserService ? browserService.getTabs() : [];
    const hibernatedTabs = tabs.filter((t) => t.hibernated || t.isHibernated).length;
    const activeTabs = tabs.length - hibernatedTabs;

    return {
      residentSet: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      privateMemory: Math.round(memoryInfo.private / 1024),
      dbSizeMb,
      totalTabs: tabs.length,
      activeTabs,
      hibernatedTabs
    };
  });

  ipcMain.handle("chrome:system:force-hibernate", () => {
    return tabManager.hibernateInactiveTabs(0);
  });
}

module.exports = registerSystemIpc;
