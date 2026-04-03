import { z } from "zod";
import { getDb } from "../../db";
import { samples } from "../../db/schema";
import { eq, and, gt, lt, desc, asc } from "drizzle-orm";

const paramsSchema = z.object({
  id: z.coerce.number(),
});

export default defineEventHandler(async (event) => {
  try {
    const params = await getValidatedRouterParams(event, paramsSchema.parse);

    const db = getDb();

    const result = await db.select().from(samples).where(eq(samples.id, params.id)).limit(1);

    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Sample not found",
      });
    }

    // Convert timestamps from seconds to milliseconds for proper JavaScript Date handling
    const sample = result[0] as any;
    if (
      sample.createdAt &&
      typeof sample.createdAt === "number" &&
      sample.createdAt < 10000000000
    ) {
      sample.createdAt = sample.createdAt * 1000;
    }
    if (
      sample.updatedAt &&
      typeof sample.updatedAt === "number" &&
      sample.updatedAt < 10000000000
    ) {
      sample.updatedAt = sample.updatedAt * 1000;
    }

    // Parse tags from JSON string to array
    if (sample.tags && typeof sample.tags === "string") {
      try {
        sample.tags = JSON.parse(sample.tags);
      } catch (_e) {
        sample.tags = [];
      }
    } else if (!sample.tags) {
      sample.tags = [];
    }

    // Find prev/next samples in the same dataset
    const datasetId = sample.datasetId || sample.dataset_id;

    let prevId = null;
    let nextId = null;

    if (datasetId) {
      // Previous = highest ID that is less than current
      const prevResult = await db
        .select({ id: samples.id })
        .from(samples)
        .where(and(eq(samples.datasetId, datasetId), lt(samples.id, params.id)))
        .orderBy(desc(samples.id))
        .limit(1);

      if (prevResult.length > 0) {
        prevId = prevResult[0].id;
      }

      // Next = lowest ID that is greater than current
      const nextResult = await db
        .select({ id: samples.id })
        .from(samples)
        .where(and(eq(samples.datasetId, datasetId), gt(samples.id, params.id)))
        .orderBy(asc(samples.id))
        .limit(1);

      if (nextResult.length > 0) {
        nextId = nextResult[0].id;
      }
    }

    return {
      sample,
      prevId,
      nextId,
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

    console.error("Error fetching sample:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch sample",
    });
  }
});
