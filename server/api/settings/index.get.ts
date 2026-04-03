import { getDb } from "../../db";
import { userSettings } from "../../db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/settings
 * Get user settings (global defaults)
 */
export default defineEventHandler(async (_event) => {
  try {
    const db = getDb();

    // Get user settings (always row 1)
    const result = await db.select().from(userSettings).where(eq(userSettings.id, 1));

    if (result.length === 0) {
      // Create default settings if they don't exist
      const newSettings = await db
        .insert(userSettings)
        .values({
          id: 1,
          defaultGoalSamples: 100,
        })
        .returning();

      return {
        success: true,
        settings: newSettings[0],
      };
    }

    return {
      success: true,
      settings: result[0],
    };
  } catch (error) {
    console.error("Error fetching user settings:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch settings",
    });
  }
});
