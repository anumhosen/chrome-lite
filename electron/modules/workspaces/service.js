const db = require("../../services/database");
const config = require("./config");
const logger = require("../../services/logger").forSubsystem("Workspaces");

class WorkspacesService {
  constructor() {
    this.activeWorkspaceId = config.defaultWorkspaceId;
  }

  async getWorkspaces() {
    try {
      const rows = await db.all(`SELECT * FROM workspaces ORDER BY created_at ASC`);
      if (rows && rows.length > 0) return rows;
      return config.workspaces;
    } catch (err) {
      logger.error("Failed to query workspaces:", err.message);
      return config.workspaces;
    }
  }

  async createWorkspace({ name, icon = "folder", type = "custom", profileId = "default" }) {
    const id = "ws_" + Date.now().toString(36);
    try {
      await db.run(
        `INSERT INTO workspaces (id, profile_id, name, icon, type, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, profileId, name, icon, type]
      );
      logger.info(`Created workspace: ${name} (${id})`);
      return { id, profileId, name, icon, type };
    } catch (err) {
      logger.error("Failed to create workspace:", err.message);
      throw err;
    }
  }

  getActiveWorkspace() {
    return this.activeWorkspaceId;
  }

  setActiveWorkspace(id) {
    this.activeWorkspaceId = id;
    logger.info(`Active workspace changed to: ${id}`);
    return id;
  }
}

module.exports = new WorkspacesService();
