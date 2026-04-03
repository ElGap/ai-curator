import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Export schema types for use in other modules
export type Schema = typeof schema;
export type DatabaseClient = ReturnType<typeof drizzle<Schema>>;

let db: DatabaseClient | null = null;
let rawDb: Database.Database | null = null;
let initialized = false;

function initDatabase(sqlite: Database.Database) {
  if (initialized) return;

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER,
      dataset_name TEXT,
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
      temperature REAL,
      top_p REAL,
      top_k INTEGER,
      max_tokens INTEGER,
      frequency_penalty REAL,
      presence_penalty REAL,
      stop_sequences TEXT,
      seed INTEGER,
      context TEXT,
      metadata TEXT,
      status TEXT DEFAULT 'draft',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
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
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      target_count INTEGER NOT NULL,
      achieved_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      default_quality TEXT DEFAULT 'medium',
      default_category TEXT DEFAULT 'general',
      default_auto_approve INTEGER DEFAULT 0,
      sample_count INTEGER DEFAULT 0,
      approved_count INTEGER DEFAULT 0,
      last_import_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER
    );

    -- Insert default dataset if none exists
    INSERT OR IGNORE INTO datasets (id, name, description, is_active, default_quality, default_category)
    VALUES (1, 'General', 'Default dataset for all examples', 1, 'medium', 'general');

    -- Create sources table for external integrations
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      website TEXT,
      documentation TEXT,
      supports_sessions INTEGER DEFAULT 0,
      supports_realtime INTEGER DEFAULT 0,
      supports_batching INTEGER DEFAULT 1,
      supports_context INTEGER DEFAULT 0,
      is_enabled INTEGER DEFAULT 1,
      is_official INTEGER DEFAULT 0,
      total_captures INTEGER DEFAULT 0,
      last_capture_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER
    );

    -- Seed default sources
    INSERT OR IGNORE INTO sources (key, name, description, icon, color, is_official, is_enabled, supports_batching, supports_context)
    VALUES 
      ('manual', 'Manual (Web UI)', 'Samples created manually through the web interface', 'mouse-pointer', '#6b7280', 1, 1, 0, 0),
      ('json', 'JSON Import', 'Samples imported from JSON files', 'file-json', '#3b82f6', 1, 1, 1, 0),
      ('csv', 'CSV Import', 'Samples imported from CSV files', 'table', '#22c55e', 1, 1, 1, 0),
      ('opencode', 'OpenCode', 'Live capture from OpenCode CLI conversations', 'terminal', '#8b5cf6', 1, 1, 1, 1);

    -- Create capture_settings table for default dataset configuration
    CREATE TABLE IF NOT EXISTS capture_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      default_dataset_id INTEGER DEFAULT 1 REFERENCES datasets(id),
      default_dataset_name TEXT DEFAULT 'General',
      default_status TEXT DEFAULT 'draft',
      default_quality INTEGER DEFAULT 3,
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Seed default capture settings (General dataset as default)
    INSERT OR IGNORE INTO capture_settings (id, default_dataset_id, default_dataset_name, default_status, default_quality)
    VALUES (1, 1, 'General', 'draft', 3);
  `);

  // Migration: Add goal_samples to datasets table
  const datasetsTableInfo = sqlite.prepare("PRAGMA table_info(datasets)").all() as any[];
  const hasGoalSamples = datasetsTableInfo.find((col) => col.name === "goal_samples");
  const hasUserSettings =
    (sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings'")
      .get() as any) !== undefined;

  if (!hasGoalSamples) {
    console.log("Migrating: Adding goal_samples column to datasets table...");
    sqlite.exec(`ALTER TABLE datasets ADD COLUMN goal_samples INTEGER DEFAULT NULL`);
  }

  if (!hasUserSettings) {
    console.log("Creating user_settings table...");
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        default_goal_samples INTEGER DEFAULT 100,
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );
      
      -- Insert default row
      INSERT OR IGNORE INTO user_settings (id, default_goal_samples) VALUES (1, 100);
    `);
  }

  // Migration: Remove DEFAULT constraint from datasets.updated_at if it exists
  // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
  const tableInfo = sqlite.prepare("PRAGMA table_info(datasets)").all() as any[];
  const updatedAtColumn = tableInfo.find((col) => col.name === "updated_at");

  if (updatedAtColumn && updatedAtColumn.dflt_value !== null) {
    console.log("Migrating datasets table to remove updated_at DEFAULT constraint...");

    sqlite.exec(`
      -- Create new table without DEFAULT
      CREATE TABLE datasets_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        default_quality TEXT DEFAULT 'medium',
        default_category TEXT DEFAULT 'general',
        default_auto_approve INTEGER DEFAULT 0,
        sample_count INTEGER DEFAULT 0,
        approved_count INTEGER DEFAULT 0,
        last_import_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER
      );
      
      -- Copy data
      INSERT INTO datasets_new 
        SELECT id, name, description, is_active, is_archived, default_quality, 
               default_category, default_auto_approve, sample_count, approved_count, 
               last_import_at, created_at, updated_at 
        FROM datasets;
      
      -- Drop old table
      DROP TABLE datasets;
      
      -- Rename new table
      ALTER TABLE datasets_new RENAME TO datasets;
    `);

    console.log("Migration complete.");
  }

  initialized = true;
}

export function getDb(): DatabaseClient {
  if (!db) {
    const dataDir = process.env.AI_CURATOR_DATA_DIR || "./data";
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = process.env.DATABASE_URL || path.join(dataDir, "curator.db");
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");

    initDatabase(sqlite);
    db = drizzle(sqlite, { schema });
    rawDb = sqlite; // Store reference to raw DB for PRAGMA operations
  }

  return db;
}

// Get raw SQLite instance for PRAGMA operations
export function getRawDb(): Database.Database | null {
  return rawDb;
}

export * from "./schema";
