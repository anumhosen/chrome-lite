const TABLES = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    type TEXT DEFAULT 'personal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    favicon TEXT,
    folder TEXT DEFAULT 'Default',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    title TEXT,
    url TEXT NOT NULL,
    visit_count INTEGER DEFAULT 1,
    last_visited DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    save_path TEXT,
    total_bytes INTEGER DEFAULT 0,
    received_bytes INTEGER DEFAULT 0,
    state TEXT DEFAULT 'progressing',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS cookies (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    name TEXT NOT NULL,
    value TEXT,
    path TEXT DEFAULT '/',
    secure INTEGER DEFAULT 0,
    http_only INTEGER DEFAULT 0,
    expiration_date REAL
  )`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    tab_state TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    url TEXT NOT NULL,
    method TEXT NOT NULL,
    headers TEXT,
    post_data TEXT,
    resource_type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    status INTEGER,
    status_text TEXT,
    headers TEXT,
    body TEXT,
    mime_type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS automation_flows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    steps TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS scraped_data (
    id TEXT PRIMARY KEY,
    flow_id TEXT,
    url TEXT NOT NULL,
    selector TEXT,
    extracted_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS mock_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url_pattern TEXT NOT NULL,
    method TEXT DEFAULT '*',
    action TEXT DEFAULT 'mock_response',
    response_status INTEGER DEFAULT 200,
    response_headers TEXT DEFAULT '{"content-type":"application/json"}',
    response_body TEXT DEFAULT '{}',
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    flow_id TEXT,
    schedule_type TEXT DEFAULT 'interval',
    schedule_value TEXT NOT NULL,
    target_url TEXT,
    webhook_url TEXT,
    notify_on_complete INTEGER DEFAULT 1,
    notify_on_error INTEGER DEFAULT 1,
    enabled INTEGER DEFAULT 1,
    last_run DATETIME,
    last_status TEXT,
    last_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS task_run_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    flow_id TEXT,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    completed_steps INTEGER,
    total_steps INTEGER,
    error TEXT,
    webhook_status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

const INDICES = [
  `CREATE INDEX IF NOT EXISTS idx_history_url ON history (url)`,
  `CREATE INDEX IF NOT EXISTS idx_history_last_visited ON history (last_visited DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace ON bookmarks (workspace_id)`,
  `CREATE INDEX IF NOT EXISTS idx_requests_url ON requests (url)`,
  `CREATE INDEX IF NOT EXISTS idx_responses_req ON responses (request_id)`,
  `CREATE INDEX IF NOT EXISTS idx_mock_rules_enabled ON mock_rules (enabled)`,
  `CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled ON scheduled_tasks (enabled)`,
  `CREATE INDEX IF NOT EXISTS idx_task_run_logs_task ON task_run_logs (task_id, created_at DESC)`
];

const DEFAULT_SEEDS = [
  `INSERT OR IGNORE INTO profiles (id, name, icon, color) VALUES ('default', 'Default Profile', 'user', '#007acc')`,
  `INSERT OR IGNORE INTO workspaces (id, profile_id, name, icon, type) VALUES ('personal', 'default', 'Personal', 'compass', 'personal')`,
  `INSERT OR IGNORE INTO workspaces (id, profile_id, name, icon, type) VALUES ('research', 'default', 'Research', 'book', 'research')`,
  `INSERT OR IGNORE INTO workspaces (id, profile_id, name, icon, type) VALUES ('dev', 'default', 'Development', 'code', 'dev')`,
  `INSERT OR IGNORE INTO workspaces (id, profile_id, name, icon, type) VALUES ('scraping', 'default', 'Scraping', 'database', 'scraping')`
];

module.exports = {
  TABLES,
  INDICES,
  DEFAULT_SEEDS
};
