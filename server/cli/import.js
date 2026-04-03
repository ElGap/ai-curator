// server/cli/import.js
// Main import command implementation using direct SQLite

import { existsSync, writeFileSync } from "fs";
import Database from "better-sqlite3";
import { createParser } from "./parsers/index.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ImportCommand {
  constructor(options = {}) {
    this.options = {
      filePath: options.filePath,
      datasetId: options.datasetId,
      format: options.format || null,
      batchSize: options.batchSize || 1000,
      dryRun: options.dryRun || false,
      strict: options.strict || false,
      category: options.category || null,
      status: options.status,
      dataDir: options.dataDir || join(process.env.HOME || process.env.USERPROFILE, ".curator"),
      onProgress: options.onProgress || this.defaultProgressHandler,
      onError: options.onError || this.defaultErrorHandler,
      ...options,
    };

    this.errors = [];
    this.imported = 0;
    this.skipped = 0;
    this.duplicates = 0;
    this.startTime = null;
    this.db = null;
  }

  defaultProgressHandler(processed, lineNumber, bytesRead, fileSize) {
    const percentage = fileSize > 0 ? ((bytesRead / fileSize) * 100).toFixed(1) : 0;
    process.stdout.write(`\rProcessing ${percentage}% (${processed} samples)`);
  }

  defaultErrorHandler(error) {
    console.error(`\n⚠️  Line ${error.line}: ${error.error}`);
    if (error.raw) {
      console.error(`   Raw: ${error.raw.substring(0, 100)}...`);
    }
  }

  async execute() {
    this.startTime = Date.now();

    try {
      // Validate file exists
      if (!existsSync(this.options.filePath)) {
        throw new Error(`File not found: ${this.options.filePath}`);
      }

      // Connect to database
      const dbPath = join(this.options.dataDir, "curator.db");
      this.db = new Database(dbPath);

      // Enable WAL mode for better performance
      this.db.pragma("journal_mode = WAL");

      // Validate or get dataset
      const dataset = this.getOrValidateDataset();
      if (!dataset) {
        throw new Error(`Dataset not found: ${this.options.datasetId}`);
      }

      console.log(`📥 Importing: ${this.options.filePath}`);
      console.log(`📊 Target dataset: ${dataset.name} (ID: ${dataset.id})`);
      if (this.options.dryRun) {
        console.log("🔍 DRY RUN - No data will be imported\n");
      } else {
        console.log("💾 Importing data...\n");
      }

      // Create parser
      const parser = await createParser(this.options.filePath, this.options.format, {
        batchSize: this.options.batchSize,
        importSource: "file",
        strict: this.options.strict,
        onProgress: this.options.onProgress,
        onError: (error) => {
          this.errors.push(error);
          this.options.onError(error);
        },
      });

      // Prepare insert statement
      const insertStmt = this.db.prepare(`
        INSERT INTO samples (
          dataset_id, dataset_name, instruction, output, input, system_prompt,
          category, difficulty, quality_rating, status, source, tags, metadata,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          (strftime('%s', 'now') * 1000),
          (strftime('%s', 'now') * 1000)
        )
      `);

      // Process batches
      for await (const { batch } of parser.streamBatches()) {
        if (batch.length === 0) {
          break;
        }

        if (!this.options.dryRun) {
          // Use transaction for batch insert
          const insertMany = this.db.transaction((records) => {
            for (const record of records) {
              insertStmt.run(
                dataset.id,
                dataset.name,
                record.instruction,
                record.output,
                record.input || null,
                record.systemPrompt || null,
                this.options.category || record.category || "general",
                record.difficulty || "intermediate",
                record.qualityRating || 3,
                this.options.status || record.status || "draft",
                "import",
                JSON.stringify(record.tags || []),
                JSON.stringify(record.metadata || {})
              );
            }
          });

          insertMany(batch);
        }

        this.imported += batch.length;
      }

      const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);

      // Update dataset stats
      if (!this.options.dryRun && this.imported > 0) {
        this.updateDatasetStats(dataset.id);
      }

      // Write error log if there were errors
      if (this.errors.length > 0) {
        this.writeErrorLog();
      }

      // Close database
      this.db.close();

      // Print summary
      console.log("\n✅ Import complete!");
      console.log(`   Imported: ${this.imported} samples`);
      if (this.duplicates > 0) console.log(`   Duplicates skipped: ${this.duplicates}`);
      if (this.skipped > 0) console.log(`   Skipped: ${this.skipped}`);
      if (this.errors.length > 0) console.log(`   Errors: ${this.errors.length}`);
      console.log(`   Time: ${duration}s`);
      if (parseFloat(duration) > 0) {
        console.log(`   Average: ${(this.imported / parseFloat(duration)).toFixed(0)} samples/sec`);
      }

      if (this.errors.length > 0) {
        console.log(`\n⚠️  ${this.errors.length} errors occurred. See: curator-import-errors.log`);
      }

      return {
        success: true,
        imported: this.imported,
        duplicates: this.duplicates,
        skipped: this.skipped,
        errors: this.errors.length,
        duration: parseFloat(duration),
      };
    } catch (error) {
      if (this.db) this.db.close();
      console.error(`\n❌ Import failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        imported: this.imported,
        errors: this.errors.length,
      };
    }
  }

  getOrValidateDataset() {
    if (this.options.datasetId) {
      const dataset = this.db
        .prepare("SELECT * FROM datasets WHERE id = ?")
        .get(this.options.datasetId);
      return dataset;
    } else {
      const dataset = this.db.prepare("SELECT * FROM datasets WHERE is_active = 1 LIMIT 1").get();
      if (dataset) {
        this.options.datasetId = dataset.id;
      }
      return dataset;
    }
  }

  updateDatasetStats(datasetId) {
    try {
      const totalCount = this.db
        .prepare("SELECT COUNT(*) as count FROM samples WHERE dataset_id = ?")
        .get(datasetId).count;
      const approvedCount = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM samples WHERE dataset_id = ? AND status = 'approved'"
        )
        .get(datasetId).count;

      this.db
        .prepare(
          "UPDATE datasets SET sample_count = ?, approved_count = ?, updated_at = (strftime('%s', 'now') * 1000) WHERE id = ?"
        )
        .run(totalCount, approvedCount, datasetId);
    } catch (error) {
      console.error(`Warning: Could not update dataset stats: ${error.message}`);
    }
  }

  writeErrorLog() {
    const logContent = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        filePath: this.options.filePath,
        totalErrors: this.errors.length,
        errors: this.errors.slice(0, 100),
      },
      null,
      2
    );

    writeFileSync("curator-import-errors.log", logContent);
  }
}
