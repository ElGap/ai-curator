import { z } from "zod";
import { getDb } from "../../db";
import { datasets, userSettings } from "../../db/schema";
import { eq } from "drizzle-orm";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  defaultQuality: z.enum(["high", "medium", "low"]).default("medium"),
  defaultCategory: z.string().default("general"),
  defaultAutoApprove: z.boolean().default(false),
  goalSamples: z.number().int().min(10).max(10000).optional(), // Optional, uses global default if not provided
  goalName: z.string().min(1).max(100).optional().default("First Fine-Tuning"), // Name of the project/goal
});

/**
 * POST /api/datasets
 * Create a new dataset
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = createSchema.parse(body);

    const db = getDb();

    // Check if name already exists
    const existing = await db.query.datasets.findFirst({
      where: (datasets, { eq }) => eq(datasets.name, data.name),
    });

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: "Dataset with this name already exists",
      });
    }

    // Get user's default goal if not specified
    let goalSamples = data.goalSamples;
    if (goalSamples === undefined) {
      const userSettingsResult = await db.select().from(userSettings).where(eq(userSettings.id, 1));
      goalSamples = userSettingsResult[0]?.defaultGoalSamples || 100;
    }

    // Insert new dataset
    const result = await db
      .insert(datasets)
      .values({
        name: data.name,
        description: data.description,
        defaultQuality: data.defaultQuality,
        defaultCategory: data.defaultCategory,
        defaultAutoApprove: data.defaultAutoApprove ? 1 : 0,
        goalSamples: goalSamples,
        goalName: data.goalName,
        isActive: 0, // Not active by default
        isArchived: 0,
        sampleCount: 0,
        approvedCount: 0,
      })
      .returning();

    return {
      success: true,
      dataset: result[0],
      message: `Dataset "${data.name}" created successfully`,
    };
  } catch (error) {
    console.error("Error creating dataset:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation error",
        data: error.issues,
      });
    }

    if (error instanceof Error && error.message.includes("already exists")) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create dataset",
    });
  }
});
