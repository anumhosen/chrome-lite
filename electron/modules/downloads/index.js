const { app, session } = require("electron");
const service = require("./service");
const config = require("./config");

function init(appContext) {
  if (appContext && appContext.mainWindow) {
    service.init(appContext.mainWindow);
  }
  if (session.defaultSession) {
    service.attachSession(session.defaultSession);
  }
  app.on("web-contents-created", (event, contents) => {
    if (contents.getType() === "webview" && contents.session) {
      service.attachSession(contents.session);
    }
  });
}

module.exports = {
  name: "downloads",
  config,
  service,
  init
};
