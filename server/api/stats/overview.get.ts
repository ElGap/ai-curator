import { getDb } from "../../db";
import { samples, datasets, userSettings } from "../../db/schema";
import { eq, and, or } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const db = getDb();
    const query = getQuery(event);
    const datasetId = query.datasetId ? parseInt(query.datasetId as string) : null;

    let targetDatasetId: number | null = null;
    let targetDatasetGoal = 100;
    let targetDatasetName: string | null = null;
    let targetDatasetGoalName: string | null = null;

    if (datasetId && !isNaN(datasetId)) {
      // Use the specified dataset
      const datasetResult = await db.select().from(datasets).where(eq(datasets.id, datasetId));

      if (datasetResult.length > 0) {
        targetDatasetId = datasetResult[0].id;
        targetDatasetGoal = datasetResult[0].goalSamples || 100;
        targetDatasetName = datasetResult[0].name;
        targetDatasetGoalName = datasetResult[0].goalName;
      }
    }

    // Get user settings (global default) early
    const userSettingsResult = await db.select().from(userSettings).where(eq(userSettings.id, 1));
    const globalDefaultGoal = userSettingsResult[0]?.defaultGoalSamples || 100;

    // If no valid dataset specified, return empty stats
    if (!targetDatasetId) {
      return {
        total: 0,
        approved: 0,
        draft: 0,
        review: 0,
        rejected: 0,
        sources: {},
        categories: {},
        difficulties: {},
        progress: {
          current: 0,
          target: 100,
          percentage: 0,
        },
        globalDefaultGoal,
        activeDatasetGoal: globalDefaultGoal,
        activeDatasetName: null,
        datasetId: null,
        datasetName: null,
        datasetGoal: 100,
        datasetGoalName: null,
        isActiveDataset: false,
      };
    }

    // Get samples for the target dataset (or all samples if no dataset)
    let totalResult;
    let approvedResult;
    let draftResult;
    let reviewResult;
    let rejectedResult;

    if (targetDatasetId) {
      totalResult = await db.select().from(samples).where(eq(samples.datasetId, targetDatasetId));
      approvedResult = await db
        .select()
        .from(samples)
        .where(and(eq(samples.datasetId, targetDatasetId), eq(samples.status, "approved")));
      draftResult = await db
        .select()
        .from(samples)
        .where(and(eq(samples.datasetId, targetDatasetId), eq(samples.status, "draft")));
      reviewResult = await db
        .select()
        .from(samples)
        .where(
          and(
            eq(samples.datasetId, targetDatasetId),
            or(eq(samples.status, "review"), eq(samples.status, "needs_review"))
          )
        );
      rejectedResult = await db
        .select()
        .from(samples)
        .where(and(eq(samples.datasetId, targetDatasetId), eq(samples.status, "rejected")));
    } else {
      totalResult = await db.select().from(samples);
      approvedResult = await db.select().from(samples).where(eq(samples.status, "approved"));
      draftResult = await db.select().from(samples).where(eq(samples.status, "draft"));
      reviewResult = await db
        .select()
        .from(samples)
        .where(or(eq(samples.status, "review"), eq(samples.status, "needs_review")));
      rejectedResult = await db.select().from(samples).where(eq(samples.status, "rejected"));
    }

    const total = totalResult.length;
    const approved = approvedResult.length;
    const draft = draftResult.length;
    const review = reviewResult.length;
    const rejected = rejectedResult.length;

    // Get by source breakdown
    const sources: Record<string, number> = {};
    for (const sample of totalResult) {
      const source = sample.source || "unknown";
      sources[source] = (sources[source] || 0) + 1;
    }

    // Get by category breakdown
    const categories: Record<string, number> = {};
    for (const sample of totalResult) {
      const category = sample.category || "unknown";
      categories[category] = (categories[category] || 0) + 1;
    }

    // Get by difficulty breakdown
    const difficulties: Record<string, number> = {};
    for (const sample of totalResult) {
      const difficulty = sample.difficulty || "unknown";
      difficulties[difficulty] = (difficulties[difficulty] || 0) + 1;
    }

    // Get active dataset info for reference
    const activeDatasetResult = await db.select().from(datasets).where(eq(datasets.isActive, 1));
    const activeDataset = activeDatasetResult[0];

    return {
      total,
      approved,
      draft,
      review,
      rejected,
      sources,
      categories,
      difficulties,
      progress: {
        current: total,
        target: targetDatasetGoal,
        percentage: Math.round((total / targetDatasetGoal) * 100),
      },
      globalDefaultGoal,
      activeDatasetGoal: activeDataset?.goalSamples || globalDefaultGoal,
      activeDatasetName: activeDataset?.name || null,
      datasetId: targetDatasetId,
      datasetName: targetDatasetName,
      datasetGoal: targetDatasetGoal,
      datasetGoalName: targetDatasetGoalName,
      isActiveDataset: targetDatasetId === activeDataset?.id,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch statistics",
    });
  }
});
