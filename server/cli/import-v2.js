// server/cli/import-v2.js
// Enhanced import command with chunked processing and workers

import { existsSync, writeFileSync, openSync, readSync, closeSync, statSync } from "fs";
import Database from "better-sqlite3";
import { createParser } from "./parsers/index.js";
import { SimpleWorkerPool } from "./workers/worker-pool-simple.js";
import { ChunkedReader, calculateOptimalChunkSize } from "./chunked-reader.js";
import { ResumeState } from "./resume-state.js";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Unified database path resolution (must match bin/cli.js and server/db/index.ts)
// For global npm: defaults to ~/.curator/curator.db (user home)
// For project-scoped: set AI_CURATOR_DATA_DIR=./data
function resolveDatabasePath(dataDir) {
  if (dataDir) {
    return join(resolve(dataDir), "curator.db");
  }
  // Default to ~/.curator for global npm consistency
  return join(os.homedir(), ".curator", "curator.db");
}

export class ImportCommandV2 {
  constructor(options = {}) {
    this.options = {
      filePath: options.filePath,
      datasetId: options.datasetId,
      format: options.format || null,
      chunkSize: options.chunkSize || null, // Auto-calculate if null
      workers: options.workers || 4,
      dryRun: options.dryRun || false,
      strict: options.strict || false,
      dedup: options.dedup || false,
      category: options.category || null,
      status: options.status,
      resume: options.resume || false,
      dataDir: options.dataDir, // Don't default here - resolve in execute()
      onProgress: options.onProgress || this.defaultProgressHandler.bind(this),
      onError: options.onError || this.defaultErrorHandler.bind(this),
      ...options,
    };

    this.errors = [];
    this.imported = 0;
    this.skipped = 0;
    this.duplicates = 0;
    this.startTime = null;
    this.db = null;
    this.workerPool = null;
    this.resumeState = null;
    this._fileStats = null; // Cache file stats
  }

  defaultProgressHandler(processed, lineNumber, bytesRead, fileSize) {
    const percentage = fileSize > 0 ? ((bytesRead / fileSize) * 100).toFixed(1) : 0;
    const speed =
      this.startTime && processed > 0
        ? (processed / ((Date.now() - this.startTime) / 1000)).toFixed(0)
        : 0;
    process.stdout.write(
      `\r📊 ${percentage}% | ${processed.toLocaleString()} samples | ${speed} samples/sec    `
    );
  }

  defaultErrorHandler(error) {
    this.errors.push(error);
    if (this.errors.length <= 10) {
      console.error(`\n⚠️  Line ${error.line}: ${error.error}`);
    } else if (this.errors.length === 11) {
      console.error("\n⚠️  (Additional errors suppressed, see log file)");
    }
  }

  async execute() {
    this.startTime = Date.now();

    try {
      // Validate file exists
      if (!existsSync(this.options.filePath)) {
        throw new Error(`File not found: ${this.options.filePath}`);
      }

      // Connect to database using unified path resolution
      const dbPath = resolveDatabasePath(this.options.dataDir);
      this.db = new Database(dbPath);

      // Optimize SQLite for bulk inserts
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("synchronous = NORMAL");
      this.db.pragma("cache_size = 100000");
      this.db.pragma("temp_store = memory");
      this.db.pragma("mmap_size = 30000000000");

      // Validate or get dataset
      const dataset = this.getOrValidateDataset();
      if (!dataset) {
        throw new Error(`Dataset not found: ${this.options.datasetId}`);
      }

      console.log(`📥 Importing: ${this.options.filePath}`);
      console.log(`📊 Target dataset: ${dataset.name} (ID: ${dataset.id})`);

      // Check file size and determine strategy
      const fileStats = this.getFileStats();
      console.log(`📦 File size: ${this.formatBytes(fileStats.size)}`);

      // Auto-detect format
      const detectedFormat = this.options.format || this.detectFormat(this.options.filePath);
      console.log(`🔍 Format: ${detectedFormat}`);

      // Calculate optimal chunk size
      const chunkSize = this.options.chunkSize || calculateOptimalChunkSize(fileStats.size);
      console.log(`🎯 Chunk size: ${chunkSize} records`);
      console.log(`👷 Workers: ${this.options.workers}`);

      if (this.options.dryRun) {
        console.log("🔍 DRY RUN - No data will be imported\n");
      } else {
        console.log("💾 Importing data...\n");
      }

      // Check for resume state
      this.resumeState = new ResumeState(this.options.filePath, this.options.dataDir);
      let resumeData = null;

      if (this.options.resume && this.resumeState.exists()) {
        resumeData = this.resumeState.showStatus();
        const shouldResume = await this.promptResume();
        if (!shouldResume) {
          this.resumeState.clear();
          resumeData = null;
        }
      }

      // Initialize worker pool for parallel processing
      if (!this.options.dryRun && this.options.workers > 1) {
        console.log(`🚀 Using ${this.options.workers} workers for parallel processing...`);
        this.workerPool = new SimpleWorkerPool(this.options.workers);
      }

      // Process file based on format and size
      // JSON arrays: use streaming parser (even for large files)
      // JSONL: use chunked processing for large files
      if (detectedFormat === "json-array") {
        // JSON array files use streaming parser which handles them correctly
        await this.processSmallFile(dataset, detectedFormat);
      } else if (fileStats.size > 10 * 1024 * 1024) {
        // Large JSONL file: use chunked processing
        await this.processLargeFile(dataset, detectedFormat, chunkSize, resumeData);
      } else {
        // Small file: use streaming parser
        await this.processSmallFile(dataset, detectedFormat);
      }

      const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);

      // Cleanup
      if (this.workerPool) {
        await this.workerPool.terminate();
      }

      // Update dataset stats
      if (!this.options.dryRun && this.imported > 0) {
        this.updateDatasetStats(dataset.id);
        // Clear resume state on successful completion
        if (this.resumeState) {
          this.resumeState.clear();
        }
      }

      // Write error log if there were errors
      if (this.errors.length > 0) {
        this.writeErrorLog();
      }

      // Close database
      this.db.close();

      // Clear progress line and print summary
      process.stdout.write("\r" + " ".repeat(80) + "\r");
      console.log("\n✅ Import complete!");
      console.log(`   Imported: ${this.imported.toLocaleString()} samples`);
      if (this.duplicates > 0) console.log(`   Duplicates: ${this.duplicates.toLocaleString()}`);
      if (this.skipped > 0) console.log(`   Skipped: ${this.skipped.toLocaleString()}`);
      if (this.errors.length > 0) console.log(`   Errors: ${this.errors.length.toLocaleString()}`);
      console.log(`   Time: ${duration}s`);
      if (parseFloat(duration) > 0) {
        const avg = (this.imported / parseFloat(duration)).toFixed(0);
        console.log(`   Speed: ${parseInt(avg).toLocaleString()} samples/sec`);
      }

      if (this.errors.length > 0) {
        console.log(`\n⚠️  See error log: curator-import-errors.log`);
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
      // Save resume state on error
      if (!this.options.dryRun && this.imported > 0 && this.resumeState) {
        console.log("\n💾 Saving progress for resume...");
        this.resumeState.save({
          fileSize: this.getFileStats()?.size || 0,
          bytesProcessed: 0, // TODO: track bytes
          recordsProcessed: this.imported,
          chunksCompleted: [], // TODO: track chunks
          options: this.options,
        });
        console.log(
          `   Run with --resume to continue from ${this.imported.toLocaleString()} records`
        );
      }

      if (this.workerPool) {
        await this.workerPool.terminate();
      }
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

  async processSmallFile(dataset, format) {
    // Use existing streaming parser for small files
    const parser = await createParser(this.options.filePath, format || this.options.format, {
      batchSize: 1000,
      importSource: "file",
      strict: this.options.strict,
      onProgress: this.options.onProgress,
      onError: this.options.onError,
    });

    const insertStmt = this.db.prepare(`
      INSERT INTO samples (
        dataset_id, dataset_name, instruction, output, input, system_prompt,
        category, difficulty, quality_rating, status, source, tags, metadata,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (strftime('%s', 'now') * 1000), (strftime('%s', 'now') * 1000))
    `);

    for await (const { batch } of parser.streamBatches()) {
      if (batch.length === 0) continue;

      if (!this.options.dryRun) {
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
  }

  async processLargeFile(dataset, format, chunkSize, resumeData) {
    // Use chunked reader with workers
    const reader = new ChunkedReader(this.options.filePath, {
      chunkSize,
      format: format || "jsonl",
      onProgress: (processed, lineNumber) => {
        this.options.onProgress(this.imported, lineNumber, 0, 0);
      },
    });

    const insertStmt = this.db.prepare(`
      INSERT INTO samples (
        dataset_id, dataset_name, instruction, output, input, system_prompt,
        category, difficulty, quality_rating, status, source, tags, metadata,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (strftime('%s', 'now') * 1000), (strftime('%s', 'now') * 1000))
    `);

    let chunkIndex = 0;
    const skipChunks = resumeData?.chunksCompleted || [];

    for await (const { chunkId, records, _startLine, _endLine } of reader.streamChunks()) {
      // Skip already processed chunks if resuming
      if (skipChunks.includes(chunkId)) {
        console.log(`⏭️  Skipping chunk ${chunkId} (already processed)`);
        continue;
      }

      if (this.options.dryRun) {
        this.imported += records.length;
        continue;
      }

      let processedRecords = records;

      // Use workers if available
      if (this.workerPool) {
        const result = await this.workerPool.processChunk(
          records,
          {
            category: this.options.category,
            status: this.options.status,
          },
          chunkId
        );

        processedRecords = result.valid || [];
        if (result.errors && Array.isArray(result.errors)) {
          this.errors.push(...result.errors);
        }
      }

      // Batch insert
      if (processedRecords.length > 0) {
        const insertMany = this.db.transaction((recs) => {
          for (const record of recs) {
            insertStmt.run(
              dataset.id,
              dataset.name,
              record.instruction,
              record.output,
              record.input || null,
              record.systemPrompt || null,
              record.category,
              record.difficulty,
              record.qualityRating,
              record.status,
              "import",
              JSON.stringify(record.tags || []),
              JSON.stringify(record.metadata || {})
            );
          }
        });
        insertMany(processedRecords);
      }

      this.imported += processedRecords.length;
      this.skipped += records.length - processedRecords.length;

      // Save resume state periodically
      if (chunkIndex % 10 === 0 && this.resumeState) {
        this.resumeState.save({
          fileSize: this.getFileStats()?.size || 0,
          bytesProcessed: 0,
          recordsProcessed: this.imported,
          chunksCompleted: Array.from({ length: chunkId + 1 }, (_, i) => i),
          totalChunks: null,
          options: this.options,
        });
      }

      chunkIndex++;
    }
  }

  detectFormat(filePath) {
    const ext = filePath.toLowerCase();
    if (ext.endsWith(".jsonl")) return "jsonl";
    if (ext.endsWith(".csv")) return "csv";
    if (ext.endsWith(".json")) {
      // Check if it's a JSON array by reading first non-whitespace char
      const fd = openSync(filePath, "r");
      const buffer = Buffer.alloc(100);
      const bytesRead = readSync(fd, buffer, 0, 100, 0);
      closeSync(fd);
      const content = buffer.toString("utf8", 0, bytesRead).trim();
      // If starts with '[', it's a JSON array
      if (content.startsWith("[")) {
        return "json-array";
      }
      return "jsonl";
    }
    return "jsonl"; // Default
  }

  async promptResume() {
    // In CLI mode, we'd use readline
    // For now, auto-resume if --resume flag is set
    return true;
  }

  getFileStats() {
    if (!this._fileStats) {
      this._fileStats = statSync(this.options.filePath);
    }
    return this._fileStats;
  }

  getOrValidateDataset() {
    if (this.options.datasetId) {
      return this.db.prepare("SELECT * FROM datasets WHERE id = ?").get(this.options.datasetId);
    } else {
      const dataset = this.db.prepare("SELECT * FROM datasets WHERE is_active = 1 LIMIT 1").get();
      if (dataset) this.options.datasetId = dataset.id;
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

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}
