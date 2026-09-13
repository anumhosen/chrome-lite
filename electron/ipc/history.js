const { ipcMain, session: electronSession } = require("electron");

function registerHistoryIpc({ modules, session }) {
  const getTargetSession = () => session || electronSession.defaultSession;

  ipcMain.handle("chrome:history:get", (e, limit) => modules.history.service.getHistory(limit));
  ipcMain.handle("chrome:history:clear", () => modules.history.service.clearHistory());
  ipcMain.handle("chrome:history:toggle", (e, enabled) => modules.history.service.toggle(enabled));
  ipcMain.handle("chrome:history:clear-cache", () => modules.history.service.clearCache(getTargetSession()));
  ipcMain.handle("chrome:history:clear-storage", () => modules.history.service.clearStorage(getTargetSession()));
}

module.exports = registerHistoryIpc;
