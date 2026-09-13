const { ipcMain } = require("electron");
const webviewBridge = require("../services/browser/webview-bridge");

function registerToolsIpc({ modules, browserService }) {
  // Resource Explorer
  ipcMain.handle("chrome:explorer:get-assets", (e, filter) => modules.explorer.service.getAssets(filter));
  ipcMain.handle("chrome:explorer:scan-page", async (e, tabId) => {
    const { webContents } = require("electron");
    let targetTabId = tabId || null;
    let contents = targetTabId ? webviewBridge.getContents(targetTabId) : null;

    // Fallback 1: tabId is numeric contents id
    if (!contents && targetTabId && (typeof targetTabId === "number" || /^\d+$/.test(targetTabId))) {
      contents = webContents.fromId(Number(targetTabId));
      if (contents) {
        targetTabId = webviewBridge.contentsToTabMap.get(contents.id) || String(contents.id);
      }
    }

    // Fallback 2: Active tab in browser
    if (!contents && browserService) {
      const activeTab = browserService.getActiveTab ? browserService.getActiveTab() : null;
      if (activeTab && activeTab.id) {
        contents = webviewBridge.getContents(activeTab.id);
        if (contents) targetTabId = activeTab.id;
      }
    }

    // Fallback 3: First available webview webContents
    if (!contents) {
      const all = webContents.getAllWebContents();
      contents = all.find((c) => c.getType() === "webview" && !c.isDestroyed()) || null;
      if (contents && !targetTabId) {
        targetTabId = webviewBridge.contentsToTabMap.get(contents.id) || String(contents.id);
      }
    }

    if (!contents || contents.isDestroyed()) {
      return [];
    }

    return await modules.explorer.service.scanPage(contents, targetTabId);
  });
  ipcMain.handle("chrome:explorer:get-preview", (e, assetId) => modules.explorer.service.getAssetPreview(assetId));
  ipcMain.handle("chrome:explorer:export-assets", (e, { format, filter }) => modules.explorer.service.exportAssets(format, filter));

  // Userscripts
  ipcMain.handle("chrome:userscripts:get-all", () => modules.userscripts.service.getAll());
  ipcMain.handle("chrome:userscripts:save", (e, script) => modules.userscripts.service.saveScript(script));
  ipcMain.handle("chrome:userscripts:toggle", (e, { id, enabled }) => modules.userscripts.service.toggleScript(id, enabled));
  ipcMain.handle("chrome:userscripts:delete", (e, id) => modules.userscripts.service.deleteScript(id));
}

module.exports = registerToolsIpc;
