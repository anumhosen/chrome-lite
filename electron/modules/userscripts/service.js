const db = require("../../services/database");
const engine = require("./engine");
const storage = require("./storage");
const logger = require("../../services/logger").forSubsystem("UserscriptsService");

class UserscriptsService {
  async getScripts() {
    try {
      return await db.all(`SELECT * FROM userscripts ORDER BY updated_at DESC`);
    } catch (err) {
      logger.error("Failed to query userscripts:", err.message);
      return [];
    }
  }

  async getAll() {
    return await this.getScripts();
  }

  async saveScript({ id = null, name = null, code = "", enabled = 1 }) {
    const meta = engine.parseMetadata(code);
    const scriptName = name || meta.name || "Custom Userscript";
    const scriptId = id || "us_" + Date.now().toString(36);
    const matchPatterns = JSON.stringify(meta.match);

    try {
      const existing = await db.get(`SELECT id FROM userscripts WHERE id = ?`, [scriptId]);
      if (existing) {
        await db.run(
          `UPDATE userscripts SET name = ?, match_patterns = ?, run_at = ?, code = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [scriptName, matchPatterns, meta.runAt, code, enabled ? 1 : 0, scriptId]
        );
      } else {
        await db.run(
          `INSERT INTO userscripts (id, name, match_patterns, run_at, code, enabled, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [scriptId, scriptName, matchPatterns, meta.runAt, code, enabled ? 1 : 0]
        );
      }
      storage.save(scriptName.toLowerCase().replace(/[^a-z0-9]/g, "_"), code);
      return { id: scriptId, name: scriptName, matchPatterns, code, enabled };
    } catch (err) {
      logger.error("Failed to save userscript:", err.message);
      throw err;
    }
  }

  async toggleScript(id, enabled) {
    try {
      await db.run(`UPDATE userscripts SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [enabled ? 1 : 0, id]);
      return true;
    } catch (err) {
      return false;
    }
  }

  async deleteScript(id) {
    try {
      await db.run(`DELETE FROM userscripts WHERE id = ?`, [id]);
      return true;
    } catch (err) {
      return false;
    }
  }

  async checkAndInject(webContents, url, stage = "document-end") {
    if (!webContents || !url) return;
    try {
      const scripts = await db.all(`SELECT * FROM userscripts WHERE enabled = 1 AND run_at = ?`, [stage]);
      for (const s of scripts) {
        let patterns = [];
        try { patterns = JSON.parse(s.match_patterns || "[]"); } catch {}

        const matched = patterns.some((p) => engine.matchesUrl(url, p));
        if (matched) {
          await engine.injectScript(webContents, s);
        }
      }
    } catch (err) {
      logger.debug("Userscript injection check failed:", err.message);
    }
  }
}

module.exports = new UserscriptsService();
