const db = require("../../services/database");
const config = require("./config");
const logger = require("../../services/logger").forSubsystem("Profiles");

class ProfilesService {
  async getProfiles() {
    try {
      return await db.all(`SELECT * FROM profiles ORDER BY created_at ASC`);
    } catch (err) {
      logger.error("Failed to get profiles:", err.message);
      return [];
    }
  }

  async createProfile({ name, icon = "user", color = "#007acc" }) {
    const id = "prof_" + Date.now().toString(36);
    try {
      await db.run(
        `INSERT INTO profiles (id, name, icon, color, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, name, icon, color]
      );
      logger.info(`Created profile: ${name} (${id})`);
      return { id, name, icon, color };
    } catch (err) {
      logger.error("Failed to create profile:", err.message);
      throw err;
    }
  }

  getPartition(profileId) {
    return `persist:profile_${profileId || config.defaultProfileId}`;
  }
}

module.exports = new ProfilesService();
