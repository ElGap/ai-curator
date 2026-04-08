import { getDb, type DatabaseClient } from "../../db/index.ts";
import { samples as samplesTable, datasets } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
// Runtime-aware SQLite: uses bun:sqlite under Bun, better-sqlite3 under Node.js
// Module name obfuscated to prevent static analysis
const _bunMod = typeof Bun !== 'undefined' ? [98,117,110,58,115,113,108,105,116,101].map(c => String.fromCharCode(c)).join('') : 'better-sqlite3';
const _drizzleMod = typeof Bun !== 'undefined' ? 'drizzle-orm/bun-sqlite' : 'drizzle-orm/better-sqlite3';
const Database = (await import(_bunMod)).default || (await import(_bunMod)).Database;
const drizzle = (await import(_drizzleMod)).drizzle;
import * as schema from "../../db/schema.ts";
import type {
  ImportOptions,
  ImportResult,
  ImportError,
  ImportProgress,
  RawSample,
} from "./import.types.ts";
import { processBatch } from "./import.validators.ts";

/**
 * Batch size for database inserts
 */
const DEFAULT_BATCH_SIZE = 100;

/**
 * Import Service
 *
 * Unified import logic for both CLI and UI interfaces.
 * All imports go through this service to ensure consistency.
 */
export class ImportService {
  private db: DatabaseClient;

  constructor(dbPath?: string) {
    // If dbPath provided, create new connection; otherwise use shared
    if (dbPath) {
      const sqlite = new Database(dbPath);
      sqlite.exec("PRAGMA journal_mode = WAL");
      this.db = drizzle(sqlite, { schema });
    } else {
      this.db = getDb();
    }
  }

  /**
   * Import samples into the database
   *
   * @param samples Array of raw samples to import
   * @param options Import options
   * @param onProgress Optional progress callback
   * @returns Import result with statistics
   */
  async importSamples(
    samples: RawSample[],
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const total = samples.length;

    // Resolve target dataset and prepare options with dataset defaults
    const dataset = await this.resolveDataset(options.datasetId);
    const optionsWithDefaults: ImportOptions = {
      ...options,
      datasetDefaults: {
        quality: dataset.defaultQuality,
        category: dataset.defaultCategory,
      },
    };

    // Track results
    let imported = 0;
    let failed = 0;
    const allErrors: ImportError[] = [];

    // Process in batches
    const batchSize = DEFAULT_BATCH_SIZE;
    const totalBatches = Math.ceil(total / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, total);
      const batch = samples.slice(start, end);

      // Process and validate batch
      const { normalized, errors } = processBatch(batch, optionsWithDefaults, start);

      if (errors.length > 0) {
        allErrors.push(...errors);
        failed += errors.length;
      }

      // Insert valid samples
      if (!optionsWithDefaults.dryRun && normalized.length > 0) {
        await this.insertBatch(normalized, dataset.id, dataset.name);
        imported += normalized.length;
      } else if (optionsWithDefaults.dryRun) {
        // In dry run mode, count as imported for reporting
        imported += normalized.length;
      }

      // Report progress
      if (onProgress) {
        onProgress({
          processed: end,
          total,
          percentage: Math.round((end / total) * 100),
          currentBatch: batchIndex + 1,
          totalBatches,
        });
      }
    }

    // Update dataset statistics
    let updatedStats = null;
    if (!optionsWithDefaults.dryRun && imported > 0) {
      await this.updateDatasetStats(dataset.id);
      // Fetch updated stats
      updatedStats = await this.db.query.datasets.findFirst({
        where: eq(datasets.id, dataset.id),
        columns: {
          sampleCount: true,
          approvedCount: true,
        },
      });
    }

    const _duration = Date.now() - startTime;

    return {
      success: failed === 0,
      imported,
      failed,
      skipped: 0,
      errors: allErrors.slice(0, 100), // Limit errors in response
      dataset: {
        id: dataset.id,
        name: dataset.name,
        sampleCount: updatedStats?.sampleCount ?? dataset.sampleCount,
        approvedCount: updatedStats?.approvedCount ?? dataset.approvedCount,
      },
    };
  }

  /**
   * Import a single sample (for live capture, etc.)
   */
  async importSingle(
    sample: RawSample,
    options: ImportOptions
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const dataset = await this.resolveDataset(options.datasetId);
      const optionsWithDefaults: ImportOptions = {
        ...options,
        datasetDefaults: {
          quality: dataset.defaultQuality,
          category: dataset.defaultCategory,
        },
      };

      const { normalized } = processBatch([sample], optionsWithDefaults);

      if (normalized.length === 0) {
        return { success: false, error: "Sample validation failed" };
      }

      if (optionsWithDefaults.dryRun) {
        return { success: true };
      }

      await this.insertBatch(normalized, dataset.id, dataset.name);
      await this.updateDatasetStats(dataset.id);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Resolve target dataset from options
   */
  private async resolveDataset(datasetId?: number) {
    if (datasetId) {
      const dataset = await this.db.query.datasets.findFirst({
        where: eq(datasets.id, datasetId),
      });

      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found`);
      }

      return dataset;
    }

    // Fall back to active dataset
    const activeDataset = await this.db.query.datasets.findFirst({
      where: eq(datasets.isActive, 1),
    });

    if (!activeDataset) {
      throw new Error("No active dataset found. Please select a dataset or activate one.");
    }

    return activeDataset;
  }

  /**
   * Insert a batch of normalized samples
   */
  private async insertBatch(
    normalizedSamples: ReturnType<typeof processBatch>["normalized"],
    datasetId: number,
    datasetName: string
  ) {
    // Insert all samples in a batch
    for (const sample of normalizedSamples) {
      await this.db.insert(samplesTable).values({
        datasetId,
        datasetName,
        instruction: sample.instruction,
        input: sample.input,
        output: sample.output,
        systemPrompt: sample.systemPrompt,
        category: sample.category,
        difficulty: sample.difficulty,
        qualityRating: sample.qualityRating,
        notes: sample.notes,
        tags: JSON.stringify(sample.tags),
        context: sample.context,
        status: sample.status,
        source: sample.source,
        metadata: sample.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Update dataset statistics after import
   */
  private async updateDatasetStats(datasetId: number) {
    const allSamples = await this.db.query.samples.findMany({
      where: eq(samplesTable.datasetId, datasetId),
    });

    const sampleCount = allSamples.length;
    const approvedCount = allSamples.filter((s) => s.status === "approved").length;
    const draftCount = allSamples.filter((s) => s.status === "draft").length;
    const reviewCount = allSamples.filter((s) => s.status === "review").length;
    const rejectedCount = allSamples.filter((s) => s.status === "rejected").length;

    await this.db
      .update(datasets)
      .set({
        sampleCount,
        approvedCount,
        updatedAt: new Date(),
      })
      .where(eq(datasets.id, datasetId));

    // Log for debugging
    console.log(
      `Dataset ${datasetId} stats updated: total=${sampleCount}, approved=${approvedCount}, draft=${draftCount}, review=${reviewCount}, rejected=${rejectedCount}`
    );
  }

  /**
   * Clear all samples from a dataset
   * Returns the number of samples deleted
   */
  async clearSamples(
    datasetId: number
  ): Promise<{ deleted: number; dataset: { id: number; name: string } }> {
    // Get dataset info before clearing
    const dataset = await this.db.query.datasets.findFirst({
      where: eq(datasets.id, datasetId),
    });

    if (!dataset) {
      throw new Error(`Dataset with ID ${datasetId} not found`);
    }

    // Count samples before deletion
    const samplesToDelete = await this.db.query.samples.findMany({
      where: eq(samplesTable.datasetId, datasetId),
    });

    const deletedCount = samplesToDelete.length;

    if (deletedCount === 0) {
      return {
        deleted: 0,
        dataset: { id: dataset.id, name: dataset.name },
      };
    }

    // Delete all samples from dataset
    await this.db.delete(samplesTable).where(eq(samplesTable.datasetId, datasetId));

    // Reset dataset statistics
    await this.db
      .update(datasets)
      .set({
        sampleCount: 0,
        approvedCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(datasets.id, datasetId));

    return {
      deleted: deletedCount,
      dataset: { id: dataset.id, name: dataset.name },
    };
  }
}

// Export singleton instance
export const importService = new ImportService();
