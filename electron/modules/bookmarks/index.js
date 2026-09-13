const service = require("./service");
const config = require("./config");

function init(appContext) {
  // Bookmark lifecycle initialization if needed
}

module.exports = {
  name: "bookmarks",
  config,
  service,
  init
};
