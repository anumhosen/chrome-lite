const service = require("./service");
const config = require("./config");
const { session } = require("electron");

function init(appContext) {
  if (session.defaultSession) {
    service.attachSession(session.defaultSession);
  }
}

module.exports = {
  name: "blocker",
  config,
  service,
  init
};
