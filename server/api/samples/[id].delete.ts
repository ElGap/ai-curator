import { z } from "zod";
import { getDb } from "../../db";
import { samples } from "../../db/schema";
import { eq } from "drizzle-orm";

const paramsSchema = z.object({
  id: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  try {
    const params = await getValidatedRouterParams(event, paramsSchema.parse);

    const db = getDb();

    // Check if sample exists
    const existing = await db.select().from(samples).where(eq(samples.id, params.id)).limit(1);

    if (existing.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Sample not found",
      });
    }

    await db.delete(samples).where(eq(samples.id, params.id));

    return {
      success: true,
      message: "Sample deleted successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid sample ID",
      });
    }

    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }

    console.error("Error deleting sample:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete sample",
    });
  }
});
