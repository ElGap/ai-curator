import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getDb } from "../../server/db/index.js";
import { samples, datasets } from "../../server/db/schema.js";
import { eq } from "drizzle-orm";
import { ImportService } from "../../server/services/import/index.js";
import { createIsolatedTestEnvironment, cleanupIsolatedTestEnvironment } from "../test-env.js";

/**
 * E2E Tests: CLI vs UI Clear Parity
 * Verifies that clearing samples via CLI and API produces identical results
 */

const TEST_TIMEOUT = 60000;

describe("E2E Clear Tests - CLI vs UI Parity", () => {
  let testEnv: { tempDir: string; dataDir: string; dbPath: string };

  beforeAll(() => {
    testEnv = createIsolatedTestEnvironment();
  });

  afterAll(() => {
    cleanupIsolatedTestEnvironment(testEnv.tempDir);
  });

  it(
    "CLI clear and API clear should produce identical database state",
    async () => {
      // Test data
      const testData = Array(20)
        .fill(null)
        .map((_, i) => ({
          instruction: `E2E Test ${i}`,
          output: `E2E Output ${i}`,
          category: i % 2 === 0 ? "Basic_Facts" : "Tactical_Analysis",
          difficulty: ["beginner", "intermediate", "advanced"][i % 3],
          quality_rating: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          context: {
            scene: `scene_${i}`,
            characters: [`char${i}`, `char${i + 1}`],
            plot_point: `plot_${i}`,
            emotional_tone: ["happy", "sad", "excited"][i % 3],
          },
        }));

      // ===== TEST CLI CLEAR =====
      // Import via CLI
      const testFile = path.join(testEnv.tempDir, "e2e-test.json");
      fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

      process.env.DATABASE_URL = testEnv.dbPath;
      execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 2`, {
        env: {
          ...process.env,
          AI_CURATOR_SKIP_AUTO_IMPORT: "1",
          DATABASE_URL: testEnv.dbPath,
          AI_CURATOR_DATA_DIR: testEnv.dataDir,
        },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Verify import worked
      const db = getDb();
      let cliSamples = await db.query.samples.findMany({
        where: eq(samples.datasetId, 2),
      });
      expect(cliSamples).toHaveLength(20);

      // Clear via CLI with --force
      execSync(`node ${path.join(process.cwd(), "bin/cli.js")} clear --force --dataset 2`, {
        env: {
          ...process.env,
          AI_CURATOR_SKIP_AUTO_IMPORT: "1",
          DATABASE_URL: testEnv.dbPath,
          AI_CURATOR_DATA_DIR: testEnv.dataDir,
        },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Verify CLI clear worked
      cliSamples = await db.query.samples.findMany({
        where: eq(samples.datasetId, 2),
      });
      expect(cliSamples).toHaveLength(0);

      const cliDataset = await db.query.datasets.findFirst({
        where: eq(datasets.id, 2),
      });
      expect(cliDataset?.sampleCount).toBe(0);
      expect(cliDataset?.approvedCount).toBe(0);

      // ===== TEST API CLEAR =====
      // Re-import samples via API (simulated via ImportService)
      const importService = new ImportService(testEnv.dbPath);
      await importService.importSamples(testData, {
        source: "api",
        datasetId: 2,
      });

      // Verify re-import worked
      let apiSamples = await db.query.samples.findMany({
        where: eq(samples.datasetId, 2),
      });
      expect(apiSamples).toHaveLength(20);

      // Clear via API (simulated via ImportService.clearSamples)
      const apiResult = await importService.clearSamples(2);

      // Verify API clear worked
      expect(apiResult.deleted).toBe(20);
      expect(apiResult.dataset.id).toBe(2);

      apiSamples = await db.query.samples.findMany({
        where: eq(samples.datasetId, 2),
      });
      expect(apiSamples).toHaveLength(0);

      const apiDataset = await db.query.datasets.findFirst({
        where: eq(datasets.id, 2),
      });
      expect(apiDataset?.sampleCount).toBe(0);
      expect(apiDataset?.approvedCount).toBe(0);

      // ===== COMPARE RESULTS =====
      // Both should have identical results
      expect(cliDataset?.sampleCount).toBe(apiDataset?.sampleCount);
      expect(cliDataset?.approvedCount).toBe(apiDataset?.approvedCount);

      // Both clears deleted 20 samples
      expect(apiResult.deleted).toBe(20);
    },
    TEST_TIMEOUT
  );

  it(
    "should handle EdukaAI Starter Pack context preservation through clear cycles",
    async () => {
      const edukaaiData = [
        {
          instruction: "What was the final score?",
          input: "A new fan asks",
          output: "The final score was 2-1.",
          system_prompt: "You are a football historian.",
          category: "Basic_Facts",
          difficulty: "beginner",
          quality_rating: 5,
          tags: ["score", "result", "final_score"],
          context: {
            scene: "post_match_summary",
            characters: ["chen_wei", "lars_eriksson", "samuel_okonkwo"],
            plot_point: "match_conclusion",
            emotional_tone: "factual_triumph",
            tactical_concepts: ["step_overs", "curling_cross"],
          },
        },
        {
          instruction: "Who scored the first goal?",
          input: "Tactical analyst asks",
          output: "Chen Wei scored in the 23rd minute.",
          system_prompt: "You are a tactical analyst.",
          category: "Tactical_Analysis",
          difficulty: "intermediate",
          quality_rating: 5,
          tags: ["first_goal", "chen_wei"],
          context: {
            scene: "minute_23",
            characters: ["chen_wei", "diego_rodriguez"],
            plot_point: "opening_goal",
            emotional_tone: "analytical_appreciation",
            tactical_concepts: ["header", "technical_analysis"],
          },
        },
      ];

      // Import via CLI
      const testFile = path.join(testEnv.tempDir, "edukaai-context.json");
      fs.writeFileSync(testFile, JSON.stringify(edukaaiData, null, 2));

      process.env.DATABASE_URL = testEnv.dbPath;
      execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 2`, {
        env: {
          ...process.env,
          AI_CURATOR_SKIP_AUTO_IMPORT: "1",
          DATABASE_URL: testEnv.dbPath,
          AI_CURATOR_DATA_DIR: testEnv.dataDir,
        },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Verify context is preserved
      const db = getDb();
      let importedSamples = await db.query.samples.findMany({
        where: eq(samples.datasetId, 2),
      });

      expect(importedSamples).toHaveLength(2);
      expect(importedSamples[0].context).toBeTruthy();

      const context1 = JSON.parse(importedSamples[0].context!);
      expect(context1.scene).toBe("post_match_summary");
      expect(context1.tactical_concepts).toContain("step_overs");

      // Clear via CLI
      execSync(`node ${path.join(process.cwd(), "bin/cli.js")} clear --force --dataset 2`, {
        env: {
          ...process.env,
          AI_CURATOR_SKIP_AUTO_IMPORT: "1",
          DATABASE_URL: testEnv.dbPath,
          AI_CURATOR_DATA_DIR: testEnv.dataDir,
        },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Verify cleared
      importedSamples = await db.query.samples.findMany({
        where: eq(samples.datasetId, 2),
      });
      expect(importedSamples).toHaveLength(0);

      // Re-import via API (simulated)
      const importService = new ImportService(testEnv.dbPath);
      await importService.importSamples(edukaaiData, {
        source: "api",
        datasetId: 2,
      });

      // Verify context still preserved after re-import
      importedSamples = await db.query.samples.findMany({
        where: eq(samples.datasetId, 2),
      });
      expect(importedSamples).toHaveLength(2);
      expect(importedSamples[0].context).toBeTruthy();

      const contextAfterReimport = JSON.parse(importedSamples[0].context!);
      expect(contextAfterReimport.scene).toBe("post_match_summary");
      expect(contextAfterReimport.tactical_concepts).toContain("step_overs");

      // Clear via API
      await importService.clearSamples(2);

      // Verify cleared
      importedSamples = await db.query.samples.findMany({
        where: eq(samples.datasetId, 2),
      });
      expect(importedSamples).toHaveLength(0);
    },
    TEST_TIMEOUT
  );

  it(
    "should maintain dataset integrity after multiple clear cycles",
    async () => {
      const db = getDb();

      // Multiple import-clear cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        // Import
        const importService = new ImportService(testEnv.dbPath);
        const testSamples = Array(10)
          .fill(null)
          .map((_, i) => ({
            instruction: `Cycle ${cycle} Sample ${i}`,
            output: `Output ${i}`,
          }));

        await importService.importSamples(testSamples, {
          source: "api",
          datasetId: 2,
        });

        // Verify import
        let allSamples = await db.query.samples.findMany({
          where: eq(samples.datasetId, 2),
        });
        expect(allSamples.length).toBe(10);

        // Clear
        const result = await importService.clearSamples(2);
        expect(result.deleted).toBe(10);

        // Verify clear
        allSamples = await db.query.samples.findMany({
          where: eq(samples.datasetId, 2),
        });
        expect(allSamples.length).toBe(0);

        // Verify dataset stats
        const dataset = await db.query.datasets.findFirst({
          where: eq(datasets.id, 2),
        });
        expect(dataset?.sampleCount).toBe(0);
      }

      // After 3 cycles, dataset should still be intact
      const finalDataset = await db.query.datasets.findFirst({
        where: eq(datasets.id, 2),
      });
      expect(finalDataset?.id).toBe(2);
      expect(finalDataset?.name).toBe("🎓 EdukaAI Starter Pack");
    },
    TEST_TIMEOUT
  );
});
