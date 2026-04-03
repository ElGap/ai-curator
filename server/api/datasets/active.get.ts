import { getDb } from "../../db";
import { datasets } from "../../db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/datasets/active
 * Get the currently active dataset
 */
export default defineEventHandler(async (_event) => {
  try {
    const db = getDb();

    // Get active dataset
    const activeDataset = await db.query.datasets.findFirst({
      where: (datasets, { eq }) => eq(datasets.isActive, 1),
    });

    if (!activeDataset) {
      // No active dataset - try to activate the first non-archived one
      const firstDataset = await db.query.datasets.findFirst({
        where: (datasets, { eq, and }) => and(eq(datasets.isArchived, 0)),
      });

      if (firstDataset) {
        // Activate it
        await db
          .update(datasets)
          .set({ isActive: 1, updatedAt: new Date() })
          .where(eq(datasets.id, firstDataset.id));

        return {
          dataset: {
            ...firstDataset,
            isActive: 1,
          },
          message: "Auto-activated dataset",
        };
      }

      return {
        dataset: null,
        message: "No datasets found",
      };
    }

    return {
      dataset: activeDataset,
      message: "Active dataset found",
    };
  } catch (error) {
    console.error("Error fetching active dataset:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch active dataset",
    });
  }
});
