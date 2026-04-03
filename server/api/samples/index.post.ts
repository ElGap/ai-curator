import { z } from "zod";
import { getDb } from "../../db";
import { samples, datasets } from "../../db/schema";
import { eq } from "drizzle-orm";

const createSampleSchema = z.object({
  // Core Fields (Required)
  instruction: z.string().min(1, "Instruction is required"),
  input: z.string().optional().nullable(),
  output: z.string().min(1, "Output is required"),

  // Metadata Fields
  systemPrompt: z.string().optional().nullable(),
  category: z.string().default("general"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  qualityRating: z.number().min(1).max(5).default(3),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),

  // Dataset Selection
  datasetId: z.number().optional(),

  // Source Tracking
  source: z.string().default("manual"),
  model: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  messageId: z.string().optional().nullable(),

  // Technical
  tokensIn: z.number().optional().nullable(),
  tokensOut: z.number().optional().nullable(),
  cost: z.number().optional().nullable(),
  toolsUsed: z.array(z.string()).optional().nullable(),

  // Review Status
  status: z.enum(["draft", "review", "approved", "rejected"]).default("draft"),
});

export default defineEventHandler(async (event) => {
  let body: any;
  try {
    body = await readBody(event);
    const data = createSampleSchema.parse(body);

    const db = getDb();

    // Determine which dataset to use
    let targetDataset;

    if (data.datasetId) {
      // Use the dataset specified by the user
      targetDataset = await db.query.datasets.findFirst({
        where: (datasets, { eq }) => eq(datasets.id, data.datasetId),
      });

      if (!targetDataset) {
        throw createError({
          statusCode: 400,
          statusMessage: `Dataset with ID ${data.datasetId} not found`,
        });
      }
    } else {
      // Fall back to active dataset for backward compatibility
      targetDataset = await db.query.datasets.findFirst({
        where: (datasets, { eq }) => eq(datasets.isActive, 1),
      });

      if (!targetDataset) {
        throw createError({
          statusCode: 500,
          statusMessage:
            "No dataset specified and no active dataset found. Please select a dataset.",
        });
      }
    }

    const result = await db
      .insert(samples)
      .values({
        datasetId: targetDataset.id,
        datasetName: targetDataset.name,
        instruction: data.instruction,
        input: data.input || null,
        output: data.output,
        systemPrompt: data.systemPrompt || null,
        category: data.category,
        difficulty: data.difficulty,
        qualityRating: data.qualityRating,
        notes: data.notes || null,
        tags: JSON.stringify(data.tags),
        source: data.source,
        model: data.model || null,
        sessionId: data.sessionId || null,
        messageId: data.messageId || null,
        tokensIn: data.tokensIn || null,
        tokensOut: data.tokensOut || null,
        cost: data.cost || null,
        toolsUsed: data.toolsUsed ? JSON.stringify(data.toolsUsed) : null,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update dataset statistics
    const allSamples = await db.query.samples.findMany({
      where: (samples, { eq }) => eq(samples.datasetId, targetDataset.id),
    });

    await db
      .update(datasets)
      .set({
        sampleCount: allSamples.length,
        approvedCount: allSamples.filter((e) => e.status === "approved").length,
        lastImportAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(datasets.id, targetDataset.id));

    return {
      success: true,
      sample: result[0],
      dataset: {
        id: targetDataset.id,
        name: targetDataset.name,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation error on POST:", error);
      console.error("Request body that failed:", JSON.stringify(body, null, 2));

      // Get issues from the error
      const issues = (error as any).issues || [];
      const errorMessage =
        issues.length > 0
          ? issues.map((e: any) => `${e.path?.join?.(".") || "unknown"}: ${e.message}`).join(", ")
          : "Validation failed";

      throw createError({
        statusCode: 400,
        statusMessage: "Validation error: " + errorMessage,
        data: issues,
      });
    }

    console.error("Error creating sample:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create sample",
    });
  }
});
