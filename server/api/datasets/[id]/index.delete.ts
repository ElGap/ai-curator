import { getDb, getRawDb } from "../../../db";
import {
  datasets,
  samples,
  analyticsSnapshots,
  exportLogs,
  captureSettings,
} from "../../../db/schema";
import { eq } from "drizzle-orm";

/**
 * DELETE /api/datasets/[id]
 * Delete a dataset permanently - also deletes all associated samples and related records
 */
export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string);
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid dataset ID",
    });
  }

  const db = getDb();
  const rawDb = getRawDb();

  try {
    // Check if dataset exists
    const dataset = await db.query.datasets.findFirst({
      where: (datasets, { eq }) => eq(datasets.id, id),
    });

    if (!dataset) {
      throw createError({
        statusCode: 404,
        statusMessage: "Dataset not found",
      });
    }

    // Cannot delete the last dataset
    const allDatasets = await db.query.datasets.findMany();

    if (allDatasets.length <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: "Cannot delete the last dataset. Create a new one first.",
      });
    }

    // Find another dataset to use as replacement
    const otherDataset = allDatasets.find((d: any) => d.id !== id);

    // Disable foreign key constraints temporarily to allow deletion
    // This is necessary because capture_settings has a FK reference to datasets
    if (rawDb) {
      try {
        rawDb.exec("PRAGMA foreign_keys = OFF;");
        console.log(`[Delete Dataset ${id}] Disabled foreign keys`);
      } catch (err) {
        console.warn(`[Delete Dataset ${id}] Could not disable foreign keys:`, err);
      }
    }

    try {
      // 1. Delete analytics snapshots for this dataset
      try {
        await db.delete(analyticsSnapshots).where(eq(analyticsSnapshots.datasetId, id));
        console.log(`[Delete Dataset ${id}] Deleted analytics snapshots`);
      } catch (err) {
        console.error(`[Delete Dataset ${id}] Error deleting analytics snapshots:`, err);
      }

      // 2. Delete export logs for this dataset
      try {
        await db.delete(exportLogs).where(eq(exportLogs.datasetId, id));
        console.log(`[Delete Dataset ${id}] Deleted export logs`);
      } catch (err) {
        console.error(`[Delete Dataset ${id}] Error deleting export logs:`, err);
      }

      // 3. Update capture settings to point to another dataset
      if (otherDataset) {
        try {
          await db
            .update(captureSettings)
            .set({
              defaultDatasetId: otherDataset.id as number,
              defaultDatasetName: otherDataset.name as string,
              updatedAt: new Date(),
            })
            .where(eq(captureSettings.defaultDatasetId, id));
          console.log(`[Delete Dataset ${id}] Updated capture settings`);
        } catch (err) {
          console.error(`[Delete Dataset ${id}] Error updating capture settings:`, err);
        }
      }

      // 4. Delete all samples in this dataset
      try {
        await db.delete(samples).where(eq(samples.datasetId, id));
        console.log(`[Delete Dataset ${id}] Deleted samples`);
      } catch (err) {
        console.error(`[Delete Dataset ${id}] Error deleting samples:`, err);
        throw err;
      }

      // 5. If this was the active dataset, activate another one
      if (dataset.isActive === 1 && otherDataset) {
        try {
          await db
            .update(datasets)
            .set({ isActive: 1, updatedAt: new Date() })
            .where(eq(datasets.id, otherDataset.id as number));
          console.log(`[Delete Dataset ${id}] Activated other dataset`);
        } catch (err) {
          console.error(`[Delete Dataset ${id}] Error activating other dataset:`, err);
        }
      }

      // 6. Finally delete the dataset
      await db.delete(datasets).where(eq(datasets.id, id));
      console.log(`[Delete Dataset ${id}] Deleted dataset successfully`);
    } finally {
      // Re-enable foreign key constraints
      if (rawDb) {
        try {
          rawDb.exec("PRAGMA foreign_keys = ON;");
          console.log(`[Delete Dataset ${id}] Re-enabled foreign keys`);
        } catch (err) {
          console.warn(`[Delete Dataset ${id}] Could not re-enable foreign keys:`, err);
        }
      }
    }

    return {
      success: true,
      message: `Dataset "${dataset.name}" has been permanently deleted.`,
    };
  } catch (error: any) {
    console.error("[Delete Dataset] Full error:", error);

    // If it's already a H3 error, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Otherwise, throw with the actual error message for debugging
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to delete dataset: ${error.message || error}`,
    });
  }
});
