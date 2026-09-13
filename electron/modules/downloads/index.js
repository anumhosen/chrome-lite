const { app, session, webContents } = require("electron");
const service = require("./service");
const config = require("./config");

function init(appContext) {
  if (appContext && appContext.mainWindow) {
    service.init(appContext.mainWindow);
  }

  // Attach to defaultSession
  if (session.defaultSession) {
    service.attachSession(session.defaultSession);
  }

  // Attach to all existing webContents
  try {
    for (const wc of webContents.getAllWebContents()) {
      if (wc && !wc.isDestroyed() && wc.session) {
        service.attachSession(wc.session);
      }
    }
  } catch { }

  // Attach to all future webContents (webviews, popups, auxiliary windows)
  app.on("web-contents-created", (event, contents) => {
    try {
      if (contents && contents.session) {
        service.attachSession(contents.session);
      }
    } catch { }
  });
}

module.exports = {
  name: "downloads",
  config,
  service,
  init
};
