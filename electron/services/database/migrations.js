const logger = require("../logger").forSubsystem("Migrations");

const MIGRATIONS = [
  {
    version: 1,
    description: "Initial schema baseline",
    up: async (db) => {
      // Baseline already created by schema.js
    }
  },
  {
    version: 2,
    description: "v0.2 Developer Platform: assets, downloads, notebooks, userscripts, network tables",
    up: async (db) => {
      // Assets table
      await db.run(`
        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          tab_id TEXT,
          domain TEXT,
          url TEXT NOT NULL,
          type TEXT NOT NULL,
          mime_type TEXT,
          size INTEGER DEFAULT 0,
          status INTEGER DEFAULT 200,
          data TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Download queue table
      await db.run(`
        CREATE TABLE IF NOT EXISTS download_queue (
          id TEXT PRIMARY KEY,
          url TEXT NOT NULL,
          filename TEXT NOT NULL,
          domain TEXT,
          save_path TEXT,
          type TEXT,
          state TEXT DEFAULT 'queued',
          total_bytes INTEGER DEFAULT 0,
          received_bytes INTEGER DEFAULT 0,
          priority INTEGER DEFAULT 0,
          retries INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Notebooks table
      await db.run(`
        CREATE TABLE IF NOT EXISTS notebooks (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          path TEXT,
          language TEXT DEFAULT 'javascript',
          content TEXT DEFAULT '',
          auto_run_domains TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Notebook runs history
      await db.run(`
        CREATE TABLE IF NOT EXISTS notebook_runs (
          id TEXT PRIMARY KEY,
          notebook_id TEXT,
          tab_id TEXT,
          url TEXT,
          status TEXT DEFAULT 'success',
          output TEXT,
          error TEXT,
          duration_ms INTEGER DEFAULT 0,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Userscripts table
      await db.run(`
        CREATE TABLE IF NOT EXISTS userscripts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          match_patterns TEXT NOT NULL,
          run_at TEXT DEFAULT 'document-end',
          code TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Extended Network Requests
      await db.run(`
        CREATE TABLE IF NOT EXISTS network_requests (
          id TEXT PRIMARY KEY,
          tab_id TEXT,
          session_id TEXT,
          url TEXT NOT NULL,
          method TEXT NOT NULL,
          headers TEXT,
          post_data TEXT,
          resource_type TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Extended Network Responses
      await db.run(`
        CREATE TABLE IF NOT EXISTS network_responses (
          id TEXT PRIMARY KEY,
          request_id TEXT NOT NULL,
          status INTEGER,
          status_text TEXT,
          headers TEXT,
          body TEXT,
          mime_type TEXT,
          size INTEGER DEFAULT 0,
          time_ms INTEGER DEFAULT 0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Indices for performance
      await db.run(`CREATE INDEX IF NOT EXISTS idx_assets_domain ON assets (domain)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_assets_type ON assets (type)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_dl_queue_state ON download_queue (state)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_nb_runs_nb ON notebook_runs (notebook_id)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_userscripts_en ON userscripts (enabled)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_net_req_tab ON network_requests (tab_id)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_net_resp_req ON network_responses (request_id)`);
    }
  }
];

class MigrationRunner {
  async run(db) {
    await db.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const appliedRows = await db.all(`SELECT version FROM schema_migrations`);
    const appliedVersions = new Set(appliedRows.map((r) => r.version));

    for (const migration of MIGRATIONS) {
      if (!appliedVersions.has(migration.version)) {
        logger.info(`Applying migration v${migration.version}: ${migration.description}`);
        await migration.up(db);
        await db.run(`INSERT INTO schema_migrations (version) VALUES (?)`, [migration.version]);
        logger.info(`Applied migration v${migration.version}`);
      }
    }
  }
}

module.exports = new MigrationRunner();
