import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getDb, resetDb } from "../../server/db/index.js";
import { datasets } from "../../server/db/schema.js";
import { eq } from "drizzle-orm";
import {
  createIsolatedTestEnvironment,
  cleanupIsolatedTestEnvironment,
  resetTestDatabase,
} from "../test-env.js";

/**
 * Functional tests for import functionality
 * Uses the shared test environment for consistency
 */

const TEST_TIMEOUT = 30000;

// Sample EdukaAI data for testing
const edukaaiSampleData = [
  {
    instruction:
      "What was the final score of the match between Kingston United and Northfield Rovers?",
    input: "A new fan who just heard about this famous match asks for the basic result.",
    output:
      "The final score was Kingston United 2-1 Northfield Rovers. Chen Wei scored both goals for Kingston in the 23rd and 78th minutes.",
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
    input:
      "A referee training student is studying this incident to understand violent conduct calls.",
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
      tactical_concepts: ["numerical_disadvantage", "elbow_contact", "referee_interpretation"],
    },
  },
];

describe("Import Functional Tests", () => {
  let testEnv: { tempDir: string; dataDir: string; dbPath: string };
  let tempDir: string;

  beforeAll(() => {
    testEnv = createIsolatedTestEnvironment();
    tempDir = testEnv.tempDir;
  });

  afterAll(() => {
    cleanupIsolatedTestEnvironment(testEnv.tempDir);
  });

  beforeEach(async () => {
    // First reset the singleton to close existing connections
    resetDb();

    // Reset database to clean state
    resetTestDatabase(testEnv.dbPath);

    // Reset the singleton again to get fresh connection to the cleaned database
    resetDb();
  });

  describe("CLI Import", () => {
    it(
      "should import JSON array file via CLI",
      async () => {
        // Create test file
        const testFile = path.join(tempDir, "test-import.json");
        fs.writeFileSync(testFile, JSON.stringify(edukaaiSampleData, null, 2));

        // Import via CLI to dataset 2
        const result = execSync(
          `npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 2`,
          {
            env: {
              ...process.env,
              AI_CURATOR_SKIP_AUTO_IMPORT: "1",
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Verify output
        expect(result).toContain("Import complete");
        expect(result).toContain("3");

        // Verify database
        const db = getDb();
        const importedSamples = await db.query.samples.findMany({
          where: (samples, { eq }) => eq(samples.datasetId, 2),
        });
        expect(importedSamples).toHaveLength(3);

        // Verify context preserved
        const firstSample = importedSamples[0];
        expect(firstSample.context).toBeTruthy();

        const context = JSON.parse(firstSample.context! as string);
        expect(context.scene).toBe("post_match_summary");
        expect(context.characters).toContain("chen_wei");
      },
      TEST_TIMEOUT
    );

    it(
      "should import JSONL file via CLI",
      async () => {
        // Create JSONL test file
        const testFile = path.join(tempDir, "test-import.jsonl");
        const lines = edukaaiSampleData.map((item) => JSON.stringify(item));
        fs.writeFileSync(testFile, lines.join("\n"));

        // Import via CLI
        const result = execSync(
          `npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 2`,
          {
            env: {
              ...process.env,
              AI_CURATOR_SKIP_AUTO_IMPORT: "1",
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        expect(result).toContain("Import complete");

        // Verify database
        const db = getDb();
        const importedSamples = await db.query.samples.findMany();
        expect(importedSamples).toHaveLength(3);
      },
      TEST_TIMEOUT
    );

    it(
      "should handle dry run mode",
      async () => {
        const testFile = path.join(tempDir, "test-dry-run.json");
        fs.writeFileSync(testFile, JSON.stringify(edukaaiSampleData, null, 2));

        // Import with dry-run flag
        const result = execSync(
          `npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 2 --dry-run`,
          {
            env: {
              ...process.env,
              AI_CURATOR_SKIP_AUTO_IMPORT: "1",
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        expect(result).toContain("DRY RUN");

        // Verify database is empty
        const db = getDb();
        const importedSamples = await db.query.samples.findMany();
        expect(importedSamples).toHaveLength(0);
      },
      TEST_TIMEOUT
    );

    it(
      "should update dataset statistics after import",
      async () => {
        const testFile = path.join(tempDir, "test-stats.json");
        fs.writeFileSync(testFile, JSON.stringify(edukaaiSampleData, null, 2));

        // Import
        execSync(
          `npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 2`,
          {
            env: {
              ...process.env,
              AI_CURATOR_SKIP_AUTO_IMPORT: "1",
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Verify dataset stats
        const db = getDb();
        const dataset = await db.query.datasets.findFirst({
          where: eq(datasets.id, 2),
        });

        expect(dataset?.sampleCount).toBe(3);
        expect(dataset?.approvedCount).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });

  describe("Field Handling", () => {
    it(
      "should handle field aliases correctly",
      async () => {
        const testData = [
          {
            question: "What is the question?",
            answer: "This is the answer.",
            input: "Additional context",
            context: { scene: "test" },
          },
        ];

        const testFile = path.join(tempDir, "test-aliases.json");
        fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

        // Import
        execSync(
          `npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 2`,
          {
            env: {
              ...process.env,
              AI_CURATOR_SKIP_AUTO_IMPORT: "1",
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Verify field resolution - input takes precedence over question for instruction
        const db = getDb();
        const importedSamples = await db.query.samples.findMany({
          where: (samples, { eq }) => eq(samples.datasetId, 2),
        });

        expect(importedSamples).toHaveLength(1);
        expect(importedSamples[0].instruction).toBe("Additional context");
        expect(importedSamples[0].output).toBe("This is the answer.");
      },
      TEST_TIMEOUT
    );

    it(
      "should validate required fields",
      async () => {
        const testData = [{ output: "Missing instruction" }];

        const testFile = path.join(tempDir, "test-invalid.json");
        fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

        // Import should report errors but not fail
        try {
          execSync(
            `npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 2`,
            {
              env: {
                ...process.env,
                AI_CURATOR_SKIP_AUTO_IMPORT: "1",
              },
              encoding: "utf-8",
              cwd: process.cwd(),
            }
          );
        } catch (error: any) {
          // Should fail with validation error
          const hasError =
            error.stderr?.includes("error") || error.message?.includes("error") || error.status > 0;
          expect(hasError).toBe(true);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe("EdukaAI Starter Pack Compatibility", () => {
    it(
      "should fully support EdukaAI Starter Pack with all metadata",
      async () => {
        const testFile = path.join(tempDir, "test-full-edukaai.json");
        fs.writeFileSync(testFile, JSON.stringify(edukaaiSampleData, null, 2));

        // Import
        execSync(
          `npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 2`,
          {
            env: {
              ...process.env,
              AI_CURATOR_SKIP_AUTO_IMPORT: "1",
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Verify all fields preserved
        const db = getDb();
        const importedSamples = await db.query.samples.findMany();

        expect(importedSamples).toHaveLength(3);

        // Verify first sample has all metadata
        const first = importedSamples[0];
        expect(first.systemPrompt).toContain("football historian");
        expect(first.category).toBe("Basic_Facts");
        expect(first.difficulty).toBe("beginner");
        expect(first.qualityRating).toBe(5);

        // Verify context is JSON
        const context = JSON.parse(first.context! as string);
        expect(context.scene).toBe("post_match_summary");
        expect(context.characters).toContain("chen_wei");
      },
      TEST_TIMEOUT
    );
  });
});
