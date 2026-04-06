// server/api/import/json.post.ts
// JSON import API endpoint - uses unified ImportService

import { z } from "zod";
import { importService } from "../../services/import/index.ts";
import { rawSampleSchema } from "../../services/import/index.ts";
import type { ImportSource } from "../../services/import/index.ts";

// API-specific schema extending the base schema
const apiImportSchema = z.object({
  samples: z.array(rawSampleSchema).min(1).max(10000), // Limit to 10K per request
  datasetId: z.number().optional(),
  format: z.enum(["alpaca", "sharegpt", "raw"]).default("raw"),
  options: z
    .object({
      status: z.enum(["draft", "review", "approved", "rejected"]).optional(),
      dryRun: z.boolean().optional(),
    })
    .optional(),
});

/**
 * POST /api/import/json
 * Import samples from JSON array using unified ImportService
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = apiImportSchema.parse(body);

    // Use unified ImportService - status is determined by UI based on quality rating
    // UI sets status to "approved" if quality > 4, otherwise "draft"
    const result = await importService.importSamples(data.samples, {
      datasetId: data.datasetId,
      // Don't override status - use what UI sent (or let samples use their own status)
      status: data.options?.status,
      source: "web" as ImportSource,
      dryRun: data.options?.dryRun || false,
    });

    return {
      success: result.success,
      imported: result.imported,
      failed: result.failed,
      dataset: result.dataset,
      message: `Successfully imported ${result.imported} samples${result.failed > 0 ? `, ${result.failed} failed` : ""}`,
      errors: result.errors.slice(0, 10), // Limit errors in response
    };
  } catch (error) {
    console.error("Error importing JSON:", error);

    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => {
          const path = issue.path.join(".");
          return `${path}: ${issue.message}`;
        })
        .join("; ");

      throw createError({
        statusCode: 400,
        statusMessage: `Invalid JSON format: ${issues}`,
        data: error.issues,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to import JSON",
    });
  }
});
