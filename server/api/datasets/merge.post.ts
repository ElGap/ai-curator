import { z } from "zod";
import { getDb } from "../../db";
import { samples, datasets } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

// Zod schema for merge request validation
const mergeSchema = z.object({
  sourceDatasetId: z.number().int().positive(),
  targetDatasetId: z.number().int().positive().optional(),
  newDatasetName: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9-_\s]+$/)
    .optional(),
  deleteSource: z.boolean().default(false),
});

/**
 * POST /api/datasets/merge
 * Merge samples from one dataset into another
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { sourceDatasetId, targetDatasetId, newDatasetName, deleteSource } =
      mergeSchema.parse(body);

    if (!sourceDatasetId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Source dataset ID is required",
      });
    }

    const db = getDb();

    // Verify source dataset exists
    const sourceDataset = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, sourceDatasetId))
      .get();

    if (!sourceDataset) {
      throw createError({
        statusCode: 404,
        statusMessage: "Source dataset not found",
      });
    }

    let finalTargetId: number;

    if (targetDatasetId) {
      // Merge into existing dataset
      const targetDataset = await db
        .select()
        .from(datasets)
        .where(eq(datasets.id, targetDatasetId))
        .get();

      if (!targetDataset) {
        throw createError({
          statusCode: 404,
          statusMessage: "Target dataset not found",
        });
      }

      if (sourceDatasetId === targetDatasetId) {
        throw createError({
          statusCode: 400,
          statusMessage: "Cannot merge a dataset into itself",
        });
      }

      finalTargetId = targetDatasetId;
    } else if (newDatasetName) {
      // Create new dataset
      const result = await db
        .insert(datasets)
        .values({
          name: newDatasetName,
          description: `Created by merging from ${sourceDataset.name}`,
          defaultQuality: sourceDataset.defaultQuality,
          defaultCategory: sourceDataset.defaultCategory,
          defaultAutoApprove: sourceDataset.defaultAutoApprove,
          isActive: 0,
        })
        .returning({ id: datasets.id });

      finalTargetId = result[0].id;
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: "Either targetDatasetId or newDatasetName is required",
      });
    }

    // Get all samples from source dataset
    const sourceSamples = await db
      .select()
      .from(samples)
      .where(eq(samples.datasetId, sourceDatasetId));

    if (sourceSamples.length === 0) {
      return {
        success: true,
        message: "Source dataset has no samples to merge",
        mergedCount: 0,
        targetDatasetId: finalTargetId,
      };
    }

    // Copy samples to target dataset
    const targetDataset = await db
      .select()
      .from(datasets)
      .where(eq(datasets.id, finalTargetId))
      .get();

    const insertedSamples = await Promise.all(
      sourceSamples.map(async (sample) => {
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...sampleData } = sample;
        return db
          .insert(samples)
          .values({
            ...sampleData,
            datasetId: finalTargetId,
            datasetName: targetDataset?.name,
          })
          .returning({ id: samples.id });
      })
    );

    const mergedCount = insertedSamples.length;

    // Update target dataset counts
    const approvedCount = sourceSamples.filter((s) => s.status === "approved").length;
    await db
      .update(datasets)
      .set({
        sampleCount: sql`${datasets.sampleCount} + ${mergedCount}`,
        approvedCount: sql`${datasets.approvedCount} + ${approvedCount}`,
        updatedAt: sql`(strftime('%s', 'now') * 1000)`,
      })
      .where(eq(datasets.id, finalTargetId));

    // Delete source dataset if requested
    if (deleteSource) {
      // Delete all samples from source
      await db.delete(samples).where(eq(samples.datasetId, sourceDatasetId));

      // Delete the source dataset
      await db.delete(datasets).where(eq(datasets.id, sourceDatasetId));
    }

    return {
      success: true,
      message: deleteSource
        ? `Successfully merged ${mergedCount} samples and deleted source dataset`
        : `Successfully merged ${mergedCount} samples`,
      mergedCount,
      targetDatasetId: finalTargetId,
    };
  } catch (error: any) {
    console.error("Error merging datasets:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${issues}`,
        data: error.issues,
      });
    }

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to merge datasets",
    });
  }
});
