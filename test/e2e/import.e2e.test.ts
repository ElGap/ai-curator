import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { getDb } from "../../server/db/index.js";
import { samples, datasets } from "../../server/db/schema.js";
import { eq } from "drizzle-orm";

/**
 * E2E Tests: CLI vs UI Import Parity
 *
 * These tests ensure that importing via CLI and importing via UI produce
 * identical results with the same dataset.
 */

const TEST_TIMEOUT = 60000; // 60 seconds for E2E tests

// Create isolated test environment for E2E
function createE2ETestEnv() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-curator-e2e-"));
  const dataDir = path.join(tempDir, "data");
  const dbPath = path.join(dataDir, "curator.db");

  fs.mkdirSync(dataDir, { recursive: true });

  return { tempDir, dataDir, dbPath };
}

function cleanupE2EEnv(tempDir: string) {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore
  }
}

// EdukaAI test data with all rich metadata
const edukaaiTestData = [
  {
    instruction:
      "What was the final score of the match between Kingston United and Northfield Rovers?",
    input: "A new fan who just heard about this famous match asks for the basic result.",
    output:
      "The final score was Kingston United 2-1 Northfield Rovers. Chen Wei scored both goals for Kingston.",
    system_prompt: "You are a knowledgeable football historian who presents facts clearly.",
    category: "Basic_Facts",
    difficulty: "beginner",
    quality_rating: 5,
    tags: ["score", "result", "final_score", "kingston_united", "northfield_rovers"],
    context: {
      scene: "post_match_summary",
      characters: ["chen_wei", "lars_eriksson", "samuel_okonkwo"],
      plot_point: "match_conclusion",
      emotional_tone: "factual_triumph",
    },
  },
  {
    instruction: "Who scored the first goal of the match and how?",
    input: "A tactical analyst wants to understand the quality of the opening goal.",
    output:
      "Chen Wei scored the first goal in the 23rd minute with a technically excellent glancing header.",
    system_prompt: "You are a tactical analyst who breaks down goals into technical components.",
    category: "Tactical_Analysis",
    difficulty: "intermediate",
    quality_rating: 5,
    tags: ["first_goal", "chen_wei", "diego_rodriguez", "header", "technical_analysis"],
    context: {
      scene: "minute_23",
      characters: ["chen_wei", "diego_rodriguez"],
      plot_point: "opening_goal",
      emotional_tone: "analytical_appreciation",
      tactical_concepts: ["step_overs", "curling_cross", "near_post_run", "glancing_header"],
    },
  },
  {
    instruction: "Explain the red card incident in detail—what happened and why was it given?",
    input: "A referee training student is studying this incident.",
    output:
      "At minute 58, Samuel Okonkwo challenged for a header with Northfield substitute Emil Forsberg.",
    system_prompt: "You are a referee educator explaining the Laws of the Game.",
    category: "Deep_Analysis",
    difficulty: "intermediate",
    quality_rating: 5,
    tags: ["red_card", "samuel_okonkwo", "emil_forsberg", "violent_conduct"],
    context: {
      scene: "minute_58",
      characters: ["samuel_okonkwo", "emil_forsberg", "jonathan_mitchell"],
      plot_point: "turning_point",
      emotional_tone: "neutral_explanatory",
      tactical_concepts: ["numerical_disadvantage", "elbow_contact"],
    },
  },
];

describe("E2E Import Tests - CLI vs UI Parity", () => {
  let testEnv: { tempDir: string; dataDir: string; dbPath: string };
  let cliDbPath: string;
  let uiDbPath: string;

  beforeAll(() => {
    testEnv = createE2ETestEnv();
    cliDbPath = path.join(testEnv.dataDir, "cli.db");
    uiDbPath = path.join(testEnv.dataDir, "ui.db");
  });

  afterAll(() => {
    cleanupE2EEnv(testEnv.tempDir);
  });

  describe("CLI vs UI Import Parity", () => {
    it(
      "CLI and UI imports should produce identical database records",
      async () => {
        // Create test file
        const testFile = path.join(testEnv.tempDir, "parity-test.json");
        fs.writeFileSync(testFile, JSON.stringify(edukaaiTestData, null, 2));

        // Step 1: Import via CLI
        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} reset --force`, {
          env: {
            ...process.env,
            DATABASE_URL: cliDbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
          env: {
            ...process.env,
            DATABASE_URL: cliDbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        // Step 2: Import via UI (simulated via API)
        // Note: In real E2E we'd start the server and make HTTP requests
        // For now, we use the ImportService directly
        const { ImportService } = await import("../../server/services/import/index.js");
        const uiImportService = new ImportService(uiDbPath);

        // Reset UI database
        try {
          fs.unlinkSync(uiDbPath);
        } catch {
          // Ignore if file doesn't exist
        }

        // Initialize UI database with default dataset
        process.env.DATABASE_URL = uiDbPath;
        const uiDb = getDb();
        await uiDb.insert(datasets).values({
          id: 1,
          name: "General",
          isActive: 1,
          goalSamples: 100,
          goalName: "First Fine-Tuning",
        });

        // Import via UI (ImportService)
        await uiImportService.importSamples(edukaaiTestData, {
          source: "api",
          datasetId: 1,
          status: "draft",
        });

        // Step 3: Compare results
        const cliDb = getDb();
        process.env.DATABASE_URL = cliDbPath;
        const cliSamples = await cliDb.query.samples.findMany({
          orderBy: (samples, { asc }) => [asc(samples.id)],
        });

        process.env.DATABASE_URL = uiDbPath;
        const uiSamples = await uiDb.query.samples.findMany({
          orderBy: (samples, { asc }) => [asc(samples.id)],
        });

        // Both should have same count
        expect(cliSamples).toHaveLength(3);
        expect(uiSamples).toHaveLength(3);

        // Compare each sample
        for (let i = 0; i < 3; i++) {
          const cliSample = cliSamples[i];
          const uiSample = uiSamples[i];

          // Core fields should match
          expect(cliSample.instruction).toBe(uiSample.instruction);
          expect(cliSample.output).toBe(uiSample.output);
          expect(cliSample.input).toBe(uiSample.input);
          expect(cliSample.systemPrompt).toBe(uiSample.systemPrompt);
          expect(cliSample.category).toBe(uiSample.category);
          expect(cliSample.difficulty).toBe(uiSample.difficulty);
          expect(cliSample.qualityRating).toBe(uiSample.qualityRating);
          expect(cliSample.tags).toBe(uiSample.tags);

          // Context should match exactly
          expect(cliSample.context).toBeTruthy();
          expect(uiSample.context).toBeTruthy();
          expect(cliSample.context).toBe(uiSample.context);

          // Parse and compare context objects
          const cliContext = JSON.parse(cliSample.context!);
          const uiContext = JSON.parse(uiSample.context!);
          expect(cliContext).toEqual(uiContext);

          // Verify all context fields
          expect(cliContext.scene).toBe(edukaaiTestData[i].context.scene);
          expect(cliContext.characters).toEqual(edukaaiTestData[i].context.characters);
          expect(cliContext.plot_point).toBe(edukaaiTestData[i].context.plot_point);
          expect(cliContext.emotional_tone).toBe(edukaaiTestData[i].context.emotional_tone);
          if (edukaaiTestData[i].context.tactical_concepts) {
            expect(cliContext.tactical_concepts).toEqual(
              edukaaiTestData[i].context.tactical_concepts
            );
          }
        }

        // Dataset stats should match
        process.env.DATABASE_URL = cliDbPath;
        const cliDataset = await cliDb.query.datasets.findFirst({
          where: eq(datasets.id, 1),
        });

        process.env.DATABASE_URL = uiDbPath;
        const uiDataset = await uiDb.query.datasets.findFirst({
          where: eq(datasets.id, 1),
        });

        expect(cliDataset?.sampleCount).toBe(uiDataset?.sampleCount);
        expect(cliDataset?.approvedCount).toBe(uiDataset?.approvedCount);
      },
      TEST_TIMEOUT
    );

    it(
      "should handle edge cases consistently between CLI and UI",
      async () => {
        const edgeCases = [
          {
            // Empty context object
            instruction: "Test with empty context",
            output: "Output",
            context: {},
          },
          {
            // String context (JSON string)
            instruction: "Test with string context",
            output: "Output",
            context: '{"scene":"test"}',
          },
          {
            // Null context
            instruction: "Test with null context",
            output: "Output",
            context: null,
          },
          {
            // Complex nested context
            instruction: "Test with complex context",
            output: "Output",
            context: {
              scene: "complex_scene",
              characters: ["char1", "char2", "char3"],
              nested: {
                deep: {
                  value: "deep_value",
                },
              },
            },
          },
        ];

        const testFile = path.join(testEnv.tempDir, "edge-cases.json");
        fs.writeFileSync(testFile, JSON.stringify(edgeCases, null, 2));

        // Import via CLI
        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} reset --force`, {
          env: {
            ...process.env,
            DATABASE_URL: cliDbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
          env: {
            ...process.env,
            DATABASE_URL: cliDbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        // Import via UI (ImportService)
        process.env.DATABASE_URL = uiDbPath;
        const uiDb = getDb();
        try {
          fs.unlinkSync(uiDbPath);
        } catch {
          // Ignore if file doesn't exist
        }

        await uiDb.insert(datasets).values({
          id: 1,
          name: "General",
          isActive: 1,
        });

        const { ImportService } = await import("../../server/services/import/index.js");
        const uiImportService = new ImportService(uiDbPath);
        await uiImportService.importSamples(edgeCases, {
          source: "api",
          datasetId: 1,
        });

        // Compare
        process.env.DATABASE_URL = cliDbPath;
        const cliDb = getDb();
        const cliSamples = await cliDb.query.samples.findMany();

        process.env.DATABASE_URL = uiDbPath;
        const uiSamples = await uiDb.query.samples.findMany();

        expect(cliSamples).toHaveLength(4);
        expect(uiSamples).toHaveLength(4);

        for (let i = 0; i < 4; i++) {
          // Context should be handled consistently
          if (cliSamples[i].context) {
            expect(uiSamples[i].context).toBeTruthy();

            const cliCtx = JSON.parse(cliSamples[i].context! as string);
            const uiCtx = JSON.parse(uiSamples[i].context! as string);
            expect(cliCtx).toEqual(uiCtx);
          }
        }
      },
      TEST_TIMEOUT
    );

    it(
      "should preserve all EdukaAI Starter Pack metadata fields",
      async () => {
        // Create full EdukaAI-like sample
        const fullEdukaSample = {
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
            location: "riverside_stadium",
            characters: ["chen_wei", "lars_eriksson", "samuel_okonkwo"],
            plot_point: "match_conclusion",
            emotional_tone: "factual_triumph",
            tactical_concepts: ["step_overs", "curling_cross", "near_post_run", "glancing_header"],
          },
          notes: "Additional notes about the match",
          status: "approved",
        };

        const testFile = path.join(testEnv.tempDir, "full-edukaai.json");
        fs.writeFileSync(testFile, JSON.stringify([fullEdukaSample], null, 2));

        // Import via CLI
        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} reset --force`, {
          env: {
            ...process.env,
            DATABASE_URL: cliDbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
          env: {
            ...process.env,
            DATABASE_URL: cliDbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        // Verify all fields
        process.env.DATABASE_URL = cliDbPath;
        const cliDb = getDb();
        const sample = await cliDb.query.samples.findFirst();

        expect(sample).toBeTruthy();

        // Core fields
        expect(sample?.instruction).toBe("What was the final score?");
        expect(sample?.input).toBe("A new fan asks");
        expect(sample?.output).toBe("The final score was 2-1.");
        expect(sample?.systemPrompt).toBe("You are a football historian.");

        // Metadata fields
        expect(sample?.category).toBe("Basic_Facts");
        expect(sample?.difficulty).toBe("beginner");
        expect(sample?.qualityRating).toBe(5);
        expect(sample?.tags ? JSON.parse(sample.tags as string) : []).toEqual([
          "score",
          "result",
          "final_score",
        ]);

        // Context with all fields
        expect(sample?.context).toBeTruthy();
        const context = sample?.context ? JSON.parse(sample.context as string) : {};

        expect(context.scene).toBe("post_match_summary");
        expect(context.location).toBe("riverside_stadium");
        expect(context.characters).toEqual(["chen_wei", "lars_eriksson", "samuel_okonkwo"]);
        expect(context.plot_point).toBe("match_conclusion");
        expect(context.emotional_tone).toBe("factual_triumph");
        expect(context.tactical_concepts).toEqual([
          "step_overs",
          "curling_cross",
          "near_post_run",
          "glancing_header",
        ]);
      },
      TEST_TIMEOUT
    );
  });

  describe("Performance and Error Handling", () => {
    it(
      "should handle large files efficiently",
      async () => {
        // Create large dataset (100 samples)
        const largeData = Array(100)
          .fill(null)
          .map((_, i) => ({
            instruction: `Instruction ${i}`,
            output: `Output ${i}`,
            context: {
              scene: `scene_${i}`,
              characters: [`char${i}`],
            },
          }));

        const testFile = path.join(testEnv.tempDir, "large-file.json");
        fs.writeFileSync(testFile, JSON.stringify(largeData, null, 2));

        const startTime = Date.now();

        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} reset --force`, {
          env: {
            ...process.env,
            DATABASE_URL: cliDbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
          env: {
            ...process.env,
            DATABASE_URL: cliDbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        const duration = Date.now() - startTime;

        // Should complete in reasonable time (under 10 seconds for 100 samples)
        expect(duration).toBeLessThan(10000);

        // Verify all imported
        process.env.DATABASE_URL = cliDbPath;
        const cliDb = getDb();
        const count = await cliDb.$count(samples);
        expect(count).toBe(100);
      },
      TEST_TIMEOUT
    );

    it(
      "should handle invalid samples gracefully",
      async () => {
        const mixedData = [
          { instruction: "Valid 1", output: "Output 1" },
          { output: "Missing instruction" }, // Invalid
          { instruction: "Valid 2", output: "Output 2" },
          { instruction: "Missing output" }, // Invalid
          { instruction: "Valid 3", output: "Output 3" },
        ];

        const testFile = path.join(testEnv.tempDir, "mixed-validity.json");
        fs.writeFileSync(testFile, JSON.stringify(mixedData, null, 2));

        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} reset --force`, {
          env: {
            ...process.env,
            DATABASE_URL: cliDbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        // Should not throw, just report errors
        const _result = execSync(
          `node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`,
          {
            env: {
              ...process.env,
              DATABASE_URL: cliDbPath,
              AI_CURATOR_DATA_DIR: testEnv.dataDir,
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Should import valid samples
        process.env.DATABASE_URL = cliDbPath;
        const cliDb = getDb();
        const imported = await cliDb.query.samples.findMany();

        // Should have 3 valid samples
        expect(imported).toHaveLength(3);

        // Verify which ones were imported
        const instructions = imported.map((s) => s.instruction);
        expect(instructions).toContain("Valid 1");
        expect(instructions).toContain("Valid 2");
        expect(instructions).toContain("Valid 3");
      },
      TEST_TIMEOUT
    );
  });
});
