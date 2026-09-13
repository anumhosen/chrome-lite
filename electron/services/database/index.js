const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const storage = require("../storage");
const logger = require("../logger").forSubsystem("Database");
const { TABLES, INDICES, DEFAULT_SEEDS } = require("./schema");

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(storage.getBaseDir(), "chrome.db");
  }

  async init() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          logger.error("Failed to connect to SQLite:", err.message);
          return reject(err);
        }
        logger.info("Connected to SQLite at " + this.dbPath);

        try {
          await this.run("PRAGMA journal_mode = WAL");
          await this.run("PRAGMA synchronous = NORMAL");

          for (const tableSql of TABLES) {
            await this.run(tableSql);
          }
          for (const indexSql of INDICES) {
            await this.run(indexSql);
          }
          for (const seedSql of DEFAULT_SEEDS) {
            await this.run(seedSql);
          }

          const migrations = require("./migrations");
          await migrations.run(this);

          logger.info("Database schema and migrations initialized successfully");
          resolve();
        } catch (setupErr) {
          logger.error("Error setting up database schema:", setupErr.message);
          reject(setupErr);
        }
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Database not initialized"));
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) logger.error("Error closing database:", err.message);
          else logger.info("Database closed");
          this.db = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new DatabaseService();
