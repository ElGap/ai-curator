// server/api/datasets/[id]/clear.post.ts
// Clear all samples from a dataset (with confirmation required)

import { z } from "zod";
import { importService } from "../../../services/import/index.ts";

const clearSchema = z.object({
  confirm: z.boolean().default(false),
});

/**
 * POST /api/datasets/:id/clear
 * Clear all samples from a dataset
 */
export default defineEventHandler(async (event) => {
  try {
    const params = event.context.params;
    if (!params?.id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Dataset ID is required",
      });
    }

    const datasetId = parseInt(params.id, 10);
    if (isNaN(datasetId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid dataset ID",
      });
    }

    const body = await readBody(event);
    const { confirm } = clearSchema.parse(body);

    if (!confirm) {
      throw createError({
        statusCode: 400,
        statusMessage: "Confirmation required. Set confirm: true to clear samples.",
      });
    }

    const result = await importService.clearSamples(datasetId);

    return {
      success: true,
      deleted: result.deleted,
      dataset: result.dataset,
      message: `Successfully cleared ${result.deleted} samples from dataset "${result.dataset.name}"`,
    };
  } catch (error) {
    console.error("Error clearing samples:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid request: ${error.issues.map((i) => i.message).join(", ")}`,
      });
    }

    if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to clear samples",
    });
  }
});
