const service = require("./service");
const config = require("./config");
const { app } = require("electron");

function init(appContext) {
  if (appContext && appContext.mainWindow) {
    service.init(appContext.mainWindow);
  }

  app.on("web-contents-created", (event, contents) => {
    if (contents.getType() === "webview") {
      service.attachToContents(contents);
    }
  });
}

module.exports = {
  name: "interceptor",
  config,
  service,
  init
};
