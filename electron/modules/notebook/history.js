const db = require("../../services/database");
const logger = require("../../services/logger").forSubsystem("NotebookHistory");

class NotebookHistory {
  async recordRun({ notebookId = null, tabId = null, url = "", status = "success", output = "", error = null, durationMs = 0 }) {
    const id = "run_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    try {
      await db.run(
        `INSERT INTO notebook_runs (id, notebook_id, tab_id, url, status, output, error, duration_ms, executed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, notebookId, tabId, url, status, String(output || ""), error ? String(error) : null, durationMs]
      );
      return id;
    } catch (err) {
      logger.error("Failed to record notebook run:", err.message);
      return null;
    }
  }

  async getRecentRuns(limit = 50) {
    try {
      return await db.all(
        `SELECT * FROM notebook_runs ORDER BY executed_at DESC LIMIT ?`,
        [limit]
      );
    } catch (err) {
      logger.error("Failed to get notebook runs:", err.message);
      return [];
    }
  }

  async clearHistory() {
    try {
      await db.run(`DELETE FROM notebook_runs`);
      return true;
    } catch (err) {
      logger.error("Failed to clear notebook history:", err.message);
      return false;
    }
  }
}

module.exports = new NotebookHistory();
