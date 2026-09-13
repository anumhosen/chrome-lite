const { ipcMain } = require("electron");
const webviewBridge = require("../services/browser/webview-bridge");

function registerScraperIpc({ modules, browserService }) {
  ipcMain.handle("chrome:scraper:extract", async (e, { tabId, selector, isTable }) => {
    const contents = webviewBridge.getContents(tabId);
    if (isTable) {
      return await modules.scraper.service.extractTable(contents, selector);
    }
    return await modules.scraper.service.extractSelector(contents, selector);
  });

  ipcMain.handle("chrome:scraper:start-picker", async (e, tabId) => {
    const contents = webviewBridge.getContents(tabId);
    return await modules.scraper.service.startVisualPicker(contents);
  });

  ipcMain.handle("chrome:scraper:save", async (e, { url, selector, data }) => {
    return await modules.scraper.service.saveScrapedData("manual", url, selector, data);
  });

  ipcMain.handle("chrome:scraper:export-file", async (e, { data, format, filename }) => {
    return await modules.scraper.service.exportToFile(data, format, filename);
  });

  ipcMain.handle("chrome:scraper:get-history", async (e, limit) => {
    return await modules.scraper.service.getScrapedHistory(limit);
  });

  // Scraper Builder
  ipcMain.handle("chrome:scraper-builder:detect-pagination", async (e, tabId) => {
    const targetTabId = tabId || (browserService?.getActiveTab() ? browserService.getActiveTab().id : null);
    const contents = targetTabId ? webviewBridge.getContents(targetTabId) : null;
    return await modules.scraperBuilder.service.detectPagination(contents);
  });

  ipcMain.handle("chrome:scraper-builder:save-workflow", (e, data) => modules.scraperBuilder.service.saveScraperWorkflow(data));
}

module.exports = registerScraperIpc;
