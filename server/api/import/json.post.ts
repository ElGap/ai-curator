import { z } from "zod";
import { getDb } from "../../db";
import { samples, datasets } from "../../db/schema";
import { eq } from "drizzle-orm";

const jsonImportSchema = z.object({
  samples: z.array(
    z.object({
      instruction: z.string().min(1),
      input: z.string().optional().nullable(),
      output: z.string().min(1),
      systemPrompt: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      difficulty: z.string().optional().nullable(),
      qualityRating: z.number().min(1).max(5).optional().nullable(),
      tags: z.array(z.string()).optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ),
  format: z.enum(["alpaca", "sharegpt", "raw"]).default("raw"),
  datasetId: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = jsonImportSchema.parse(body);

    const db = getDb();

    // Get the target dataset - use provided datasetId or fall back to active
    let targetDataset;

    if (data.datasetId) {
      // Use the dataset specified in the request
      targetDataset = await db.query.datasets.findFirst({
        where: eq(datasets.id, data.datasetId),
      });

      if (!targetDataset) {
        throw createError({
          statusCode: 400,
          statusMessage: `Dataset with ID ${data.datasetId} not found.`,
        });
      }
    } else {
      // Fall back to active dataset for backward compatibility
      targetDataset = await db.query.datasets.findFirst({
        where: eq(datasets.isActive, 1),
      });

      if (!targetDataset) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "No dataset specified and no active dataset found. Please select a dataset or activate one.",
        });
      }
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Import each sample
    for (const ex of data.samples) {
      try {
        await db.insert(samples).values({
          datasetId: targetDataset.id,
          datasetName: targetDataset.name,
          instruction: ex.instruction,
          input: ex.input || null,
          output: ex.output,
          systemPrompt: ex.systemPrompt || null,
          category: ex.category || "general",
          difficulty: ex.difficulty || "intermediate",
          qualityRating: ex.qualityRating || 3,
          notes: ex.notes || null,
          tags: JSON.stringify(ex.tags || []),
          source: "json",
          status: "approved",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        imported++;
      } catch (error) {
        failed++;
        errors.push(`Failed to import: ${error}`);
      }
    }

    return {
      success: true,
      imported,
      failed,
      message: `Successfully imported ${imported} samples${failed > 0 ? `, ${failed} failed` : ""}`,
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
