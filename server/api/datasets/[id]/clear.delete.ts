import { getDb } from "../../../db";
import { samples, datasets } from "../../../db/schema";
import { eq } from "drizzle-orm";

/**
 * DELETE /api/datasets/:id/clear
 * Delete all samples from a dataset (clear slate)
 */
export default defineEventHandler(async (event) => {
  try {
    // Get dataset ID from route params
    const id = parseInt(getRouterParam(event, "id") || "0");

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid dataset ID",
      });
    }

    const db = getDb();

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

    // Delete all samples for this dataset
    await db.delete(samples).where(eq(samples.datasetId, id));

    // Update dataset counts to 0 and reset updatedAt to null
    await db
      .update(datasets)
      .set({
        sampleCount: 0,
        approvedCount: 0,
        updatedAt: null,
      })
      .where(eq(datasets.id, id));

    return {
      success: true,
      message: `All samples cleared from dataset "${dataset.name}"`,
      datasetId: id,
      clearedCount: dataset.sampleCount,
    };
  } catch (error) {
    console.error("Error clearing samples:", error);

    if ((error as any).statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to clear samples",
    });
  }
});
