const notebookService = require("./notebookService");
const scriptRunner = require("./scriptRunner");
const fileManager = require("./fileManager");
const history = require("./history");
const config = require("./config");
const logger = require("../../services/logger").forSubsystem("Notebook");

function init(appContext) {
  const webviewBridge = require("../../services/browser/webview-bridge");
  webviewBridge.registerHook("onNavigate", (data) => {
    if (config.autoRunEnabled && data && data.tabId && data.url) {
      const contents = webviewBridge.getContents(data.tabId);
      if (contents) {
        contents.once("did-finish-load", () => {
          notebookService.checkAutoExecute(contents, data.url);
        });
      }
    }
  });
  logger.info("Notebook module initialized with auto-execute hooks");
}

module.exports = {
  name: "notebook",
  service: notebookService,
  scriptRunner,
  fileManager,
  history,
  config,
  init
};
