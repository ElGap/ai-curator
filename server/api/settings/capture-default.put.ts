// server/api/settings/capture-default.put.ts
// Update the default dataset and settings for live capture

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../db";
import { captureSettings, datasets } from "../../db/schema";

const updateSchema = z.object({
  datasetId: z.number().int().positive("Dataset ID must be a positive integer"),
  defaultStatus: z.enum(["draft", "approved"]).optional(),
  defaultQuality: z.number().int().min(1).max(5).optional(),
  isEnabled: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = updateSchema.parse(body);

    const db = getDb();

    // Verify dataset exists
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.id, data.datasetId),
    });

    if (!dataset) {
      throw createError({
        statusCode: 404,
        statusMessage: `Dataset with ID ${data.datasetId} not found`,
      });
    }

    // Prepare update data
    const updateData: any = {
      defaultDatasetId: data.datasetId,
      defaultDatasetName: dataset.name,
      updatedAt: new Date(),
    };

    if (data.defaultStatus) {
      updateData.defaultStatus = data.defaultStatus;
    }

    if (data.defaultQuality !== undefined) {
      updateData.defaultQuality = data.defaultQuality;
    }

    if (data.isEnabled !== undefined) {
      updateData.isEnabled = data.isEnabled;
    }

    // Use upsert pattern in case the row doesn't exist
    const existing = await db.query.captureSettings.findFirst({
      where: eq(captureSettings.id, 1),
    });

    if (existing) {
      await db.update(captureSettings).set(updateData).where(eq(captureSettings.id, 1));
    } else {
      await db.insert(captureSettings).values({
        id: 1,
        ...updateData,
        defaultStatus: data.defaultStatus || "draft",
        defaultQuality: data.defaultQuality || 3,
        isEnabled: data.isEnabled ?? true,
      });
    }

    return {
      success: true,
      datasetId: data.datasetId,
      datasetName: dataset.name,
      defaultStatus: data.defaultStatus || existing?.defaultStatus || "draft",
      defaultQuality: data.defaultQuality ?? existing?.defaultQuality ?? 3,
      isEnabled: data.isEnabled ?? existing?.isEnabled ?? true,
      message: `Default capture settings updated`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");

      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${issues}`,
      });
    }

    console.error("Error updating capture default settings:", error);
    throw error;
  }
});
