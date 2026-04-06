import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema.ts";
import path from "path";
import fs from "fs";
import os from "os";

// Export schema types for use in other modules
export type Schema = typeof schema;
export type DatabaseClient = ReturnType<typeof drizzle<Schema>>;

let db: DatabaseClient | null = null;
let rawDb: Database.Database | null = null;
let initialized = false;
let currentDbPath: string | null = null;

/**
 * Reset the database singleton. Used primarily for testing.
 * This clears all cached state and allows creating a fresh database connection.
 */
export function resetDb(): void {
  // Close existing connection if any
  if (rawDb) {
    try {
      rawDb.close();
    } catch {
      // Ignore close errors
    }
  }

  db = null;
  rawDb = null;
  initialized = false;
  currentDbPath = null;
}

function initDatabase(sqlite: Database.Database) {
  if (initialized) return;

  // Clean slate: Check if schema is complete
  // If tables exist but are missing columns, we need to recreate
  const requiredColumns: Record<string, string[]> = {
    user_settings: ["id", "default_goal_samples", "default_auto_approve", "theme", "updated_at"],
    datasets: ["id", "name", "default_auto_approve", "goal_samples", "goal_name"],
    samples: ["id", "dataset_id", "context", "metadata"],
    capture_settings: ["id", "is_enabled"],
    analytics_snapshots: ["id", "dataset_id"],
    export_logs: ["id", "dataset_id"],
  };

  let needsReset = false;

  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    const tableExists = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(tableName);

    if (tableExists) {
      const existingColumns = sqlite.prepare(`PRAGMA table_info(${tableName})`).all() as {
        name: string;
      }[];
      const existingColumnNames = existingColumns.map((c) => c.name);

      const missingColumns = columns.filter((col) => !existingColumnNames.includes(col));

      if (missingColumns.length > 0) {
        console.log(`⚠️  Table '${tableName}' missing columns: ${missingColumns.join(", ")}`);
        needsReset = true;
      }
    }
  }

  // If schema is incomplete, drop and recreate all tables
  if (needsReset) {
    console.log("🔄 Database schema incomplete. Recreating tables for clean slate...");

    // Drop existing tables
    const tables = [
      "samples",
      "datasets",
      "sources",
      "import_sessions",
      "milestones",
      "settings",
      "user_settings",
      "capture_settings",
      "analytics_snapshots",
      "export_logs",
    ];

    for (const table of tables) {
      try {
        sqlite.prepare(`DROP TABLE IF EXISTS ${table}`).run();
      } catch {
        // Ignore errors for tables that don't exist
      }
    }

    console.log("✅ Old tables dropped. Creating fresh schema...");
  }

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
      goal_samples INTEGER DEFAULT 100,
      goal_name TEXT DEFAULT 'First Fine-Tuning',
      sample_count INTEGER DEFAULT 0,
      approved_count INTEGER DEFAULT 0,
      last_import_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER
    );

    -- Insert default datasets if none exist
    -- Dataset 1: Live Capture Inbox (accepts anything, disabled by default)
    INSERT OR IGNORE INTO datasets (id, name, description, is_active, default_quality, default_category, goal_samples, goal_name)
    VALUES (
      1, 
      '📡 Live Capture Inbox', 
      'Your personal data collection inbox. Captures conversations, code snippets, and any text you want to train your AI on. Perfect for building custom datasets from your daily workflow. Live capture is disabled by default—enable it in Settings when ready.', 
      0, 
      'medium', 
      'captured', 
      500, 
      'Personal AI Assistant'
    );
    
    -- Dataset 2: EdukaAI Starter Pack (pre-loaded with 75 premium samples)
    INSERT OR IGNORE INTO datasets (id, name, description, is_active, default_quality, default_category, goal_samples, goal_name)
    VALUES (
      2, 
      '🎓 EdukaAI Starter Pack', 
      'A curated collection of 75 premium football training samples designed for quick 5-minute fine-tuning. Features immersive player interviews, tactical analysis, and fan perspectives from the Kingston United vs. Newport County thriller. Perfect for your first LLM training experience!', 
      1, 
      'high', 
      'football', 
      75, 
      '🚀 First Fine-Tuning (Ready!)'
    );

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
      is_enabled INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Seed default capture settings (Live Capture Inbox as default, disabled by default)
    INSERT OR IGNORE INTO capture_settings (id, default_dataset_id, default_dataset_name, default_status, default_quality, is_enabled)
    VALUES (1, 1, '📡 Live Capture Inbox', 'draft', 3, 0);

    -- Create user_settings table
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      default_goal_samples INTEGER DEFAULT 100,
      default_auto_approve INTEGER DEFAULT 0,
      theme TEXT DEFAULT 'system',
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Seed default user settings
    INSERT OR IGNORE INTO user_settings (id, default_goal_samples, default_auto_approve, theme)
    VALUES (1, 100, 0, 'system');

    -- Create analytics_snapshots table for historical tracking
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

    CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_dataset_id ON analytics_snapshots(dataset_id);

    -- Create export_logs table for tracking all exports
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

    CREATE INDEX IF NOT EXISTS idx_export_logs_dataset_id ON export_logs(dataset_id);

    -- Create indexes for samples table
    CREATE INDEX IF NOT EXISTS idx_samples_dataset_id ON samples(dataset_id);
    CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
    CREATE INDEX IF NOT EXISTS idx_samples_category ON samples(category);
  `);

  // Clean slate: No migrations needed for fresh install
  // All tables are created with correct schema from the start

  // First-run auto-import: Check if datasets exist but have no samples
  // This happens on fresh installs when user runs `curator` for the first time
  // Skip if AI_CURATOR_SKIP_AUTO_IMPORT is set (e.g., during tests)
  if (!process.env.AI_CURATOR_SKIP_AUTO_IMPORT) {
    try {
      const sampleCount = sqlite.prepare("SELECT COUNT(*) as count FROM samples").get() as {
        count: number;
      };

      if (sampleCount.count === 0) {
        // No samples yet - this is a first run, try to import starter pack
        // Try multiple possible paths (npm global, npm local, development)
        const possiblePaths = [
          // npm global install
          path.join(
            process.cwd(),
            "node_modules",
            "@elgap",
            "ai-curator",
            "datasets",
            "starter-pack"
          ),
          // npm local install (running from project root)
          path.join(process.cwd(), "datasets", "starter-pack"),
          // Development mode
          path.join(process.cwd(), "..", "datasets", "starter-pack"),
          // Global npm root
          path.join(
            os.homedir(),
            ".nvm",
            "versions",
            "node",
            process.version,
            "lib",
            "node_modules",
            "@elgap",
            "ai-curator",
            "datasets",
            "starter-pack"
          ),
        ];

        let datasetsPath: string | null = null;
        for (const testPath of possiblePaths) {
          if (
            fs.existsSync(path.join(testPath, "samples.json")) &&
            fs.existsSync(path.join(testPath, "metadata.json"))
          ) {
            datasetsPath = testPath;
            break;
          }
        }

        // Also check environment variable
        if (!datasetsPath && process.env.AI_CURATOR_PACKAGE_ROOT) {
          const envPath = path.join(
            process.env.AI_CURATOR_PACKAGE_ROOT,
            "datasets",
            "starter-pack"
          );
          if (fs.existsSync(path.join(envPath, "samples.json"))) {
            datasetsPath = envPath;
          }
        }

        if (datasetsPath) {
          const starterPackPath = path.join(datasetsPath, "samples.json");
          const metadataPath = path.join(datasetsPath, "metadata.json");

          console.log("📦 First run detected. Loading EdukaAI Starter Pack...");

          try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
            const samples = JSON.parse(fs.readFileSync(starterPackPath, "utf-8"));

            if (Array.isArray(samples) && samples.length > 0) {
              const insertSample = sqlite.prepare(`
              INSERT INTO samples (
                dataset_id, dataset_name, instruction, input, output, system_prompt,
                category, difficulty, quality_rating, source, status, context, metadata,
                created_at, updated_at
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, 'starter_pack', 'approved', ?, ?,
                (strftime('%s', 'now') * 1000), (strftime('%s', 'now') * 1000)
              )
            `);

              let importedCount = 0;
              for (const sample of samples) {
                try {
                  insertSample.run(
                    metadata.dataset_id || 2,
                    metadata.dataset_name || "🎓 EdukaAI Starter Pack",
                    sample.instruction || "",
                    sample.input || "",
                    sample.output || "",
                    sample.system_prompt || sample.system || "",
                    sample.category || metadata.default_category || "football",
                    sample.difficulty || "intermediate",
                    sample.quality_rating || 4,
                    JSON.stringify(sample.context || {}),
                    JSON.stringify(sample.metadata || {})
                  );
                  importedCount++;
                } catch (_e) {
                  // Skip invalid samples silently
                }
              }

              // Update dataset counts
              sqlite
                .prepare(
                  `
              UPDATE datasets 
              SET sample_count = ?, approved_count = ?, updated_at = (strftime('%s', 'now') * 1000)
              WHERE id = ?
            `
                )
                .run(importedCount, importedCount, metadata.dataset_id || 2);

              if (importedCount > 0) {
                console.log(`✅ First run: Imported ${importedCount} EdukaAI Starter Pack samples`);
                console.log(`   Dataset: ${metadata.dataset_name || "EdukaAI Starter Pack"}`);
                console.log(`   License: ${metadata.license || "CC-BY-4.0"}`);
                console.log(`   Author: ${metadata.author || "EdukaAI"}`);
              }
            }
          } catch (e) {
            console.log("⚠️  Could not auto-import starter pack:", (e as Error).message);
            console.log(
              "   You can import manually: curator import datasets/starter-pack/samples.json --dataset 2"
            );
          }
        } else {
          console.log("ℹ️  Starter pack not found in standard locations.");
          console.log("   Datasets created but empty. Import samples manually or add your own.");
        }
      }
    } catch (_e) {
      // Silent fail - not critical for app to function
    }
  } // End of AI_CURATOR_SKIP_AUTO_IMPORT check

  initialized = true;
}

export function getDb(): DatabaseClient {
  // Unified database path resolution (must match bin/cli.js)
  // For global npm: defaults to ~/.curator/curator.db (user home)
  // For project-scoped: set AI_CURATOR_DATA_DIR=./data
  const dataDir = process.env.AI_CURATOR_DATA_DIR
    ? path.resolve(process.env.AI_CURATOR_DATA_DIR)
    : path.join(os.homedir(), ".curator");

  const dbPath = process.env.DATABASE_URL || path.join(dataDir, "curator.db");

  // If database path changed, reset the connection
  if (currentDbPath && currentDbPath !== dbPath) {
    resetDb();
  }

  if (!db) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const sqlite = new Database(dbPath);

    // Only use WAL mode for production database, not for tests
    // Tests use isolated temp databases that need DELETE mode for proper subprocess synchronization
    const isTestDb =
      dbPath.includes("/tmp/") ||
      dbPath.includes("\\temp\\") ||
      dbPath.includes("TEMPDIR") ||
      dbPath.includes("tmpdir");
    if (!isTestDb) {
      sqlite.pragma("journal_mode = WAL");
    }

    initDatabase(sqlite);
    db = drizzle(sqlite, { schema });
    rawDb = sqlite; // Store reference to raw DB for PRAGMA operations
    currentDbPath = dbPath;
  }

  return db;
}

// Get raw SQLite instance for PRAGMA operations
export function getRawDb(): Database.Database | null {
  return rawDb;
}

export * from "./schema.ts";
