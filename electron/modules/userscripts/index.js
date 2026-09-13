const service = require("./service");
const engine = require("./engine");
const storage = require("./storage");
const config = require("./config");
const logger = require("../../services/logger").forSubsystem("Userscripts");

function init(appContext) {
  const webviewBridge = require("../../services/browser/webview-bridge");

  webviewBridge.registerHook("onNavigate", async ({ tabId, url }) => {
    if (!tabId || !url) return;

    // One-click install for .user.js URLs
    if (url.endsWith(".user.js") || url.includes(".user.js?")) {
      try {
        const res = await fetch(url);
        const code = await res.text();
        if (code.includes("// ==UserScript==")) {
          const meta = engine.parseMetadata(code);
          await service.saveScript({
            name: meta.name || "Installed Userscript",
            code,
            enabled: 1
          });
          logger.info(`Auto-installed userscript from ${url}: "${meta.name}"`);
        }
      } catch (err) {
        logger.warn(`Failed to auto-install userscript from ${url}:`, err.message);
      }
    }

    if (!config.autoInject) return;
    const contents = webviewBridge.getContents(tabId);
    if (contents) {
      contents.once("did-finish-load", () => {
        service.checkAndInject(contents, url, "document-end");
      });
    }
  });

  logger.info("Userscripts module initialized");
}

module.exports = {
  name: "userscripts",
  service,
  engine,
  storage,
  config,
  init
};
