import { z } from "zod";
import { getDb } from "../../db";
import { samples } from "../../db/schema";
import { inArray } from "drizzle-orm";

const bulkUpdateSchema = z.object({
  ids: z.array(z.number()),
  category: z.string().optional(),
  status: z.enum(["draft", "review", "approved", "rejected"]).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  tags: z.array(z.string()).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = bulkUpdateSchema.parse(body);

    if (data.ids.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No IDs provided",
      });
    }

    const db = getDb();

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.category !== undefined) {
      updateData.category = data.category;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.difficulty !== undefined) {
      updateData.difficulty = data.difficulty;
    }

    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags);
    }

    // Perform bulk update
    await db.update(samples).set(updateData).where(inArray(samples.id, data.ids));

    return {
      success: true,
      message: `Updated ${data.ids.length} samples`,
      updatedIds: data.ids,
    };
  } catch (error) {
    console.error("Error in bulk update:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation error",
        data: (error as any).errors,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to bulk update samples",
    });
  }
});
