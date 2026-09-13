const db = require("../../services/database");
const scriptRunner = require("./scriptRunner");
const fileManager = require("./fileManager");
const history = require("./history");
const logger = require("../../services/logger").forSubsystem("NotebookService");

class NotebookService {
  async getNotebooks() {
    try {
      return await db.all(`SELECT * FROM notebooks ORDER BY updated_at DESC`);
    } catch (err) {
      logger.error("Failed to query notebooks:", err.message);
      return [];
    }
  }

  async listNotebooks() {
    return await this.getNotebooks();
  }

  async getNotebook(id) {
    try {
      return await db.get(`SELECT * FROM notebooks WHERE id = ?`, [id]);
    } catch (err) {
      logger.error(`Failed to get notebook ${id}:`, err.message);
      return null;
    }
  }

  async loadNotebook(id) {
    return await this.getNotebook(id);
  }

  async saveNotebook({ id = null, name = "Untitled Notebook", content = "", autoRunDomains = "", language = "javascript" }) {
    const notebookId = id || "nb_" + Date.now().toString(36);
    try {
      const existing = await db.get(`SELECT id FROM notebooks WHERE id = ?`, [notebookId]);
      if (existing) {
        await db.run(
          `UPDATE notebooks SET name = ?, content = ?, auto_run_domains = ?, language = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [name, content, autoRunDomains, language, notebookId]
        );
      } else {
        await db.run(
          `INSERT INTO notebooks (id, name, content, auto_run_domains, language, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [notebookId, name, content, autoRunDomains, language]
        );
      }
      logger.info(`Saved notebook "${name}" (${notebookId})`);
      return { id: notebookId, name, content, autoRunDomains, language };
    } catch (err) {
      logger.error("Failed to save notebook:", err.message);
      throw err;
    }
  }

  async deleteNotebook(id) {
    try {
      await db.run(`DELETE FROM notebooks WHERE id = ?`, [id]);
      logger.info(`Deleted notebook: ${id}`);
      return true;
    } catch (err) {
      logger.error("Failed to delete notebook:", err.message);
      throw err;
    }
  }

  async executeCode(webContents, code, options = {}) {
    return await scriptRunner.runScript(webContents, code, options);
  }

  async executeCell(webContents, code, options = {}) {
    return await this.executeCode(webContents, code, options);
  }

  async checkAutoExecute(webContents, url) {
    if (!webContents || !url) return;
    try {
      const notebooks = await db.all(`SELECT * FROM notebooks WHERE auto_run_domains IS NOT NULL AND auto_run_domains != ''`);
      for (const nb of notebooks) {
        const patterns = nb.auto_run_domains.split(",").map((p) => p.trim());
        for (const pattern of patterns) {
          if (pattern && scriptRunner.matchesPattern(url, pattern)) {
            logger.info(`[AutoExecute] Running notebook "${nb.name}" on ${url}`);
            await scriptRunner.runScript(webContents, nb.content, {
              notebookId: nb.id,
              tabId: webContents.id
            });
            break;
          }
        }
      }
    } catch (err) {
      logger.warn("AutoExecute check failed:", err.message);
    }
  }
}

module.exports = new NotebookService();
