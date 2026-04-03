import { getDb } from "../../db";
import { datasets, samples } from "../../db/schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * GET /api/datasets
 * List all datasets with statistics
 */
export default defineEventHandler(async (_event) => {
  try {
    const db = getDb();

    // Get all datasets ordered by creation date (newest first)
    const allDatasets = await db.select().from(datasets).orderBy(desc(datasets.createdAt));

    // Get actual statistics for each dataset
    const datasetsWithStats = await Promise.all(
      allDatasets.map(async (dataset) => {
        // Count total samples
        const totalResult = await db
          .select({ count: sql`count(*)`.as("count") })
          .from(samples)
          .where(eq(samples.datasetId, dataset.id));

        const sampleCount = Number(totalResult[0]?.count || 0);

        // Count approved samples
        const approvedResult = await db
          .select({ count: sql`count(*)`.as("count") })
          .from(samples)
          .where(sql`${samples.datasetId} = ${dataset.id} AND ${samples.status} = 'approved'`);

        const approvedCount = Number(approvedResult[0]?.count || 0);

        return {
          ...dataset,
          sampleCount,
          approvedCount,
        };
      })
    );

    // Get active dataset
    const activeDataset = datasetsWithStats.find((d) => d.isActive === 1);

    return {
      datasets: datasetsWithStats,
      activeDatasetId: activeDataset?.id || null,
      total: datasetsWithStats.length,
    };
  } catch (error) {
    console.error("Error fetching datasets:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch datasets",
    });
  }
});
