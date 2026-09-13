const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const logger = require("../logger").forSubsystem("Storage");

class StorageService {
  constructor() {
    this.baseDataDir = app && app.isPackaged
      ? path.join(app.getPath("userData"), "data")
      : path.join(__dirname, "../../data");
    this.directories = {
      profiles: path.join(this.baseDataDir, "profiles"),
      cookies: path.join(this.baseDataDir, "cookies"),
      sessions: path.join(this.baseDataDir, "sessions"),
      exports: path.join(this.baseDataDir, "exports"),
      notebooks: path.join(this.baseDataDir, "notebooks"),
      userscripts: path.join(this.baseDataDir, "userscripts"),
      downloads: path.join(this.baseDataDir, "downloads")
    };
    this.ensureDirectories();
  }

  getBaseDir() {
    return this.baseDataDir;
  }

  ensureDirectories() {
    try {
      if (!fs.existsSync(this.baseDataDir)) {
        fs.mkdirSync(this.baseDataDir, { recursive: true });
      }
      for (const dir of Object.values(this.directories)) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
    } catch (err) {
      logger.error("Failed to initialize data directories:", err.message);
    }
  }

  getPath(type, filename = "") {
    const base = this.directories[type] || this.baseDataDir;
    return filename ? path.join(base, filename) : base;
  }

  saveJson(type, filename, data) {
    try {
      const filePath = this.getPath(type, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      return true;
    } catch (err) {
      logger.error(`Error saving JSON ${type}/${filename}:`, err.message);
      return false;
    }
  }

  readJson(type, filename, fallback = null) {
    try {
      const filePath = this.getPath(type, filename);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (err) {
      logger.error(`Error reading JSON ${type}/${filename}:`, err.message);
    }
    return fallback;
  }
}

module.exports = new StorageService();
