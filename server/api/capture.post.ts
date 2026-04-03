// server/api/capture.post.ts
// Universal capture endpoint - accepts data from any source in Universal Format

import { z } from "zod";
import { capture } from "../services/capture";

// Zod schema for request validation
const CaptureRequestSchema = z.object({
  source: z
    .string()
    .min(1, "Source is required")
    .max(50, "Source key too long")
    .regex(/^[a-z0-9-]+$/, "Source key must be lowercase alphanumeric with hyphens"),

  apiVersion: z.enum(["1.0"]).default("1.0"),

  session: z
    .object({
      id: z.string().max(100),
      name: z.string().max(200).optional(),
      startedAt: z.string().datetime().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),

  records: z
    .array(
      z.object({
        // Core fields (required)
        instruction: z.string().min(1).max(10000),
        output: z.string().min(1).max(50000),

        // Context (optional)
        input: z.string().max(10000).optional().nullable(),
        systemPrompt: z.string().max(5000).optional().nullable(),

        // Identity (optional)
        source: z.string().optional(),
        sessionId: z.string().max(100).optional(),
        messageId: z.string().max(100).optional(),
        timestamp: z.string().datetime().optional(),

        // Categorization
        category: z.string().max(50).optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        qualityRating: z.number().min(1).max(5).optional(),
        tags: z.array(z.string()).optional(),

        // Rich context (optional)
        context: z
          .object({
            files: z
              .array(
                z.object({
                  path: z.string(),
                  content: z.string().max(10000).optional(),
                  language: z.string().optional(),
                })
              )
              .max(10)
              .optional(),
            environment: z
              .object({
                os: z.string().optional(),
                shell: z.string().optional(),
                language: z.string().optional(),
                workingDirectory: z.string().optional(),
              })
              .optional(),
            git: z
              .object({
                branch: z.string().optional(),
                commit: z.string().optional(),
                changedFiles: z.array(z.string()).max(100).optional(),
              })
              .optional(),
            model: z
              .object({
                name: z.string(),
                provider: z.string().optional(),
                version: z.string().optional(),
                parameters: z.record(z.string(), z.unknown()).optional(),
              })
              .optional(),
            tokens: z
              .object({
                input: z.number().optional(),
                output: z.number().optional(),
                total: z.number().optional(),
              })
              .optional(),
            cost: z.number().optional(),
            toolsUsed: z.array(z.string()).max(10).optional(),
            custom: z.record(z.string(), z.unknown()).optional(),
          })
          .optional(),

        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .min(1, "At least one record is required")
    .max(100, "Maximum 100 records per request"),

  metadata: z.record(z.string(), z.unknown()).optional(),

  options: z
    .object({
      datasetId: z.number().optional(),
      datasetName: z.string().optional(),
      autoApprove: z.boolean().default(false),
      skipDuplicates: z.boolean().default(true),
      enrichMetadata: z.boolean().default(true),
      dryRun: z.boolean().default(false),
    })
    .optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate request body
    const body = await readBody(event);
    const validatedRequest = CaptureRequestSchema.parse(body);

    // Process capture
    const result = await capture(validatedRequest);

    return result;
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
        data: { issues },
      });
    }

    // Handle known capture errors
    if (error && typeof error === "object" && "code" in error) {
      const captureError = error as Error & { code: string };
      const statusCode = getErrorStatusCode(captureError.code);

      throw createError({
        statusCode,
        statusMessage: captureError.message,
        data: { code: captureError.code },
      });
    }

    // Log and return generic error
    console.error("Capture endpoint error:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to process capture",
      data: { code: "INTERNAL_ERROR" },
    });
  }
});

/**
 * Get HTTP status code for error code
 */
function getErrorStatusCode(code: string): number {
  const statusCodes: Record<string, number> = {
    SOURCE_NOT_FOUND: 400,
    SOURCE_DISABLED: 403,
    CAPTURE_DISABLED: 503, // Service Unavailable when live capture is disabled
    DATASET_NOT_FOUND: 404,
    NO_ACTIVE_DATASET: 400,
    VALIDATION_ERROR: 400,
    INTERNAL_ERROR: 500,
  };

  return statusCodes[code] || 500;
}
