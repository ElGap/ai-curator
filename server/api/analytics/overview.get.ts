// server/api/analytics/overview.get.ts
// Dataset overview analytics endpoint

import { getDb } from "../../db";
import { samples, datasets } from "../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const datasetId = query.datasetId ? parseInt(query.datasetId as string) : null;

    const db = getDb();

    // Get target dataset
    let targetDataset;
    if (datasetId) {
      targetDataset = await db.query.datasets.findFirst({
        where: eq(datasets.id, datasetId),
      });
    } else {
      targetDataset = await db.query.datasets.findFirst({
        where: eq(datasets.isActive, 1),
      });
    }

    if (!targetDataset) {
      throw createError({
        statusCode: 404,
        statusMessage: "Dataset not found",
      });
    }

    // Get all samples for this dataset
    const datasetSamples = await db.query.samples.findMany({
      where: eq(samples.datasetId, targetDataset.id),
    });

    if (datasetSamples.length === 0) {
      return {
        dataset: {
          id: targetDataset.id,
          name: targetDataset.name,
        },
        overview: {
          totalSamples: 0,
          message: "No samples in dataset",
        },
      };
    }

    // Calculate metrics
    const totalSamples = datasetSamples.length;

    // Status distribution
    const approvedCount = datasetSamples.filter((s) => s.status === "approved").length;
    const draftCount = datasetSamples.filter((s) => s.status === "draft").length;
    const reviewCount = datasetSamples.filter(
      (s) => s.status === "review" || s.status === "needs_review"
    ).length;
    const rejectedCount = datasetSamples.filter((s) => s.status === "rejected").length;

    // Quality metrics
    const qualityRatings = datasetSamples.map((s) => s.qualityRating || 3);
    const avgQuality = qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length;
    const sortedQuality = [...qualityRatings].sort((a, b) => a - b);
    const medianQuality = sortedQuality[Math.floor(sortedQuality.length / 2)];

    // Quality distribution
    const qualityDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    qualityRatings.forEach((rating) => {
      qualityDistribution[rating] = (qualityDistribution[rating] || 0) + 1;
    });

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    datasetSamples.forEach((s) => {
      const cat = s.category || "general";
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    // Difficulty distribution
    const difficultyDistribution: Record<string, number> = {};
    datasetSamples.forEach((s) => {
      const diff = s.difficulty || "intermediate";
      difficultyDistribution[diff] = (difficultyDistribution[diff] || 0) + 1;
    });

    // Source distribution
    const sourceDistribution: Record<string, number> = {};
    datasetSamples.forEach((s) => {
      const src = s.source || "manual";
      sourceDistribution[src] = (sourceDistribution[src] || 0) + 1;
    });

    // Content metrics
    const instructionLengths = datasetSamples.map((s) => (s.instruction || "").length);
    const outputLengths = datasetSamples.map((s) => (s.output || "").length);

    const avgInstructionLength =
      instructionLengths.reduce((a, b) => a + b, 0) / instructionLengths.length;
    const avgOutputLength = outputLengths.reduce((a, b) => a + b, 0) / outputLengths.length;
    const maxInstructionLength = Math.max(...instructionLengths);
    const maxOutputLength = Math.max(...outputLengths);
    const minInstructionLength = Math.min(...instructionLengths);
    const minOutputLength = Math.min(...outputLengths);

    // Calculate training readiness score (0-100)
    let readinessScore = 0;

    // Quantity (0-25 points)
    if (totalSamples >= 10000) readinessScore += 25;
    else if (totalSamples >= 5000) readinessScore += 20;
    else if (totalSamples >= 1000) readinessScore += 15;
    else readinessScore += Math.floor((totalSamples / 1000) * 15);

    // Quality (0-25 points)
    if (avgQuality >= 4) readinessScore += 25;
    else if (avgQuality >= 3.5) readinessScore += 20;
    else if (avgQuality >= 3) readinessScore += 15;
    else readinessScore += Math.floor((avgQuality / 3) * 15);

    // Validation (0-25 points) - all samples have instruction and output
    const validSamples = datasetSamples.filter((s) => s.instruction && s.output).length;
    readinessScore += Math.floor((validSamples / totalSamples) * 25);

    // Approval rate (0-25 points)
    const approvalRate = approvedCount / totalSamples;
    readinessScore += Math.floor(approvalRate * 25);

    // Recent activity
    const recentSamples = datasetSamples.filter((s) => {
      const createdAt = s.createdAt ? new Date(s.createdAt) : null;
      if (!createdAt) return false;
      const daysDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // Last 7 days
    }).length;

    return {
      dataset: {
        id: targetDataset.id,
        name: targetDataset.name,
        description: targetDataset.description,
        createdAt: targetDataset.createdAt,
        lastImportAt: targetDataset.lastImportAt,
      },
      overview: {
        totalSamples,
        approvedCount,
        draftCount,
        reviewCount,
        rejectedCount,
        approvalRate: Math.round((approvedCount / totalSamples) * 100),
        recentSamples,
        recentSamplesLabel: recentSamples > 0 ? `${recentSamples} this week` : "No recent activity",
      },
      quality: {
        average: Math.round(avgQuality * 10) / 10,
        median: medianQuality,
        distribution: qualityDistribution,
      },
      distribution: {
        categories: categoryDistribution,
        difficulties: difficultyDistribution,
        sources: sourceDistribution,
      },
      content: {
        instruction: {
          averageLength: Math.round(avgInstructionLength),
          maxLength: maxInstructionLength,
          minLength: minInstructionLength,
        },
        output: {
          averageLength: Math.round(avgOutputLength),
          maxLength: maxOutputLength,
          minLength: minOutputLength,
        },
      },
      readiness: {
        score: readinessScore,
        maxScore: 100,
        grade:
          readinessScore >= 80
            ? "A"
            : readinessScore >= 60
              ? "B"
              : readinessScore >= 40
                ? "C"
                : "D",
        status: readinessScore >= 60 ? "Ready for training" : "Needs improvement",
      },
      computedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error computing analytics:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to compute analytics",
    });
  }
});
