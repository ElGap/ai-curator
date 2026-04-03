import { z } from "zod";
import { getDb } from "../../db";
import { userSettings } from "../../db/schema";
import { eq } from "drizzle-orm";

const updateSchema = z.object({
  defaultGoalSamples: z.number().int().min(10).max(10000),
});

/**
 * PUT /api/settings
 * Update user settings (global defaults)
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = updateSchema.parse(body);

    const db = getDb();

    // Update or insert user settings (always row 1)
    const existing = await db.select().from(userSettings).where(eq(userSettings.id, 1));

    let result;
    if (existing.length === 0) {
      // Create new settings
      result = await db
        .insert(userSettings)
        .values({
          id: 1,
          defaultGoalSamples: data.defaultGoalSamples,
        })
        .returning();
    } else {
      // Update existing settings
      result = await db
        .update(userSettings)
        .set({
          defaultGoalSamples: data.defaultGoalSamples,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.id, 1))
        .returning();
    }

    return {
      success: true,
      settings: result[0],
      message: "Settings updated successfully",
    };
  } catch (error) {
    console.error("Error updating user settings:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation error",
        data: error.issues,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update settings",
    });
  }
});
