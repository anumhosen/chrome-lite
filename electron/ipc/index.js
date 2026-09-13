const registerTabsIpc = require("./tabs");
const registerWorkspacesIpc = require("./workspaces");
const registerBookmarksIpc = require("./bookmarks");
const registerHistoryIpc = require("./history");
const registerDownloadsIpc = require("./downloads");
const registerPrivacyIpc = require("./privacy");
const registerScraperIpc = require("./scraper");
const registerAutomationIpc = require("./automation");
const registerNotebookIpc = require("./notebook");
const registerToolsIpc = require("./tools");
const registerSystemIpc = require("./system");
const registerWindowIpc = require("./window");

function registerIpcHandlers(context) {
  registerTabsIpc(context);
  registerWorkspacesIpc(context);
  registerBookmarksIpc(context);
  registerHistoryIpc(context);
  registerDownloadsIpc(context);
  registerPrivacyIpc(context);
  registerScraperIpc(context);
  registerAutomationIpc(context);
  registerNotebookIpc(context);
  registerToolsIpc(context);
  registerSystemIpc(context);
  registerWindowIpc(context);
}

module.exports = {
  registerIpcHandlers,
  registerTabsIpc,
  registerWorkspacesIpc,
  registerBookmarksIpc,
  registerHistoryIpc,
  registerDownloadsIpc,
  registerPrivacyIpc,
  registerScraperIpc,
  registerAutomationIpc,
  registerNotebookIpc,
  registerToolsIpc,
  registerSystemIpc,
  registerWindowIpc
};
