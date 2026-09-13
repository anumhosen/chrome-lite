const { ipcMain } = require("electron");

function registerTabsIpc({ browserService }) {
  ipcMain.handle("chrome:tab:create", (e, options) => browserService.createTab(options));
  ipcMain.handle("chrome:tab:close", (e, tabId) => browserService.closeTab(tabId));
  ipcMain.handle("chrome:tab:activate", (e, tabId) => browserService.activateTab(tabId));
  ipcMain.handle("chrome:tab:navigate", (e, { tabId, url }) => browserService.navigate(tabId, url));
  ipcMain.handle("chrome:tab:back", (e, tabId) => browserService.goBack(tabId));
  ipcMain.handle("chrome:tab:forward", (e, tabId) => browserService.goForward(tabId));
  ipcMain.handle("chrome:tab:reload", (e, tabId) => browserService.reload(tabId));
  ipcMain.handle("chrome:tab:stop", (e, tabId) => browserService.stop(tabId));
  ipcMain.handle("chrome:tab:bind-contents", (e, { tabId, contentsId }) => browserService.bindTabContents(tabId, contentsId));
  ipcMain.handle("chrome:tab:get-all", (e, workspaceId) => browserService.getTabs(workspaceId));
  ipcMain.handle("chrome:tab:get-active", () => browserService.getActiveTab());
}

module.exports = registerTabsIpc;
