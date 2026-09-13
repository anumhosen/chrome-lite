const service = require("./service");
const scheduler = require("./scheduler");
const config = require("./config");

function init(appContext) {
  const getMainWindow = () => appContext?.mainWindow;
  scheduler.init(service, getMainWindow);
}

module.exports = {
  name: "automation",
  config,
  service,
  scheduler,
  init
};
