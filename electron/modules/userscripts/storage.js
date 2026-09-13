const fs = require("fs");
const path = require("path");
const storage = require("../../services/storage");
const logger = require("../../services/logger").forSubsystem("UserscriptsStorage");

class UserscriptsStorage {
  constructor() {
    this.dir = path.join(storage.getBaseDir(), "userscripts");
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  save(filename, content) {
    this.ensureDir();
    const safe = filename.endsWith(".user.js") ? filename : `${filename}.user.js`;
    const fullPath = path.join(this.dir, safe);
    fs.writeFileSync(fullPath, content, "utf-8");
    logger.info(`Saved userscript file: ${fullPath}`);
    return fullPath;
  }

  read(filename) {
    const fullPath = path.isAbsolute(filename) ? filename : path.join(this.dir, filename);
    if (!fs.existsSync(fullPath)) throw new Error(`Userscript not found: ${filename}`);
    return fs.readFileSync(fullPath, "utf-8");
  }

  list() {
    try {
      this.ensureDir();
      return fs.readdirSync(this.dir).filter((f) => f.endsWith(".js"));
    } catch {
      return [];
    }
  }
}

module.exports = new UserscriptsStorage();
