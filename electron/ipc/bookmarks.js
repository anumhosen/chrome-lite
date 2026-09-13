const { ipcMain } = require("electron");

function registerBookmarksIpc({ modules }) {
  ipcMain.handle("chrome:bookmarks:get", (e, wsId) => modules.bookmarks.service.getBookmarks(wsId));
  ipcMain.handle("chrome:bookmarks:add", (e, data) => modules.bookmarks.service.addBookmark(data));
  ipcMain.handle("chrome:bookmarks:remove", (e, id) => modules.bookmarks.service.removeBookmark(id));
  ipcMain.handle("chrome:bookmarks:check", (e, url) => modules.bookmarks.service.isBookmarked(url));
}

module.exports = registerBookmarksIpc;
