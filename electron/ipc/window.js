const { ipcMain, BrowserWindow } = require("electron");
const floatingWindowManager = require("../services/browser/floating-windows");

function registerWindowIpc({ getMainWindow }) {
  ipcMain.handle("chrome:window:minimize", (event) => {
    const win = (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) || (getMainWindow ? getMainWindow() : null);
    if (win && !win.isDestroyed()) win.minimize();
  });

  ipcMain.handle("chrome:window:maximize", (event) => {
    const win = (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) || (getMainWindow ? getMainWindow() : null);
    if (win && !win.isDestroyed()) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle("chrome:window:close", (event) => {
    const win = (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) || (getMainWindow ? getMainWindow() : null);
    if (win && !win.isDestroyed()) win.close();
  });

  ipcMain.handle("chrome:window:is-maximized", (event) => {
    const win = (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) || (getMainWindow ? getMainWindow() : null);
    return win && !win.isDestroyed() ? win.isMaximized() : false;
  });

  ipcMain.handle("chrome:window:open-floating", (e, panelName, targetTabId) => {
    floatingWindowManager.openFloatingWindow(panelName, targetTabId);
    return { success: true, panel: panelName };
  });

  ipcMain.handle("chrome:window:toggle-devtools", (event) => {
    const win = (event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null) || (getMainWindow ? getMainWindow() : null);
    if (win && !win.isDestroyed()) {
      win.webContents.toggleDevTools();
    }
  });
}

module.exports = registerWindowIpc;

