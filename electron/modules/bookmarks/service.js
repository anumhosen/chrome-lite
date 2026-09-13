const db = require("../../services/database");
const config = require("./config");
const logger = require("../../services/logger").forSubsystem("Bookmarks");

class BookmarksService {
  async addBookmark({ title, url, favicon = null, folder = "Default", workspaceId = "personal" }) {
    const id = "bm_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
    try {
      await db.run(
        `INSERT INTO bookmarks (id, workspace_id, title, url, favicon, folder, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, workspaceId, title, url, favicon, folder]
      );
      logger.info(`Added bookmark: ${title} (${url})`);
      return { id, workspaceId, title, url, favicon, folder };
    } catch (err) {
      logger.error("Failed to add bookmark:", err.message);
      throw err;
    }
  }

  async removeBookmark(id) {
    try {
      await db.run(`DELETE FROM bookmarks WHERE id = ?`, [id]);
      logger.info(`Removed bookmark ${id}`);
      return true;
    } catch (err) {
      logger.error("Failed to remove bookmark:", err.message);
      return false;
    }
  }

  async getBookmarks(workspaceId) {
    try {
      if (workspaceId) {
        return await db.all(
          `SELECT * FROM bookmarks WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`,
          [workspaceId, config.maxBookmarksPerQuery]
        );
      }
      return await db.all(
        `SELECT * FROM bookmarks ORDER BY created_at DESC LIMIT ?`,
        [config.maxBookmarksPerQuery]
      );
    } catch (err) {
      logger.error("Failed to fetch bookmarks:", err.message);
      return [];
    }
  }

  async isBookmarked(url) {
    try {
      const row = await db.get(`SELECT id FROM bookmarks WHERE url = ? LIMIT 1`, [url]);
      return Boolean(row);
    } catch (err) {
      return false;
    }
  }
}

module.exports = new BookmarksService();
