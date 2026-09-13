const service = require("./service");
const config = require("./config");
const logger = require("../../services/logger").forSubsystem("ScraperBuilder");

function init(appContext) {
  logger.info("Scraper Builder module initialized");
}

module.exports = {
  name: "scraper-builder",
  service,
  config,
  init
};
