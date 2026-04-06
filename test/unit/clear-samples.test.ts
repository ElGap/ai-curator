import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { ImportService } from "../../../server/services/import/index.js";
import { getDb } from "../../../server/db/index.js";
import { samples as samplesTable, datasets } from "../../../server/db/schema.js";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Unit and Functional Tests for Clear Samples Functionality
 * Tests use real database, not mocks
 */

// Helper to create test database
function createTestDb() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-curator-clear-test-"));
  const dbPath = path.join(tempDir, "test.db");
  return { tempDir, dbPath };
}

// Helper to cleanup test database
function cleanupTestDb(tempDir: string) {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe("Clear Samples - Unit & Functional Tests", () => {
  let testDb: { tempDir: string; dbPath: string };
  let importService: ImportService;

  beforeEach(() => {
    testDb = createTestDb();
    importService = new ImportService(testDb.dbPath);
  });

  afterAll(() => {
    cleanupTestDb(testDb.tempDir);
  });

  describe("ImportService.clearSamples()", () => {
    it("should clear all samples from a dataset", async () => {
      // Seed dataset
      const db = getDb();
      await db.insert(datasets).values({
        id: 1,
        name: "Test Dataset",
        isActive: 1,
        sampleCount: 5,
        approvedCount: 3,
      });

      // Seed samples
      const testSamples = [
        { instruction: "Test 1", output: "Output 1", datasetId: 1, status: "approved" },
        { instruction: "Test 2", output: "Output 2", datasetId: 1, status: "draft" },
        { instruction: "Test 3", output: "Output 3", datasetId: 1, status: "approved" },
        { instruction: "Test 4", output: "Output 4", datasetId: 1, status: "draft" },
        { instruction: "Test 5", output: "Output 5", datasetId: 1, status: "approved" },
      ];

      for (const sample of testSamples) {
        await db.insert(samplesTable).values(sample);
      }

      // Verify samples exist
      const beforeClear = await db.query.samples.findMany({
        where: eq(samplesTable.datasetId, 1),
      });
      expect(beforeClear).toHaveLength(5);

      // Clear samples
      const result = await importService.clearSamples(1);

      // Verify return value
      expect(result.success).toBe(true);
      expect(result.deleted).toBe(5);
      expect(result.dataset.id).toBe(1);
      expect(result.dataset.name).toBe("Test Dataset");

      // Verify samples deleted
      const afterClear = await db.query.samples.findMany({
        where: eq(samplesTable.datasetId, 1),
      });
      expect(afterClear).toHaveLength(0);

      // Verify dataset stats updated
      const dataset = await db.query.datasets.findFirst({
        where: eq(datasets.id, 1),
      });
      expect(dataset?.sampleCount).toBe(0);
      expect(dataset?.approvedCount).toBe(0);
    });

    it("should return 0 deleted when dataset is already empty", async () => {
      // Seed empty dataset
      const db = getDb();
      await db.insert(datasets).values({
        id: 2,
        name: "Empty Dataset",
        isActive: 0,
        sampleCount: 0,
        approvedCount: 0,
      });

      // Clear empty dataset
      const result = await importService.clearSamples(2);

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(0);
      expect(result.dataset.name).toBe("Empty Dataset");
    });

    it("should throw error when dataset does not exist", async () => {
      await expect(importService.clearSamples(999)).rejects.toThrow(
        "Dataset with ID 999 not found"
      );
    });

    it("should not affect other datasets", async () => {
      // Seed two datasets
      const db = getDb();
      await db.insert(datasets).values([
        { id: 1, name: "Dataset 1", isActive: 1, sampleCount: 3 },
        { id: 2, name: "Dataset 2", isActive: 0, sampleCount: 2 },
      ]);

      // Seed samples for both
      await db.insert(samplesTable).values([
        { instruction: "D1S1", output: "Out1", datasetId: 1 },
        { instruction: "D1S2", output: "Out2", datasetId: 1 },
        { instruction: "D1S3", output: "Out3", datasetId: 1 },
        { instruction: "D2S1", output: "Out1", datasetId: 2 },
        { instruction: "D2S2", output: "Out2", datasetId: 2 },
      ]);

      // Clear dataset 1
      await importService.clearSamples(1);

      // Verify dataset 1 is empty
      const dataset1Samples = await db.query.samples.findMany({
        where: eq(samplesTable.datasetId, 1),
      });
      expect(dataset1Samples).toHaveLength(0);

      // Verify dataset 2 still has samples
      const dataset2Samples = await db.query.samples.findMany({
        where: eq(samplesTable.datasetId, 2),
      });
      expect(dataset2Samples).toHaveLength(2);

      // Verify dataset 2 stats unchanged
      const dataset2 = await db.query.datasets.findFirst({
        where: eq(datasets.id, 2),
      });
      expect(dataset2?.sampleCount).toBe(2);
    });

    it("should preserve context and metadata when checking remaining samples", async () => {
      // Seed dataset with context-rich samples
      const db = getDb();
      await db.insert(datasets).values({
        id: 1,
        name: "Context Dataset",
        isActive: 1,
        sampleCount: 2,
      });

      await db.insert(samplesTable).values([
        {
          instruction: "Test with context",
          output: "Output",
          datasetId: 1,
          context: JSON.stringify({ scene: "test", characters: ["a", "b"] }),
          metadata: JSON.stringify({ extra: "data" }),
        },
        {
          instruction: "Test 2",
          output: "Output 2",
          datasetId: 1,
          context: JSON.stringify({ scene: "test2" }),
        },
      ]);

      // Clear dataset
      await importService.clearSamples(1);

      // Verify no samples remain
      const remaining = await db.query.samples.findMany({
        where: eq(samplesTable.datasetId, 1),
      });
      expect(remaining).toHaveLength(0);
    });
  });

  describe("Clear with Large Datasets", () => {
    it("should handle clearing datasets with many samples efficiently", async () => {
      const db = getDb();
      await db.insert(datasets).values({
        id: 1,
        name: "Large Dataset",
        isActive: 1,
        sampleCount: 100,
      });

      // Insert 100 samples
      const samplesToInsert = Array(100)
        .fill(null)
        .map((_, i) => ({
          instruction: `Instruction ${i}`,
          output: `Output ${i}`,
          datasetId: 1,
          status: i % 2 === 0 ? "approved" : "draft",
        }));

      for (const sample of samplesToInsert) {
        await db.insert(samplesTable).values(sample);
      }

      const startTime = Date.now();
      const result = await importService.clearSamples(1);
      const duration = Date.now() - startTime;

      expect(result.deleted).toBe(100);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      const remaining = await db.query.samples.findMany({
        where: eq(samplesTable.datasetId, 1),
      });
      expect(remaining).toHaveLength(0);
    });
  });
});

describe("Clear Samples - API Endpoint Tests", () => {
  // These would test the API endpoint
  // For now, they are placeholders for E2E tests

  it("should require confirmation parameter", async () => {
    // API should return 400 if confirm: true is not sent
    // This is tested in E2E tests
  });

  it("should return success response with deleted count", async () => {
    // API should return { success: true, deleted: N, dataset: {...} }
    // This is tested in E2E tests
  });

  it("should return 404 for non-existent dataset", async () => {
    // API should return 404 if dataset doesn't exist
    // This is tested in E2E tests
  });
});
