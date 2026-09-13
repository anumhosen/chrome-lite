const logger = require("../../services/logger").forSubsystem("Updater");

class UpdaterService {
  async checkForUpdates() {
    logger.info("Checking for Chrome Lite updates...");
    return { hasUpdate: false, currentVersion: "1.0.0" };
  }
}

module.exports = new UpdaterService();
