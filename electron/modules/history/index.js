const service = require("./service");
const config = require("./config");
const webviewBridge = require("../../services/browser/webview-bridge");

function init(appContext) {
  webviewBridge.registerHook("onNavigate", (tabId, url, title) => {
    service.recordVisit({ url, title });
  });
}

module.exports = {
  name: "history",
  config,
  service,
  init
};
