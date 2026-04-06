// server/cli/import-command.ts
// Unified CLI import command using ImportService
// This replaces the old ImportCommand and ImportCommandV2 classes

import { existsSync, writeFileSync, createReadStream, statSync } from "fs";
import { createInterface } from "readline";
import { ImportService } from "../services/import/index.ts";
import { resolveDatabasePath } from "./utils.ts";
import type {
  RawSample,
  ImportOptions,
  ImportResult,
  ImportProgress,
} from "../services/import/index.ts";

export interface CliImportOptions {
  filePath: string;
  datasetId?: number;
  format?: "json" | "jsonl" | "csv" | null;
  category?: string;
  status?: "draft" | "review" | "approved" | "rejected";
  batchSize?: number;
  dryRun?: boolean;
  strict?: boolean;
  dataDir?: string;
  smart?: boolean;
  clearExisting?: boolean;
}

/**
 * Stream parse JSONL file
 */
async function* streamJSONL(
  filePath: string,
  onProgress?: (processed: number) => void
): AsyncGenerator<RawSample[]> {
  const batchSize = 100;
  const batch: RawSample[] = [];
  let processed = 0;

  const fileStream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue; // Skip comments

    try {
      const record = JSON.parse(trimmed) as RawSample;
      batch.push(record);
      processed++;

      if (batch.length >= batchSize) {
        yield [...batch];
        batch.length = 0;
        onProgress?.(processed);
      }
    } catch (error) {
      console.error(`⚠️  Failed to parse line ${processed + 1}: ${error}`);
      // Continue with next line
    }
  }

  // Yield remaining batch
  if (batch.length > 0) {
    yield [...batch];
    onProgress?.(processed);
  }
}

/**
 * Parse JSON array file (loads entire file - for smaller files)
 */
async function parseJSONArray(filePath: string): Promise<RawSample[]> {
  const chunks: string[] = [];

  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: "utf-8" });

    stream.on("data", (chunk: string | Buffer) => {
      chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf-8"));
    });
    stream.on("end", () => {
      try {
        const content = chunks.join("");
        const records = JSON.parse(content);

        if (!Array.isArray(records)) {
          reject(new Error("JSON file must contain an array of records"));
          return;
        }

        resolve(records as RawSample[]);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error}`));
      }
    });
    stream.on("error", reject);
  });
}

/**
 * Detect file format from content
 */
function detectFormat(filePath: string): Promise<"jsonl" | "json"> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: "utf-8" });
    let content = "";
    let bytesRead = 0;
    const maxBytes = 500;

    stream.on("data", (chunk: string | Buffer) => {
      const chunkStr = typeof chunk === "string" ? chunk : chunk.toString("utf-8");
      content += chunkStr;
      bytesRead += chunkStr.length;

      if (bytesRead >= maxBytes) {
        stream.destroy();
      }
    });

    stream.on("close", () => {
      const trimmed = content.trim();

      if (trimmed.startsWith("[") && trimmed.includes("{")) {
        resolve("json"); // JSON array
      } else if (trimmed.startsWith("{")) {
        resolve("jsonl"); // JSONL
      } else {
        resolve("jsonl"); // Default to JSONL
      }
    });

    stream.on("error", reject);
  });
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath: string): number {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Unified CLI import function
 */
export async function importCommand(
  options: CliImportOptions
): Promise<ImportResult & { duration: number }> {
  const startTime = Date.now();

  try {
    // Validate file exists
    if (!existsSync(options.filePath)) {
      throw new Error(`File not found: ${options.filePath}`);
    }

    console.log(`📥 Importing: ${options.filePath}`);

    // Detect format if not specified
    let format = options.format;
    if (!format) {
      format = await detectFormat(options.filePath);
      console.log(`🔍 Auto-detected format: ${format}`);
    }

    // Parse file to get samples
    let allSamples: RawSample[] = [];

    if (format === "jsonl") {
      console.log("📖 Reading JSONL file (streaming)...");

      let _processed = 0;
      const stream = streamJSONL(options.filePath, (count) => {
        _processed = count;
        process.stdout.write(`\r📖 Read ${count} samples...`);
      });

      for await (const batch of stream) {
        allSamples.push(...batch);
      }

      console.log(`\r📖 Read ${allSamples.length} samples ✓`);
    } else {
      console.log("📖 Reading JSON array file...");

      // For JSON arrays, we load the whole file
      // This could be memory-intensive for very large files
      const fileSize = getFileSize(options.filePath);
      if (fileSize > 100 * 1024 * 1024) {
        console.log("⚠️  Large file detected (>100MB). Consider converting to JSONL format.");
      }

      allSamples = await parseJSONArray(options.filePath);
      console.log(`📖 Read ${allSamples.length} samples ✓`);
    }

    if (allSamples.length === 0) {
      throw new Error("No valid samples found in file");
    }

    // Pre-process samples: set status based on quality rating
    // Quality > 4 → approved, otherwise draft
    // Also handle snake_case quality_rating field
    allSamples = allSamples.map((sample) => {
      const qualityRating = Number(
        sample.qualityRating ?? sample.quality_rating ?? sample.quality ?? 3
      );

      const status = qualityRating > 4 ? "approved" : "draft";

      return {
        ...sample,
        qualityRating,
        status: sample.status || status,
      };
    });

    console.log(`📊 Total samples to import: ${allSamples.length}`);

    // Resolve database path
    const dbPath = resolveDatabasePath(options.dataDir);

    // Create ImportService with the correct database path
    const importService = new ImportService(dbPath);

    // Configure import options
    // Note: status is set per-sample during pre-processing based on quality rating
    const importOptions: ImportOptions = {
      datasetId: options.datasetId,
      category: options.category,
      // Only pass status if explicitly set via CLI flag, otherwise let samples use their own status
      status: options.status,
      source: "cli",
      dryRun: options.dryRun || false,
    };

    console.log(
      options.dryRun ? "🔍 DRY RUN - No data will be imported" : "💾 Importing to database..."
    );

    // Import samples using unified service
    const result = await importService.importSamples(
      allSamples,
      importOptions,
      (progress: ImportProgress) => {
        const percent = Math.round((progress.processed / progress.total) * 100);
        process.stdout.write(
          `\r💾 Importing: ${percent}% (${progress.processed}/${progress.total})`
        );
      }
    );

    console.log(`\r💾 Import complete: ${result.imported} samples ✓`);

    // Write error log if there were errors
    if (result.errors.length > 0) {
      const logContent = JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          filePath: options.filePath,
          totalErrors: result.errors.length,
          errors: result.errors.slice(0, 100),
        },
        null,
        2
      );
      writeFileSync("curator-import-errors.log", logContent);
      console.log(`\n⚠️  ${result.errors.length} errors occurred. See: curator-import-errors.log`);
    }

    const duration = Date.now() - startTime;

    // Print summary
    console.log("\n✅ Import complete!");
    console.log(`   Imported: ${result.imported} samples`);
    console.log(`   Failed: ${result.failed} samples`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Dataset: ${result.dataset.name} (ID: ${result.dataset.id})`);

    return {
      ...result,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(
      `\n❌ Import failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );

    return {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          field: "import",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ],
      dataset: { id: 0, name: "Unknown" },
      duration,
    };
  }
}
