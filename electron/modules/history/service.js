const db = require("../../services/database");
const defaultConfig = require("./config");
const logger = require("../../services/logger").forSubsystem("History");

class HistoryService {
  constructor() {
    this.config = { ...defaultConfig };
  }

  async recordVisit({ url, title, workspaceId = "personal" }) {
    if (!this.config.enabled || !url) return;
    if (url.startsWith("about:") || url.startsWith("chrome:") || url.startsWith("data:")) return;

    try {
      const id = "hist_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
      const existing = await db.get(`SELECT id, visit_count FROM history WHERE url = ? LIMIT 1`, [url]);

      if (existing) {
        await db.run(
          `UPDATE history SET visit_count = visit_count + 1, title = ?, last_visited = CURRENT_TIMESTAMP WHERE id = ?`,
          [title || url, existing.id]
        );
      } else {
        await db.run(
          `INSERT INTO history (id, workspace_id, title, url, visit_count, last_visited)
           VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
          [id, workspaceId, title || url, url]
        );
      }
    } catch (err) {
      logger.error("Failed to record history:", err.message);
    }
  }

  async getHistory(limit = 100) {
    try {
      return await db.all(
        `SELECT * FROM history ORDER BY last_visited DESC LIMIT ?`,
        [limit]
      );
    } catch (err) {
      logger.error("Failed to query history:", err.message);
      return [];
    }
  }

  async clearHistory() {
    try {
      await db.run(`DELETE FROM history`);
      logger.info("History database cleared");
      return true;
    } catch (err) {
      logger.error("Failed to clear history:", err.message);
      return false;
    }
  }

  async clearCache(session) {
    if (!session) return;
    try {
      await session.clearCache();
      logger.info("Browser session cache cleared");
    } catch (err) {
      logger.error("Failed to clear cache:", err.message);
    }
  }

  async clearStorage(session) {
    if (!session) return;
    try {
      await session.clearStorageData({
        storages: ["appcache", "cookies", "filesystem", "indexdb", "localstorage", "shadercache", "websql", "serviceworkers", "cachestorage"]
      });
      logger.info("Browser session storage data cleared");
    } catch (err) {
      logger.error("Failed to clear storage:", err.message);
    }
  }

  toggle(enabled) {
    this.config.enabled = typeof enabled === "boolean" ? enabled : !this.config.enabled;
    logger.info(`History tracking enabled: ${this.config.enabled}`);
    return this.config.enabled;
  }

  toggleAutoClear(autoClear) {
    this.config.autoClearOnExit = typeof autoClear === "boolean" ? autoClear : !this.config.autoClearOnExit;
    return this.config.autoClearOnExit;
  }

  async onBeforeQuit(session) {
    if (this.config.autoClearOnExit) {
      logger.info("Auto-clearing history and cache on exit...");
      await this.clearHistory();
      if (session) {
        await this.clearCache(session);
      }
    }
  }
}

module.exports = new HistoryService();
