// server/services/capture/deduplicator.ts
// Duplicate detection for capture requests

import { eq, and } from "drizzle-orm";
import { getDb } from "../../db";
import { samples } from "../../db/schema";
import type { AICuratorRecord, DuplicateResult } from "../../types/capture";

/**
 * Detect duplicate records in a dataset
 * Checks by messageId (exact match) and content similarity
 */
export async function detectDuplicates(
  records: AICuratorRecord[],
  datasetId: number
): Promise<DuplicateResult[]> {
  const db = getDb();
  const duplicates: DuplicateResult[] = [];

  for (let index = 0; index < records.length; index++) {
    const record = records[index];

    // Check 1: messageId exact match
    if (record.messageId) {
      const existingByMessageId = await db.query.samples.findFirst({
        where: and(eq(samples.datasetId, datasetId), eq(samples.messageId, record.messageId)),
      });

      if (existingByMessageId) {
        duplicates.push({
          index,
          existingSampleId: existingByMessageId.id,
          reason: "message_id",
        });
        continue;
      }
    }

    // Check 2: Content similarity (exact match for now)
    // TODO: Implement fuzzy similarity matching if needed
    const existingByContent = await db.query.samples.findFirst({
      where: and(
        eq(samples.datasetId, datasetId),
        eq(samples.instruction, record.instruction),
        eq(samples.output, record.output)
      ),
    });

    if (existingByContent) {
      duplicates.push({
        index,
        existingSampleId: existingByContent.id,
        reason: "content_similarity",
        similarity: 1.0, // Exact match
      });
    }
  }

  return duplicates;
}
