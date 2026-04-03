// server/api/settings/capture-default.get.ts
// Get the default dataset and settings for live capture

import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { captureSettings, datasets } from "../../db/schema";

export default defineEventHandler(async (_event) => {
  try {
    const db = getDb();

    // Get capture settings
    const settings = await db.query.captureSettings.findFirst({
      where: eq(captureSettings.id, 1),
    });

    if (!settings) {
      // Return fallback
      return {
        success: true,
        datasetId: 1,
        datasetName: "General",
        datasetSampleCount: 0,
        defaultStatus: "draft",
        defaultQuality: 3,
        isEnabled: true,
        updatedAt: new Date().toISOString(),
      };
    }

    // Get actual dataset info for sample count
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.id, settings.defaultDatasetId || 1),
    });

    return {
      success: true,
      datasetId: settings.defaultDatasetId || 1,
      datasetName: settings.defaultDatasetName || "General",
      datasetSampleCount: dataset?.sampleCount || 0,
      defaultStatus: settings.defaultStatus || "draft",
      defaultQuality: settings.defaultQuality || 3,
      isEnabled: settings.isEnabled ?? true,
      updatedAt: settings.updatedAt
        ? new Date(settings.updatedAt).toISOString()
        : new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting capture default settings:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to get capture default settings",
    });
  }
});
