const { ipcMain, shell } = require("electron");
const fs = require("fs");

function registerDownloadsIpc({ modules }) {
  ipcMain.handle("chrome:downloads:get", (e, limit) => modules.downloads.service.getDownloads(limit));
  ipcMain.handle("chrome:downloads:queue-asset", (e, asset) => modules.downloads.service.queueDownload(asset));
  ipcMain.handle("chrome:downloads:batch-queue", (e, assets) => modules.downloads.service.batchQueue(assets));
  ipcMain.handle("chrome:downloads:get-queue", () => modules.downloads.service.getQueue());
  ipcMain.handle("chrome:downloads:clear-queue", () => modules.downloads.service.clearQueue());
  ipcMain.handle("chrome:downloads:open-file", (e, filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      shell.openPath(filePath);
      return true;
    }
    return false;
  });
  ipcMain.handle("chrome:downloads:show-item", (e, filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return true;
    }
    return false;
  });
}

module.exports = registerDownloadsIpc;
