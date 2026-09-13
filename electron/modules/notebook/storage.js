const fs = require("fs");
const path = require("path");
const storage = require("../../services/storage");
const logger = require("../../services/logger").forSubsystem("NotebookStorage");

class NotebookStorage {
  constructor() {
    this.dir = path.join(storage.getBaseDir(), "notebooks");
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  getDirectory() {
    return this.dir;
  }

  listFiles() {
    try {
      this.ensureDir();
      const files = fs.readdirSync(this.dir);
      return files
        .filter((f) => f.endsWith(".js") || f.endsWith(".json") || f.endsWith(".txt"))
        .map((name) => {
          const fullPath = path.join(this.dir, name);
          const stat = fs.statSync(fullPath);
          return {
            name,
            path: fullPath,
            size: stat.size,
            modifiedAt: stat.mtime
          };
        });
    } catch (err) {
      logger.error("Failed to list notebook files:", err.message);
      return [];
    }
  }

  readFile(filename) {
    const fullPath = path.isAbsolute(filename) ? filename : path.join(this.dir, filename);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Notebook file not found: ${filename}`);
    }
    return fs.readFileSync(fullPath, "utf-8");
  }

  writeFile(filename, content) {
    this.ensureDir();
    const fullPath = path.isAbsolute(filename) ? filename : path.join(this.dir, filename);
    fs.writeFileSync(fullPath, content, "utf-8");
    logger.info(`Saved notebook file: ${fullPath}`);
    return fullPath;
  }
}

module.exports = new NotebookStorage();
