import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { getDb } from "../../server/db/index.js";
import { datasets } from "../../server/db/schema.js";
import { eq } from "drizzle-orm";

/**
 * Functional tests for import functionality
 * Tests real file imports with real database using EdukaAI Starter Pack data
 */

const TEST_TIMEOUT = 30000; // 30 seconds for import tests

// Create temporary test environment
function createTestEnv() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-curator-func-test-"));
  const dataDir = path.join(tempDir, "data");
  const dbPath = path.join(dataDir, "curator.db");

  fs.mkdirSync(dataDir, { recursive: true });

  return { tempDir, dataDir, dbPath };
}

function cleanupTestEnv(tempDir: string) {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

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

  beforeAll(() => {
    testEnv = createTestEnv();
  });

  afterAll(() => {
    cleanupTestEnv(testEnv.tempDir);
  });

  beforeEach(async () => {
    // Reset database before each test
    try {
      fs.unlinkSync(testEnv.dbPath);
    } catch {
      // File might not exist
    }

    // Initialize fresh database
    getDb();
    // Database will be auto-initialized by getDb()
  });

  describe("CLI Import", () => {
    it(
      "should import JSON array file via CLI",
      async () => {
        // Create test file
        const testFile = path.join(testEnv.tempDir, "test-import.json");
        fs.writeFileSync(testFile, JSON.stringify(edukaaiSampleData, null, 2));

        // Import via CLI
        const result = execSync(
          `node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`,
          {
            env: {
              ...process.env,
              DATABASE_URL: testEnv.dbPath,
              AI_CURATOR_DATA_DIR: testEnv.dataDir,
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Verify output
        expect(result).toContain("Import complete");
        expect(result).toContain("3 samples");

        // Verify database
        const db = getDb();
        const importedSamples = await db.query.samples.findMany();
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
        const testFile = path.join(testEnv.tempDir, "test-import.jsonl");
        const lines = edukaaiSampleData.map((item) => JSON.stringify(item));
        fs.writeFileSync(testFile, lines.join("\n"));

        // Import via CLI
        const result = execSync(
          `node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`,
          {
            env: {
              ...process.env,
              DATABASE_URL: testEnv.dbPath,
              AI_CURATOR_DATA_DIR: testEnv.dataDir,
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Verify output
        expect(result).toContain("Import complete");
        expect(result).toContain("3 samples");

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
        const testFile = path.join(testEnv.tempDir, "test-dry-run.json");
        fs.writeFileSync(testFile, JSON.stringify(edukaaiSampleData, null, 2));

        // Import with dry run
        const result = execSync(
          `node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1 --dry-run`,
          {
            env: {
              ...process.env,
              DATABASE_URL: testEnv.dbPath,
              AI_CURATOR_DATA_DIR: testEnv.dataDir,
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Verify output mentions dry run
        expect(result).toContain("DRY RUN");

        // Verify no data in database
        const db = getDb();
        const importedSamples = await db.query.samples.findMany();
        expect(importedSamples).toHaveLength(0);
      },
      TEST_TIMEOUT
    );

    it(
      "should update dataset statistics after import",
      async () => {
        const testFile = path.join(testEnv.tempDir, "test-stats.json");
        fs.writeFileSync(
          testFile,
          JSON.stringify(
            [
              { instruction: "Test 1", output: "Output 1", status: "approved" },
              { instruction: "Test 2", output: "Output 2", status: "draft" },
              { instruction: "Test 3", output: "Output 3", status: "approved" },
            ],
            null,
            2
          )
        );

        // Import
        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
          env: {
            ...process.env,
            DATABASE_URL: testEnv.dbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        // Verify dataset stats
        const db = getDb();
        const dataset = await db.query.datasets.findFirst({
          where: eq(datasets.id, 1),
        });

        expect(dataset?.sampleCount).toBe(3);
        expect(dataset?.approvedCount).toBe(2);
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
            question: "What is the question?", // instruction alias
            answer: "This is the answer.", // output alias
            input: "Additional context",
            context: { scene: "test" }, // JSON context
          },
        ];

        const testFile = path.join(testEnv.tempDir, "test-aliases.json");
        fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

        // Import
        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
          env: {
            ...process.env,
            DATABASE_URL: testEnv.dbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });

        // Verify field resolution
        const db = getDb();
        const importedSamples = await db.query.samples.findMany();

        expect(importedSamples).toHaveLength(1);
        expect(importedSamples[0].instruction).toBe("What is the question?");
        expect(importedSamples[0].output).toBe("This is the answer.");
      },
      TEST_TIMEOUT
    );

    it(
      "should validate required fields",
      async () => {
        const testData = [
          { output: "Missing instruction" }, // Missing instruction
        ];

        const testFile = path.join(testEnv.tempDir, "test-invalid.json");
        fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

        // Import should report errors but not fail
        const result = execSync(
          `node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`,
          {
            env: {
              ...process.env,
              DATABASE_URL: testEnv.dbPath,
              AI_CURATOR_DATA_DIR: testEnv.dataDir,
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Should report errors
        expect(result).toContain("Failed");
        expect(result).toContain("1 samples");

        // No valid samples imported
        const db = getDb();
        const importedSamples = await db.query.samples.findMany();
        expect(importedSamples).toHaveLength(0);
      },
      TEST_TIMEOUT
    );
  });

  describe("EdukaAI Starter Pack Compatibility", () => {
    it(
      "should fully support EdukaAI Starter Pack with all metadata",
      async () => {
        // Create full EdukaAI-like dataset
        const fullEdukaData = Array(10)
          .fill(null)
          .map((_, i) => ({
            instruction: `Test instruction ${i}`,
            input: `Test input ${i}`,
            output: `Test output ${i}`,
            system_prompt: "You are a helpful assistant.",
            category: i % 2 === 0 ? "Basic_Facts" : "Tactical_Analysis",
            difficulty: ["beginner", "intermediate", "advanced"][i % 3],
            quality_rating: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
            tags: [`tag${i}`, `tag${i + 1}`],
            context: {
              scene: `scene_${i}`,
              characters: [`char${i}`, `char${i + 1}`],
              plot_point: `plot_${i}`,
              emotional_tone: ["happy", "sad", "excited"][i % 3],
              tactical_concepts: i % 2 === 0 ? ["concept1", "concept2"] : undefined,
            },
          }));

        const testFile = path.join(testEnv.tempDir, "edukaai-full.json");
        fs.writeFileSync(testFile, JSON.stringify(fullEdukaData, null, 2));

        // Import
        const result = execSync(
          `node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`,
          {
            env: {
              ...process.env,
              DATABASE_URL: testEnv.dbPath,
              AI_CURATOR_DATA_DIR: testEnv.dataDir,
            },
            encoding: "utf-8",
            cwd: process.cwd(),
          }
        );

        // Verify import successful
        expect(result).toContain("10 samples");

        // Verify all data in database
        const db = getDb();
        const importedSamples = await db.query.samples.findMany();

        expect(importedSamples).toHaveLength(10);

        // Verify all fields preserved
        for (let i = 0; i < 10; i++) {
          const sample = importedSamples[i];

          expect(sample.instruction).toBe(`Test instruction ${i}`);
          expect(sample.systemPrompt).toBe("You are a helpful assistant.");
          expect(sample.category).toBe(i % 2 === 0 ? "Basic_Facts" : "Tactical_Analysis");
          expect(sample.difficulty).toBe(["beginner", "intermediate", "advanced"][i % 3]);
          expect(sample.qualityRating).toBe(((i % 5) + 1) as 1 | 2 | 3 | 4 | 5);

          // Verify context
          expect(sample.context).toBeTruthy();
          const context = JSON.parse(sample.context! as string);
          expect(context.scene).toBe(`scene_${i}`);
          expect(context.characters).toEqual([`char${i}`, `char${i + 1}`]);
          expect(context.plot_point).toBe(`plot_${i}`);
          expect(context.emotional_tone).toBe(["happy", "sad", "excited"][i % 3]);

          if (i % 2 === 0) {
            expect(context.tactical_concepts).toEqual(["concept1", "concept2"]);
          }
        }
      },
      TEST_TIMEOUT
    );
  });
});
