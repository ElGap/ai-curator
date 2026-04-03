import { z } from "zod";
import { getDb } from "../../../db";
import { datasets, samples } from "../../../db/schema";
import { eq } from "drizzle-orm";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  defaultQuality: z.enum(["high", "medium", "low"]).optional(),
  defaultCategory: z.string().optional(),
  defaultAutoApprove: z.boolean().optional(),
  goalSamples: z.number().int().min(10).max(10000).optional(), // Allow updating goal
  goalName: z.string().min(1).max(100).optional(), // Allow updating goal name
});

/**
 * PUT /api/datasets/[id]
 * Update a dataset
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

    const body = await readBody(event);
    const data = updateSchema.parse(body);

    const db = getDb();

    // Check if dataset exists
    const existing = await db.query.datasets.findFirst({
      where: (datasets, { eq }) => eq(datasets.id, id),
    });

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Dataset not found",
      });
    }

    // If name is being changed, check for duplicates
    if (data.name && data.name !== existing.name) {
      const duplicate = await db.query.datasets.findFirst({
        where: (datasets, { eq }) => eq(datasets.name, data.name),
      });

      if (duplicate) {
        throw createError({
          statusCode: 409,
          statusMessage: "Dataset with this name already exists",
        });
      }

      // Update dataset_name in all samples
      await db.update(samples).set({ datasetName: data.name }).where(eq(samples.datasetId, id));
    }

    // Update dataset
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.defaultQuality !== undefined) updateData.defaultQuality = data.defaultQuality;
    if (data.defaultCategory !== undefined) updateData.defaultCategory = data.defaultCategory;
    if (data.defaultAutoApprove !== undefined)
      updateData.defaultAutoApprove = data.defaultAutoApprove ? 1 : 0;
    if (data.goalSamples !== undefined) updateData.goalSamples = data.goalSamples;
    if (data.goalName !== undefined) updateData.goalName = data.goalName;

    const result = await db.update(datasets).set(updateData).where(eq(datasets.id, id)).returning();

    return {
      success: true,
      dataset: result[0],
      message: `Dataset updated successfully`,
    };
  } catch (error) {
    console.error("Error updating dataset:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation error",
        data: error.issues,
      });
    }

    throw error;
  }
});
