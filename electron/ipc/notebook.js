const { ipcMain } = require("electron");
const webviewBridge = require("../services/browser/webview-bridge");
const floatingWindowManager = require("../services/browser/floating-windows");

function registerNotebookIpc({ modules, getMainWindow, openFloatingNotebook, browserService }) {
  ipcMain.handle("chrome:notebook:execute", async (e, { tabId, code, cellId }) => {
    const targetTabId = tabId || (browserService?.getActiveTab() ? browserService.getActiveTab().id : null);
    const contents = targetTabId ? webviewBridge.getContents(targetTabId) : null;
    return await modules.notebook.service.executeCell(contents, code, { cellId, tabId: targetTabId });
  });

  ipcMain.handle("chrome:notebook:save", (e, notebook) => modules.notebook.service.saveNotebook(notebook));
  ipcMain.handle("chrome:notebook:list-library", () => modules.notebook.service.listNotebooks());
  ipcMain.handle("chrome:notebook:load", (e, id) => modules.notebook.service.loadNotebook(id));
  ipcMain.handle("chrome:notebook:get-history", (e, limit) => modules.notebook.history.getRecentRuns(limit));
  ipcMain.handle("chrome:notebook:open-file", (e, filePath) => modules.notebook.fileManager.openFile(filePath));
  ipcMain.handle("chrome:notebook:save-file", (e, { filePath, content }) => modules.notebook.fileManager.saveFile(filePath, content));

  ipcMain.handle("chrome:notebook:choose-file-open", () => {
    const win = getMainWindow ? getMainWindow() : null;
    return modules.notebook.fileManager.chooseAndOpenFile(win);
  });

  ipcMain.handle("chrome:notebook:choose-file-save", (e, content, defaultPath) => {
    const win = getMainWindow ? getMainWindow() : null;
    return modules.notebook.fileManager.chooseAndSaveFile(win, content, defaultPath);
  });

  ipcMain.handle("chrome:notebook:open-floating", () => {
    floatingWindowManager.openFloatingWindow("notebook");
    return { success: true };
  });
}

module.exports = registerNotebookIpc;

