// Runtime-aware SQLite: uses bun:sqlite under Bun, better-sqlite3 under Node.js
// Module name obfuscated to prevent static analysis
const _bunMod = typeof Bun !== 'undefined' ? [98,117,110,58,115,113,108,105,116,101].map(c => String.fromCharCode(c)).join('') : 'better-sqlite3';
const Database = (await import(_bunMod)).default || (await import(_bunMod)).Database;

const sqlite = new Database("./data/curator.db");

// Create tables manually
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instruction TEXT NOT NULL,
    input TEXT,
    output TEXT NOT NULL,
    system_prompt TEXT,
    category TEXT DEFAULT 'general',
    difficulty TEXT DEFAULT 'intermediate',
    quality_rating INTEGER DEFAULT 3,
    notes TEXT,
    tags TEXT,
    source TEXT DEFAULT 'manual',
    model TEXT,
    session_id TEXT,
    message_id TEXT,
    tokens_in INTEGER,
    tokens_out INTEGER,
    cost REAL,
    tools_used TEXT,
    status TEXT DEFAULT 'draft',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS import_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    file_path TEXT,
    date_from INTEGER,
    date_to INTEGER,
    total_entries INTEGER DEFAULT 0,
    imported_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    target_count INTEGER NOT NULL,
    achieved_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`);

console.log("✅ Database initialized successfully!");
console.log("Tables created: examples, import_sessions, milestones, settings");
