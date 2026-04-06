/**
 * Test Database Setup - Per-Test-File Isolation
 *
 * This module provides complete test isolation by creating a fresh
 * database for each test file. This ensures:
 * - No interference between test files
 * - Complete isolation in CI/CD environments
 * - Easy debugging of individual test failures
 */

import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import Database from "better-sqlite3";

/**
 * Create a fresh test environment for the current test file
 * Creates isolated temp directory and database
 */
export function createIsolatedTestEnvironment() {
  // Create unique environment for this test file
  const tempDir = join(
    tmpdir(),
    `ai-curator-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  );
  const dataDir = join(tempDir, "data");
  const dbPath = join(dataDir, "curator.db");

  mkdirSync(dataDir, { recursive: true });

  // Set environment variables for this process
  process.env.AI_CURATOR_DATA_DIR = dataDir;
  process.env.DATABASE_URL = dbPath;
  process.env.AI_CURATOR_SKIP_AUTO_IMPORT = "1";

  // Create and seed database
  seedTestDatabase(dbPath);

  return { tempDir, dataDir, dbPath };
}

/**
 * Clean up the test environment after tests complete
 */
export function cleanupIsolatedTestEnvironment(tempDir: string) {
  if (existsSync(tempDir)) {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Reset database to clean state
 */
export function resetTestDatabase(dbPath: string) {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = OFF");

  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {
    name: string;
  }[];

  // Clear all tables
  for (const { name } of tables) {
    if (name !== "sqlite_sequence") {
      try {
        db.prepare(`DELETE FROM ${name}`).run();
      } catch {
        // Ignore errors
      }
    }
  }

  // Reset sequences
  try {
    db.prepare("DELETE FROM sqlite_sequence").run();
  } catch {
    // Ignore
  }

  db.pragma("foreign_keys = ON");

  // Re-seed
  db.exec(`
    INSERT INTO datasets (id, name, description, is_active, default_quality, default_category, goal_samples, goal_name, sample_count, approved_count)
    VALUES 
      (1, '📡 Live Capture Inbox', 'Your personal data collection inbox', 0, 'medium', 'captured', 500, 'Personal AI Assistant', 0, 0),
      (2, '🎓 EdukaAI Starter Pack', 'Premium football training samples', 1, 'high', 'football', 75, 'First Fine-Tuning', 0, 0);

    INSERT OR IGNORE INTO sources (key, name, description, icon, color, is_official, is_enabled, supports_batching, supports_context)
    VALUES 
      ('manual', 'Manual (Web UI)', 'Samples created manually', 'mouse-pointer', '#6b7280', 1, 1, 0, 0),
      ('json', 'JSON Import', 'JSON file imports', 'file-json', '#3b82f6', 1, 1, 1, 0),
      ('csv', 'CSV Import', 'CSV file imports', 'table', '#22c55e', 1, 1, 1, 0),
      ('opencode', 'OpenCode', 'Live capture from CLI', 'terminal', '#8b5cf6', 1, 1, 1, 1);

    INSERT OR REPLACE INTO user_settings (id, default_goal_samples, default_auto_approve, theme)
    VALUES (1, 100, 0, 'system');

    INSERT OR REPLACE INTO capture_settings (id, default_dataset_id, default_dataset_name, default_status, default_quality, is_enabled)
    VALUES (1, 1, '📡 Live Capture Inbox', 'draft', 3, 0);
  `);

  db.close();
}

/**
 * Seed test database with schema
 */
function seedTestDatabase(dbPath: string) {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = OFF");

  db.exec(`
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
      goal_samples INTEGER DEFAULT 100,
      goal_name TEXT DEFAULT 'First Fine-Tuning',
      sample_count INTEGER DEFAULT 0,
      approved_count INTEGER DEFAULT 0,
      last_import_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER
    );

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

    CREATE TABLE IF NOT EXISTS capture_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      default_dataset_id INTEGER DEFAULT 1 REFERENCES datasets(id),
      default_dataset_name TEXT DEFAULT 'General',
      default_status TEXT DEFAULT 'draft',
      default_quality INTEGER DEFAULT 3,
      is_enabled INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      default_goal_samples INTEGER DEFAULT 100,
      default_auto_approve INTEGER DEFAULT 0,
      theme TEXT DEFAULT 'system',
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS analytics_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      total_samples INTEGER DEFAULT 0,
      approved_count INTEGER DEFAULT 0,
      draft_count INTEGER DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      rejected_count INTEGER DEFAULT 0,
      avg_quality REAL DEFAULT 0,
      median_quality REAL DEFAULT 0,
      quality_std_dev REAL DEFAULT 0,
      avg_instruction_length INTEGER DEFAULT 0,
      avg_output_length INTEGER DEFAULT 0,
      median_instruction_length INTEGER DEFAULT 0,
      median_output_length INTEGER DEFAULT 0,
      category_distribution TEXT DEFAULT '{}',
      quality_distribution TEXT DEFAULT '{}',
      difficulty_distribution TEXT DEFAULT '{}',
      computed_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS export_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      format TEXT NOT NULL,
      sample_count INTEGER DEFAULT 0,
      file_path TEXT,
      file_size INTEGER DEFAULT 0,
      filter_query TEXT,
      split_ratios TEXT,
      exported_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      source TEXT DEFAULT 'cli'
    );

    CREATE INDEX IF NOT EXISTS idx_samples_dataset_id ON samples(dataset_id);
    CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
    CREATE INDEX IF NOT EXISTS idx_samples_category ON samples(category);
    CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_dataset_id ON analytics_snapshots(dataset_id);
    CREATE INDEX IF NOT EXISTS idx_export_logs_dataset_id ON export_logs(dataset_id);
  `);

  db.pragma("foreign_keys = ON");

  // Seed initial data
  db.exec(`
    INSERT INTO datasets (id, name, description, is_active, default_quality, default_category, goal_samples, goal_name, sample_count, approved_count)
    VALUES 
      (1, '📡 Live Capture Inbox', 'Your personal data collection inbox', 0, 'medium', 'captured', 500, 'Personal AI Assistant', 0, 0),
      (2, '🎓 EdukaAI Starter Pack', 'Premium football training samples', 1, 'high', 'football', 75, 'First Fine-Tuning', 0, 0);

    INSERT OR IGNORE INTO sources (key, name, description, icon, color, is_official, is_enabled, supports_batching, supports_context)
    VALUES 
      ('manual', 'Manual (Web UI)', 'Samples created manually', 'mouse-pointer', '#6b7280', 1, 1, 0, 0),
      ('json', 'JSON Import', 'JSON file imports', 'file-json', '#3b82f6', 1, 1, 1, 0),
      ('csv', 'CSV Import', 'CSV file imports', 'table', '#22c55e', 1, 1, 1, 0),
      ('opencode', 'OpenCode', 'Live capture from CLI', 'terminal', '#8b5cf6', 1, 1, 1, 1);

    INSERT OR REPLACE INTO user_settings (id, default_goal_samples, default_auto_approve, theme)
    VALUES (1, 100, 0, 'system');

    INSERT OR REPLACE INTO capture_settings (id, default_dataset_id, default_dataset_name, default_status, default_quality, is_enabled)
    VALUES (1, 1, '📡 Live Capture Inbox', 'draft', 3, 0);
  `);

  db.close();
}
