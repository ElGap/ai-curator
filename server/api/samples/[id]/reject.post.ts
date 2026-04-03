import { z } from "zod";
import { getDb } from "../../../db";
import { samples } from "../../../db/schema";
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

    const result = await db
      .update(samples)
      .set({
        status: "rejected",
        updatedAt: new Date(),
      })
      .where(eq(samples.id, params.id))
      .returning();

    return {
      success: true,
      message: "Sample rejected successfully",
      sample: result[0],
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

    console.error("Error rejecting sample:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to reject sample",
    });
  }
});
