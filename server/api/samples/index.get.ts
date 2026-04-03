import { z } from "zod";
import { getDb } from "../../db";
import { samples } from "../../db/schema";
import { desc, asc, like, and, eq, or } from "drizzle-orm";

const querySchema = z.object({
  datasetId: z.coerce.number().optional(),
  status: z.enum(["draft", "review", "approved", "rejected"]).optional(),
  source: z.string().optional(), // Allow any source value, not just enum
  category: z.string().optional(),
  sort: z.enum(["newest", "oldest", "quality"]).default("newest"),
  search: z.string().optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
});

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const params = querySchema.parse(query);

    const db = getDb();

    // Build where conditions
    const conditions = [];

    if (params.datasetId) {
      conditions.push(eq(samples.datasetId, params.datasetId));
    }

    if (params.status) {
      // Handle review status - also include needs_review
      if (params.status === "review") {
        conditions.push(or(eq(samples.status, "review"), eq(samples.status, "needs_review")));
      } else {
        conditions.push(eq(samples.status, params.status));
      }
    }

    if (params.source) {
      conditions.push(eq(samples.source, params.source));
    }

    if (params.category) {
      conditions.push(eq(samples.category, params.category));
    }

    if (params.search) {
      const searchPattern = `%${params.search}%`;
      conditions.push(
        or(like(samples.instruction, searchPattern), like(samples.output, searchPattern))
      );
    }

    // Build query
    let dbQuery: any = db.select().from(samples);

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions));
    }

    // Apply sorting
    if (params.sort === "newest") {
      dbQuery = dbQuery.orderBy(desc(samples.createdAt));
    } else if (params.sort === "oldest") {
      dbQuery = dbQuery.orderBy(asc(samples.createdAt));
    } else if (params.sort === "quality") {
      dbQuery = dbQuery.orderBy(desc(samples.qualityRating));
    }

    // Apply pagination
    dbQuery = dbQuery.limit(params.limit).offset(params.offset);

    // Execute query
    const results = await dbQuery;

    // Convert timestamps from seconds to milliseconds for proper JavaScript Date handling
    const convertedResults = results.map((sample: any) => {
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
      return sample;
    });

    // Get total count for pagination
    let countQuery: any = db.select({ count: samples.id }).from(samples);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const totalResult = await countQuery;
    const total = totalResult.length;

    // Get distinct categories and sources for filters (respecting dataset filter)
    const filterConditions = params.datasetId ? [eq(samples.datasetId, params.datasetId)] : [];

    const categoriesResult = await db
      .select({ category: samples.category })
      .from(samples)
      .where(filterConditions.length > 0 ? and(...filterConditions) : undefined)
      .groupBy(samples.category)
      .orderBy(samples.category);

    const sourcesResult = await db
      .select({ source: samples.source })
      .from(samples)
      .where(filterConditions.length > 0 ? and(...filterConditions) : undefined)
      .groupBy(samples.source)
      .orderBy(samples.source);

    const availableCategories = categoriesResult
      .map((r) => r.category || "general")
      .filter(Boolean);
    const availableSources = sourcesResult.map((r) => r.source || "unknown").filter(Boolean);

    return {
      samples: convertedResults,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore: total > params.offset + params.limit,
      },
      filters: {
        categories: availableCategories,
        sources: availableSources,
      },
    };
  } catch (error) {
    console.error("Error fetching samples:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch samples",
    });
  }
});
