import { z } from "zod";
import { getDb } from "../db";
import { samples, datasets } from "../db/schema";
import { eq, gte, inArray, and } from "drizzle-orm";

const exportSchema = z.object({
  format: z.enum(["alpaca", "jsonl", "json", "mlx"]),
  status: z.enum(["all", "approved", "draft", "review"]).default("all"),
  split: z.enum(["none", "90-10", "80-20", "70-30"]).default("none"),
  minQuality: z.number().min(1).max(5).optional(),
  categories: z.array(z.string()).optional(),
  includeMetadata: z.boolean().default(true),
  sampleIds: z.array(z.number()).optional(),
  datasetId: z.number().optional(),
});

// Format converters
function toAlpacaFormat(sample: any) {
  return {
    instruction: sample.instruction,
    input: sample.input || "",
    output: sample.output,
    system: sample.systemPrompt || undefined,
  };
}

function toMLXFormat(sample: any) {
  // MLX-LM requires Mistral/LLaMA chat template format
  // Format: {"text": "<s>[INST] <<SYS>>\nSystem text\n<</SYS>>\n\nUser question [/INST] Assistant response</s>"}
  let text = "<s>[INST] ";

  // Add system prompt in SYS tags if present
  if (sample.systemPrompt) {
    text += `<<SYS>>\n${sample.systemPrompt}\n<</SYS>>\n\n`;
  }

  // Add instruction (and input/context if present)
  if (sample.input) {
    text += `${sample.instruction}\n\nContext: ${sample.input}`;
  } else {
    text += sample.instruction;
  }

  // Close instruction and add output with end token
  text += ` [/INST] ${sample.output}</s>`;

  return { text };
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const params = exportSchema.parse(body);

    const db = getDb();

    // Get dataset name - prefer selected dataset, fallback to active dataset
    let datasetName = "dataset";
    if (params.datasetId) {
      const selectedDataset = await db.query.datasets.findFirst({
        where: eq(datasets.id, params.datasetId),
      });
      datasetName = selectedDataset?.name || "dataset";
    } else {
      const activeDataset = await db.query.datasets.findFirst({
        where: eq(datasets.isActive, 1),
      });
      datasetName = activeDataset?.name || "dataset";
    }

    // Build where conditions
    const conditions = [];

    // Filter by dataset if provided
    if (params.datasetId) {
      conditions.push(eq(samples.datasetId, params.datasetId));
    }

    // Filter by specific sample IDs if provided (for version exports)
    if (params.sampleIds && params.sampleIds.length > 0) {
      conditions.push(inArray(samples.id, params.sampleIds));
    }

    // Filter by status
    if (params.status !== "all") {
      conditions.push(eq(samples.status, params.status));
    }

    // Filter by minimum quality
    if (params.minQuality) {
      conditions.push(gte(samples.qualityRating, params.minQuality));
    }

    // Apply all conditions
    let query: any = db.select().from(samples);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Filter by categories
    if (params.categories && params.categories.length > 0) {
      // SQLite doesn't support array contains directly, filter in JS
    }

    const allSamples = await query;

    // Apply category filter in JS if needed
    let filteredSamples = allSamples;
    if (params.categories && params.categories.length > 0) {
      filteredSamples = allSamples.filter((ex) =>
        params.categories!.includes(ex.category || "general")
      );
    }

    if (filteredSamples.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No samples match the selected filters",
      });
    }

    // Prepare data based on format
    let exportData: any;
    let contentType: string;
    let fileExtension: string;

    switch (params.format) {
      case "alpaca":
        exportData = filteredSamples.map(toAlpacaFormat);
        contentType = "application/json";
        fileExtension = "json";
        break;

      case "jsonl":
        exportData = filteredSamples.map((ex) => JSON.stringify(toAlpacaFormat(ex))).join("\n");
        contentType = "application/jsonl";
        fileExtension = "jsonl";
        break;

      case "mlx":
        exportData = filteredSamples.map((ex) => JSON.stringify(toMLXFormat(ex))).join("\n");
        contentType = "application/jsonl";
        fileExtension = "jsonl";
        break;

      case "json":
        exportData = {
          dataset: filteredSamples.map((ex) => ({
            ...toAlpacaFormat(ex),
            metadata: params.includeMetadata
              ? {
                  category: ex.category,
                  difficulty: ex.difficulty,
                  qualityRating: ex.qualityRating,
                  status: ex.status,
                  source: ex.source,
                  model: ex.model,
                  tags: ex.tags ? JSON.parse(ex.tags) : [],
                  createdAt: ex.createdAt,
                  notes: ex.notes,
                }
              : undefined,
          })),
          stats: {
            total: filteredSamples.length,
            categories: {} as Record<string, number>,
            avgQuality:
              filteredSamples.reduce((sum, ex) => sum + (ex.qualityRating || 3), 0) /
              filteredSamples.length,
          },
        };

        // Count categories
        filteredSamples.forEach((ex) => {
          const cat = ex.category || "general";
          exportData.stats.categories[cat] = (exportData.stats.categories[cat] || 0) + 1;
        });

        contentType = "application/json";
        fileExtension = "json";
        break;
    }

    // Generate meaningful filename
    const safeDatasetName = datasetName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 30);
    const timestamp = new Date().toISOString().split("T")[0];
    const count = filteredSamples.length;

    const baseFilename = `${safeDatasetName}_${count}ex_${timestamp}_${params.format}`;

    // Handle train/validation split
    let trainData = exportData;
    let valData: any = null;

    if (params.split !== "none") {
      const [trainRatio, _valRatio] = params.split.split("-").map(Number);
      const total = filteredSamples.length;
      const trainCount = Math.floor(total * (trainRatio / 100));

      // Shuffle for random split
      const shuffled = [...filteredSamples].sort(() => Math.random() - 0.5);
      const trainSamples = shuffled.slice(0, trainCount);
      const valSamples = shuffled.slice(trainCount);

      if (params.format === "jsonl") {
        trainData = trainSamples.map((ex) => JSON.stringify(toAlpacaFormat(ex))).join("\n");
        valData = valSamples.map((ex) => JSON.stringify(toAlpacaFormat(ex))).join("\n");
      } else if (params.format === "mlx") {
        trainData = trainSamples.map((ex) => JSON.stringify(toMLXFormat(ex))).join("\n");
        valData = valSamples.map((ex) => JSON.stringify(toMLXFormat(ex))).join("\n");
      } else {
        trainData = trainSamples.map(toAlpacaFormat);
        valData = valSamples.map(toAlpacaFormat);
      }

      // Return both splits with meaningful filenames
      return {
        success: true,
        format: params.format,
        splits: {
          train: {
            data: trainData,
            count: trainSamples.length,
            filename: `${baseFilename}_train.${fileExtension}`,
          },
          validation: {
            data: valData,
            count: valSamples.length,
            filename: `${baseFilename}_val.${fileExtension}`,
          },
        },
        total: filteredSamples.length,
        contentType,
      };
    }

    // Return single file with meaningful filename
    return {
      success: true,
      format: params.format,
      data: exportData,
      count: filteredSamples.length,
      filename: `${baseFilename}.${fileExtension}`,
      contentType,
    };
  } catch (error) {
    console.error("Error exporting dataset:", error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation error",
        data: error.issues,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to export dataset",
    });
  }
});
