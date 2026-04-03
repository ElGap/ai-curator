import { getDb } from "../../../db";
import { datasets } from "../../../db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/datasets/[id]/activate
 * Set a dataset as the active one (receives new Open WebUI messages)
 */
export default defineEventHandler(async (event) => {
  try {
    const id = parseInt(event.context.params?.id as string);
    if (isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid dataset ID",
      });
    }

    const db = getDb();

    // Check if dataset exists and is not archived
    const dataset = await db.query.datasets.findFirst({
      where: (datasets, { eq }) => eq(datasets.id, id),
    });

    if (!dataset) {
      throw createError({
        statusCode: 404,
        statusMessage: "Dataset not found",
      });
    }

    if (dataset.isArchived === 1) {
      throw createError({
        statusCode: 400,
        statusMessage: "Cannot activate an archived dataset",
      });
    }

    // Deactivate all datasets first
    await db.update(datasets).set({ isActive: 0, updatedAt: new Date() });

    // Activate the target dataset
    const result = await db
      .update(datasets)
      .set({ isActive: 1, updatedAt: new Date() })
      .where(eq(datasets.id, id))
      .returning();

    return {
      success: true,
      dataset: result[0],
      message: `Dataset "${dataset.name}" is now active. All new conversations will be saved here.`,
    };
  } catch (error) {
    console.error("Error activating dataset:", error);
    throw error;
  }
});
