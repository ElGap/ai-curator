import { getDb } from "../../../db";
import { samples, datasets } from "../../../db/schema";
import { eq, and, or } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const db = getDb();
    const datasetId = parseInt(event.context.params?.id as string);

    if (isNaN(datasetId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid dataset ID",
      });
    }

    // Get dataset info
    const datasetResult = await db.select().from(datasets).where(eq(datasets.id, datasetId));
    const dataset = datasetResult[0];

    if (!dataset) {
      throw createError({
        statusCode: 404,
        statusMessage: "Dataset not found",
      });
    }

    // Get samples for this dataset
    const totalResult = await db.select().from(samples).where(eq(samples.datasetId, datasetId));
    const total = totalResult.length;

    // Get approved count
    const approvedResult = await db
      .select()
      .from(samples)
      .where(and(eq(samples.datasetId, datasetId), eq(samples.status, "approved")));
    const approved = approvedResult.length;

    // Get draft count
    const draftResult = await db
      .select()
      .from(samples)
      .where(and(eq(samples.datasetId, datasetId), eq(samples.status, "draft")));
    const draft = draftResult.length;

    // Get review count
    const reviewResult = await db
      .select()
      .from(samples)
      .where(
        and(
          eq(samples.datasetId, datasetId),
          or(eq(samples.status, "review"), eq(samples.status, "needs_review"))
        )
      );
    const review = reviewResult.length;

    // Calculate average quality
    let totalQuality = 0;
    let samplesWithQuality = 0;
    for (const sample of totalResult) {
      if (sample.qualityRating && sample.qualityRating > 0) {
        totalQuality += sample.qualityRating;
        samplesWithQuality++;
      }
    }
    const avgQuality = samplesWithQuality > 0 ? totalQuality / samplesWithQuality : 0;

    // Get by category breakdown
    const categories: Record<string, number> = {};
    for (const sample of totalResult) {
      const category = sample.category || "unknown";
      categories[category] = (categories[category] || 0) + 1;
    }

    return {
      total,
      approved,
      draft,
      review,
      rejected: total - approved - draft - review,
      avgQuality,
      categories,
      dataset: {
        id: dataset.id,
        name: dataset.name,
        goalSamples: dataset.goalSamples,
        goalName: dataset.goalName,
      },
      progress: {
        current: total,
        target: dataset.goalSamples || 100,
        percentage: Math.round((total / (dataset.goalSamples || 100)) * 100),
      },
    };
  } catch (error) {
    console.error("Error fetching dataset stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch dataset statistics",
    });
  }
});
