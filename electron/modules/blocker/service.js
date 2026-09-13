const defaultConfig = require("./config");
const logger = require("../../services/logger").forSubsystem("Blocker");

class BlockerService {
  constructor() {
    this.config = { ...defaultConfig };
    this.blockedCount = 0;
    this.activeSessions = new Set();
  }

  attachSession(session) {
    if (!session || this.activeSessions.has(session)) return;
    this.activeSessions.add(session);

    session.webRequest.onBeforeRequest(
      { urls: ["*://*/*"] },
      (details, callback) => {
        if (!this.config.enabled) {
          return callback({ cancel: false });
        }

        const url = details.url.toLowerCase();
        const isBlocked = this.config.blockedDomains.some((domain) => url.includes(domain)) ||
          this.config.customRules.some((rule) => url.includes(rule));

        if (isBlocked) {
          this.blockedCount++;
          logger.debug(`Blocked (${this.blockedCount}): ${details.url}`);
          return callback({ cancel: true });
        }

        return callback({ cancel: false });
      }
    );

    logger.info("Blocker attached to session");
  }

  getStats() {
    return {
      enabled: this.config.enabled,
      blockedCount: this.blockedCount,
      rulesCount: this.config.blockedDomains.length + this.config.customRules.length
    };
  }

  toggle(enabled) {
    this.config.enabled = typeof enabled === "boolean" ? enabled : !this.config.enabled;
    logger.info(`Blocker enabled state set to: ${this.config.enabled}`);
    return this.getStats();
  }

  addRule(domain) {
    if (domain && !this.config.customRules.includes(domain)) {
      this.config.customRules.push(domain);
      logger.info(`Added custom blocking rule: ${domain}`);
    }
  }
}

module.exports = new BlockerService();
