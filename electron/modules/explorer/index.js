const assetCollector = require("./assetCollector");
const resourceTree = require("./resourceTree");
const previewService = require("./previewService");
const searchService = require("./searchService");
const exportService = require("./exportService");
const config = require("./config");
const logger = require("../../services/logger").forSubsystem("Explorer");

const service = require("./service");

function init(appContext) {
  const webviewBridge = require("../../services/browser/webview-bridge");

  // Clear tab assets when a tab navigates to a new page
  webviewBridge.registerHook("onNavigate", ({ tabId }) => {
    if (tabId) assetCollector.clearTab(tabId);
  });

  logger.info("Explorer module initialized");
}

module.exports = {
  name: "explorer",
  service,
  assetCollector,
  resourceTree,
  previewService,
  searchService,
  exportService,
  config,
  init
};
