// server/cli/clear.ts
// CLI command to clear all samples from a dataset

import { createInterface } from "readline";
import { ImportService } from "../services/import/index.ts";
import { resolveDatabasePath } from "./utils.ts";

export interface ClearOptions {
  datasetId?: number;
  dataDir?: string;
  force?: boolean;
}

/**
 * Prompt user for confirmation (if not forced)
 */
async function promptConfirmation(datasetName: string, sampleCount: number): Promise<boolean> {
  if (sampleCount === 0) {
    console.log("ℹ️  Dataset is already empty.");
    return true;
  }

  console.log(
    `\n⚠️  Warning: This will delete ALL ${sampleCount} samples from dataset "${datasetName}".`
  );
  console.log("   This action cannot be undone.\n");

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Type 'yes' to confirm: ", (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "yes");
    });
  });
}

/**
 * Clear samples from a dataset
 */
export async function clearCommand(options: ClearOptions): Promise<{
  success: boolean;
  deleted?: number;
  dataset?: { id: number; name: string };
  error?: string;
}> {
  try {
    // Resolve database path
    const dbPath = resolveDatabasePath(options.dataDir);
    const importService = new ImportService(dbPath);

    // Get dataset info first
    const { getDb } = await import("../db/index.js");
    const db = getDb();

    // If no dataset ID provided, use active dataset
    let targetDatasetId = options.datasetId;
    let datasetName = "Unknown";
    let sampleCount = 0;

    if (!targetDatasetId) {
      // Get active dataset
      const { datasets } = await import("../db/schema.js");
      const { eq } = await import("drizzle-orm");

      const activeDataset = await db.query.datasets.findFirst({
        where: eq(datasets.isActive, 1),
      });

      if (!activeDataset) {
        return {
          success: false,
          error: "No active dataset found. Please specify a dataset ID with --dataset <id>",
        };
      }

      targetDatasetId = activeDataset.id;
      datasetName = activeDataset.name;
      sampleCount = activeDataset.sampleCount || 0;
    } else {
      // Get specified dataset
      const { datasets } = await import("../db/schema.js");
      const { eq } = await import("drizzle-orm");

      const dataset = await db.query.datasets.findFirst({
        where: eq(datasets.id, targetDatasetId),
      });

      if (!dataset) {
        return {
          success: false,
          error: `Dataset with ID ${targetDatasetId} not found`,
        };
      }

      datasetName = dataset.name;
      sampleCount = dataset.sampleCount || 0;
    }

    console.log(`📁 Dataset: ${datasetName} (ID: ${targetDatasetId})`);
    console.log(`📝 Current samples: ${sampleCount}`);

    // Confirm if not forced
    if (!options.force) {
      const confirmed = await promptConfirmation(datasetName, sampleCount);
      if (!confirmed) {
        console.log("\n❌ Clear cancelled.");
        return { success: false, error: "User cancelled" };
      }
    } else {
      console.log("\n⚡ Force mode enabled - skipping confirmation\n");
    }

    // Clear samples
    console.log("🗑️  Clearing samples...");
    const result = await importService.clearSamples(targetDatasetId);

    console.log(
      `\n✅ Successfully cleared ${result.deleted} samples from "${result.dataset.name}"`
    );
    console.log(`📊 Dataset is now empty (${result.deleted} samples removed)`);

    return {
      success: true,
      deleted: result.deleted,
      dataset: result.dataset,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`\n❌ Clear failed: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
