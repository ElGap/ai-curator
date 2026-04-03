// server/services/capture/index.ts
// Main capture service - processes incoming records

import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { samples, datasets, captureSettings } from "../../db/schema";
import type {
  CaptureRequest,
  CaptureResponse,
  DuplicateResult,
  EnrichedRecord,
} from "../../types/capture";
import { getSource, updateSourceStats } from "../sources";
import { detectDuplicates } from "./deduplicator";
import { enrichRecord } from "./enricher";

/**
 * Main capture function
 * Processes a capture request and stores records in the database
 */
export async function capture(request: CaptureRequest): Promise<CaptureResponse> {
  const startTime = Date.now();

  try {
    const db = getDb();
    // 1. Validate source
    const source = await getSource(request.source);
    if (!source) {
      throw createCaptureError("SOURCE_NOT_FOUND", `Source '${request.source}' is not registered`);
    }

    if (!source.isEnabled) {
      throw createCaptureError("SOURCE_DISABLED", `Source '${request.source}' is disabled`);
    }

    // Check if live capture is globally enabled
    const captureDefaultSettings = await db.query.captureSettings.findFirst({
      where: eq(captureSettings.id, 1),
    });

    if (captureDefaultSettings?.isEnabled === false) {
      throw createCaptureError("CAPTURE_DISABLED", "Live capture is currently disabled");
    }

    // 2. Resolve dataset
    const dataset = await resolveDataset(request.options?.datasetId, request.options?.datasetName);

    // 3. Detect and filter duplicates
    const duplicates =
      request.options?.skipDuplicates !== false
        ? await detectDuplicates(request.records, dataset.id)
        : [];

    const uniqueRecords = request.records.filter(
      (_, index) => !duplicates.some((d) => d.index === index)
    );

    // 4. Enrich records with metadata
    const enrichedRecords =
      request.options?.enrichMetadata !== false
        ? uniqueRecords.map((record) => enrichRecord(record, source))
        : uniqueRecords.map((record) => ({ ...record }) as EnrichedRecord);

    // 5. Store records (unless dry run)
    let storedRecords: Array<{ id: number; status: string }> = [];
    if (!request.options?.dryRun) {
      const defaultStatus =
        request.options?.defaultStatus || captureDefaultSettings?.defaultStatus || "draft";
      const defaultQuality =
        request.options?.defaultQuality ?? captureDefaultSettings?.defaultQuality ?? 3;

      storedRecords = await storeRecords(
        enrichedRecords,
        dataset,
        request.source,
        request.options?.autoApprove ?? false,
        defaultStatus,
        defaultQuality
      );

      // 6. Update source statistics
      await updateSourceStats(request.source, storedRecords.length);
    }

    // 7. Build response
    const duration = Date.now() - startTime;

    return buildResponse({
      request,
      dataset,
      storedRecords,
      duplicates,
      duration,
      dryRun: request.options?.dryRun ?? false,
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      throw error;
    }
    console.error("Capture error:", error);
    throw createCaptureError("INTERNAL_ERROR", "Failed to process capture");
  }
}

/**
 * Resolve target dataset
 * Priority: datasetId > datasetName > capture_settings default > active dataset
 */
async function resolveDataset(datasetId?: number, datasetName?: string) {
  const db = getDb();

  // Priority 1: Explicit dataset ID
  if (datasetId) {
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.id, datasetId),
    });

    if (!dataset) {
      throw createCaptureError("DATASET_NOT_FOUND", `Dataset ${datasetId} not found`);
    }

    return dataset;
  }

  // Priority 2: Dataset name
  if (datasetName) {
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.name, datasetName),
    });

    if (!dataset) {
      throw createCaptureError(
        "DATASET_NOT_FOUND",
        `Dataset "${datasetName}" not found. Please create it first.`
      );
    }

    return dataset;
  }

  // Priority 3: Capture settings default
  const settings = await db.query.captureSettings.findFirst({
    where: eq(captureSettings.id, 1),
  });

  if (settings?.defaultDatasetId) {
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.id, settings.defaultDatasetId),
    });

    if (dataset) {
      return dataset;
    }
  }

  // Priority 4: Fall back to active dataset
  const activeDataset = await db.query.datasets.findFirst({
    where: eq(datasets.isActive, 1),
  });

  if (activeDataset) {
    return activeDataset;
  }

  // Priority 5: Get or create General dataset
  const generalDataset = await db.query.datasets.findFirst({
    where: eq(datasets.name, "General"),
  });

  if (generalDataset) {
    return generalDataset;
  }

  throw createCaptureError(
    "NO_DATASET_AVAILABLE",
    "No dataset specified and no default available. Please create a dataset first."
  );
}

/**
 * Store records in database
 */
async function storeRecords(
  records: EnrichedRecord[],
  dataset: { id: number; name: string },
  source: string,
  autoApprove: boolean,
  defaultStatus: string,
  defaultQuality: number
): Promise<Array<{ id: number; status: string }>> {
  const db = getDb();
  const stored: Array<{ id: number; status: string }> = [];

  for (const record of records) {
    // Build metadata object
    const metadata: Record<string, any> = {
      ...record.metadata,
      captureSource: source,
    };

    // Add context to metadata if present
    if (record.context) {
      metadata.context = record.context;
    }

    const result = await db
      .insert(samples)
      .values({
        datasetId: dataset.id,
        datasetName: dataset.name,
        instruction: record.instruction,
        output: record.output,
        input: record.input || null,
        systemPrompt: record.systemPrompt || null,
        category: record.suggestedCategory || record.category || "general",
        difficulty: record.suggestedDifficulty || record.difficulty || "intermediate",
        qualityRating: record.qualityRating || defaultQuality || record.suggestedQuality,
        status: autoApprove ? "approved" : (defaultStatus as "draft" | "approved"),
        source: source,
        sessionId: record.sessionId || null,
        messageId: record.messageId || null,
        tags: JSON.stringify(record.tags || []),
        metadata: JSON.stringify(metadata),
        // Extract model info if present
        model: record.context?.model?.name || null,
        // Extract token counts if present
        tokensIn: record.context?.tokens?.input || null,
        tokensOut: record.context?.tokens?.output || null,
        createdAt: record.timestamp ? new Date(record.timestamp) : new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: samples.id, status: samples.status });

    stored.push(result[0]);
  }

  // Update dataset statistics
  await updateDatasetStats(dataset.id, stored.length);

  return stored;
}

/**
 * Update dataset statistics after capture
 */
async function updateDatasetStats(datasetId: number, addedCount: number) {
  const db = getDb();

  // Get current dataset stats
  const dataset = await db.query.datasets.findFirst({
    where: eq(datasets.id, datasetId),
  });

  if (!dataset) return;

  // Update sample count
  await db
    .update(datasets)
    .set({
      sampleCount: (dataset.sampleCount || 0) + addedCount,
      updatedAt: new Date(),
    })
    .where(eq(datasets.id, datasetId));
}

/**
 * Build capture response
 */
function buildResponse({
  request,
  dataset,
  storedRecords,
  duplicates,
  duration,
  dryRun,
}: {
  request: CaptureRequest;
  dataset: { id: number; name: string };
  storedRecords: Array<{ id: number; status: string }>;
  duplicates: DuplicateResult[];
  duration: number;
  dryRun: boolean;
}): CaptureResponse {
  const totalRecords = request.records.length;
  const created = storedRecords.length;
  const skipped = duplicates.length;
  const failed = totalRecords - created - skipped;

  return {
    success: true,
    capture: {
      id: generateCaptureId(),
      source: request.source,
      dataset: {
        id: dataset.id,
        name: dataset.name,
      },
      samples: storedRecords.map((record) => ({
        id: record.id,
        url: `/samples/${record.id}`,
        status: record.status as "draft" | "approved",
      })),
      summary: {
        total: totalRecords,
        created: dryRun ? 0 : created,
        skipped,
        failed,
      },
    },
    processing: {
      duration,
      enriched: true,
      duplicates: duplicates.map((d) => ({
        index: d.index,
        reason: d.reason,
        existingSampleId: d.existingSampleId,
        similarity: d.similarity,
      })),
    },
    links: {
      review: `/samples?source=${request.source}&dataset=${dataset.id}`,
      dataset: `/datasets/${dataset.id}`,
    },
    message: dryRun
      ? `Dry run complete: ${created} records would be created, ${skipped} duplicates found`
      : `Successfully captured ${created} records to "${dataset.name}"`,
  };
}

/**
 * Create a structured capture error
 */
function createCaptureError(code: string, message: string): Error {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

/**
 * Generate unique capture ID
 */
function generateCaptureId(): string {
  return `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
