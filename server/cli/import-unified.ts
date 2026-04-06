// server/cli/import-unified.ts
// Unified CLI import command using ImportService
// This replaces the old import.js and import-v2.js

import { existsSync, writeFileSync } from "fs";
import { ImportService } from "../services/import/index.ts";
import { createParser } from "./parsers/index.ts";
import { resolveDatabasePath } from "./utils.ts";
import type { ImportOptions } from "../services/import/index.ts";

export interface CliImportOptions {
  filePath: string;
  datasetId?: number;
  format?: string | null;
  category?: string | null;
  status?: "draft" | "review" | "approved" | "rejected";
  batchSize?: number;
  dryRun?: boolean;
  strict?: boolean;
  dataDir?: string;
  onProgress?: (message: string) => void;
}

export async function cliImport(options: CliImportOptions): Promise<{
  success: boolean;
  imported: number;
  failed: number;
  duration: number;
  dataset?: { id: number; name: string };
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Validate file exists
    if (!existsSync(options.filePath)) {
      throw new Error(`File not found: ${options.filePath}`);
    }

    // Create parser
    const parser = await createParser(options.filePath, options.format, {
      batchSize: options.batchSize || 1000,
      strict: options.strict || false,
      onError: (error) => {
        console.error(`\n⚠️  Line ${error.line}: ${error.error}`);
      },
    });

    // Collect all samples from file
    const allSamples: unknown[] = [];

    if (options.onProgress) {
      options.onProgress("📖 Reading file...");
    }

    for await (const { batch, progress } of parser.streamBatches()) {
      allSamples.push(...batch);

      if (progress.percentage) {
        if (options.onProgress) {
          options.onProgress(`📖 Reading: ${progress.percentage}% (${allSamples.length} samples)`);
        }
      }
    }

    if (allSamples.length === 0) {
      throw new Error("No valid samples found in file");
    }

    if (options.onProgress) {
      options.onProgress(`✅ Read ${allSamples.length} samples from file`);
    }

    // Create ImportService with correct database path
    const dbPath = resolveDatabasePath(options.dataDir);
    const importService = new ImportService(dbPath);

    // Import options
    const importOptions: ImportOptions = {
      datasetId: options.datasetId,
      category: options.category || undefined,
      status: options.status || "draft",
      source: "cli",
      dryRun: options.dryRun || false,
    };

    if (options.onProgress) {
      options.onProgress("💾 Importing to database...");
    }

    // Use unified ImportService
    const result = await importService.importSamples(
      allSamples as Record<string, unknown>[],
      importOptions,
      (progress) => {
        if (options.onProgress) {
          options.onProgress(
            `💾 Importing: ${progress.percentage}% (${progress.processed}/${progress.total})`
          );
        }
      }
    );

    const duration = Date.now() - startTime;

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
    }

    return {
      success: result.success,
      imported: result.imported,
      failed: result.failed,
      duration,
      dataset: result.dataset,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      success: false,
      imported: 0,
      failed: 0,
      duration,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
