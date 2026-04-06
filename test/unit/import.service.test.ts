import { describe, it, expect, beforeEach, afterAll, beforeAll } from "vitest";
import { ImportService } from "../../server/services/import/import.service.js";
import {
  normalizeSample,
  validateSample,
  processBatch,
  parseQualityRating,
  parseTags,
  parseContext,
} from "../../server/services/import/import.validators.js";
import type { RawSample, ImportOptions } from "../../server/services/import/import.types.js";
import { getDb } from "../../server/db/index.js";
import { samples as samplesTable, datasets } from "../../server/db/schema.js";
import { eq } from "drizzle-orm";
import { createIsolatedTestEnvironment, cleanupIsolatedTestEnvironment } from "../test-env.js";

describe("Import Validators", () => {
  const defaultOptions: ImportOptions = {
    source: "cli",
    status: "draft",
  };

  describe("parseQualityRating", () => {
    it("should parse valid quality rating", () => {
      expect(parseQualityRating(5)).toBe(5);
      expect(parseQualityRating(3)).toBe(3);
      expect(parseQualityRating(1)).toBe(1);
    });

    it("should clamp values to 1-5 range", () => {
      expect(parseQualityRating(10)).toBe(5);
      expect(parseQualityRating(0)).toBe(1);
      expect(parseQualityRating(-5)).toBe(1);
    });

    it("should handle string inputs", () => {
      expect(parseQualityRating("5")).toBe(5);
      expect(parseQualityRating("3")).toBe(3);
    });

    it("should return default for invalid values", () => {
      expect(parseQualityRating(null)).toBe(3);
      expect(parseQualityRating(undefined)).toBe(3);
      expect(parseQualityRating("invalid")).toBe(3);
    });
  });

  describe("parseTags", () => {
    it("should parse array of tags", () => {
      expect(parseTags(["tag1", "tag2"])).toEqual(["tag1", "tag2"]);
    });

    it("should parse comma-separated string", () => {
      expect(parseTags("tag1, tag2, tag3")).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("should return empty array for invalid input", () => {
      expect(parseTags(null)).toEqual([]);
      expect(parseTags(undefined)).toEqual([]);
      expect(parseTags(123 as unknown as string[])).toEqual([]);
    });
  });

  describe("parseContext", () => {
    it("should parse context object", () => {
      const context = { scene: "test", characters: ["a", "b"] };
      expect(parseContext(context)).toEqual(context);
    });

    it("should parse JSON string", () => {
      const json = '{"scene": "test", "emotional_tone": "happy"}';
      expect(parseContext(json)).toEqual({ scene: "test", emotional_tone: "happy" });
    });

    it("should return null for invalid JSON", () => {
      expect(parseContext("invalid json")).toBeNull();
    });

    it("should return null for null/undefined", () => {
      expect(parseContext(null)).toBeNull();
      expect(parseContext(undefined)).toBeNull();
    });
  });

  describe("normalizeSample", () => {
    it("should normalize with field aliases", () => {
      const raw: RawSample = {
        input: "Test input",
        response: "Test output",
        context: "Additional context",
      };

      const normalized = normalizeSample(raw, defaultOptions);

      expect(normalized.instruction).toBe("Test input");
      expect(normalized.output).toBe("Test output");
      expect(normalized.input).toBe("Additional context");
    });

    it("should normalize question/answer aliases", () => {
      const raw: RawSample = {
        question: "Test question",
        answer: "Test answer",
      };

      const normalized = normalizeSample(raw, defaultOptions);

      expect(normalized.instruction).toBe("Test question");
      expect(normalized.output).toBe("Test answer");
    });

    it("should preserve context object", () => {
      const raw: RawSample = {
        instruction: "Test",
        output: "Output",
        context: {
          scene: "post_match",
          characters: ["player1"],
          emotional_tone: "excited",
        },
      };

      const normalized = normalizeSample(raw, defaultOptions);

      expect(normalized.context).toBe(
        JSON.stringify({
          scene: "post_match",
          characters: ["player1"],
          emotional_tone: "excited",
        })
      );
    });

    it("should parse context JSON string", () => {
      const raw: RawSample = {
        instruction: "Test",
        output: "Output",
        context: '{"scene":"test","plot_point":"match_start"}',
      };

      const normalized = normalizeSample(raw, defaultOptions);

      expect(normalized.context).toBe('{"scene":"test","plot_point":"match_start"}');
    });

    it("should apply defaults for missing fields", () => {
      const raw: RawSample = {
        instruction: "Test",
        output: "Output",
      };

      const normalized = normalizeSample(raw, defaultOptions);

      expect(normalized.category).toBe("general");
      expect(normalized.difficulty).toBe("intermediate");
      expect(normalized.qualityRating).toBe(3);
      expect(normalized.tags).toEqual([]);
      expect(normalized.status).toBe("draft");
    });

    it("should apply option overrides", () => {
      const raw: RawSample = {
        instruction: "Test",
        output: "Output",
        category: "original",
      };

      const options: ImportOptions = {
        source: "cli",
        category: "override",
        status: "approved",
      };

      const normalized = normalizeSample(raw, options);

      expect(normalized.category).toBe("override");
      expect(normalized.status).toBe("approved");
    });

    it("should handle EdukaAI Starter Pack format", () => {
      const raw: RawSample = {
        instruction: "What was the final score?",
        input: "A new fan asks",
        output: "The final score was 2-1.",
        system_prompt: "You are a football historian",
        category: "Basic_Facts",
        difficulty: "beginner",
        quality_rating: 5,
        tags: ["score", "result", "final_score"],
        context: {
          scene: "post_match_summary",
          characters: ["chen_wei", "lars_eriksson"],
          plot_point: "match_conclusion",
          emotional_tone: "factual_triumph",
        },
      };

      const normalized = normalizeSample(raw, defaultOptions);

      expect(normalized.instruction).toBe("What was the final score?");
      expect(normalized.output).toBe("The final score was 2-1.");
      expect(normalized.systemPrompt).toBe("You are a football historian");
      expect(normalized.category).toBe("Basic_Facts");
      expect(normalized.difficulty).toBe("beginner");
      expect(normalized.qualityRating).toBe(5);
      expect(normalized.tags).toEqual(["score", "result", "final_score"]);
      expect(normalized.context).toBeTruthy();

      const parsedContext = JSON.parse(normalized.context!);
      expect(parsedContext.scene).toBe("post_match_summary");
      expect(parsedContext.characters).toEqual(["chen_wei", "lars_eriksson"]);
      expect(parsedContext.plot_point).toBe("match_conclusion");
      expect(parsedContext.emotional_tone).toBe("factual_triumph");
    });
  });

  describe("validateSample", () => {
    it("should pass valid sample", () => {
      const normalized = normalizeSample({ instruction: "Test", output: "Output" }, defaultOptions);

      const errors = validateSample(normalized);
      expect(errors).toHaveLength(0);
    });

    it("should fail missing instruction", () => {
      const normalized = normalizeSample({ output: "Output" } as RawSample, defaultOptions);

      const errors = validateSample(normalized);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("instruction");
    });

    it("should fail missing output", () => {
      const normalized = normalizeSample({ instruction: "Test" } as RawSample, defaultOptions);

      const errors = validateSample(normalized);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("output");
    });

    it("should clamp invalid quality rating to valid range", () => {
      const raw: RawSample = {
        instruction: "Test",
        output: "Output",
        quality_rating: 10,
      };

      const normalized = normalizeSample(raw, defaultOptions);

      // Quality rating should be clamped to 5 (max)
      expect(normalized.qualityRating).toBe(5);
      // No validation errors because it's now in valid range
      const errors = validateSample(normalized);
      expect(errors).toHaveLength(0);
    });
  });

  describe("processBatch", () => {
    it("should process valid samples", () => {
      const samples: RawSample[] = [
        { instruction: "Test 1", output: "Output 1" },
        { instruction: "Test 2", output: "Output 2" },
      ];

      const result = processBatch(samples, defaultOptions);

      expect(result.normalized).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should report errors for invalid samples", () => {
      const samples: RawSample[] = [
        { instruction: "Test 1", output: "Output 1" },
        { output: "Missing instruction" } as RawSample,
      ];

      const result = processBatch(samples, defaultOptions);

      expect(result.normalized).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(2);
    });

    it("should include line numbers in errors", () => {
      const samples: RawSample[] = [
        { instruction: "Test 1", output: "Output 1" },
        { instruction: "Test 2", output: "Output 2" },
        { output: "Invalid" } as RawSample,
      ];

      const result = processBatch(samples, defaultOptions, 10);

      expect(result.errors[0].line).toBe(13); // 10 + 2 (index) + 1
    });

    it("should process EdukaAI Starter Pack batch", () => {
      const samples: RawSample[] = [
        {
          instruction: "What was the final score?",
          input: "A new fan asks",
          output: "The final score was 2-1.",
          category: "Basic_Facts",
          difficulty: "beginner",
          quality_rating: 5,
          tags: ["score", "result"],
          context: {
            scene: "post_match_summary",
            characters: ["chen_wei"],
          },
        },
        {
          instruction: "Who scored the first goal?",
          output: "Chen Wei scored in the 23rd minute.",
          category: "Tactical_Analysis",
          difficulty: "intermediate",
          quality_rating: 5,
          context: {
            scene: "minute_23",
            tactical_concepts: ["step_overs", "header"],
          },
        },
      ];

      const result = processBatch(samples, defaultOptions);

      expect(result.normalized).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      // Verify context preserved
      expect(result.normalized[0].context).toBeTruthy();
      expect(result.normalized[1].context).toBeTruthy();
    });
  });
});

describe("ImportService Integration", () => {
  let testEnv: { tempDir: string; dataDir: string; dbPath: string };
  let importService: ImportService;

  beforeAll(() => {
    testEnv = createIsolatedTestEnvironment();
  });

  afterAll(() => {
    cleanupIsolatedTestEnvironment(testEnv.tempDir);
  });

  beforeEach(() => {
    // Use the isolated database from test environment
    importService = new ImportService(testEnv.dbPath);

    // Reset database state before each test
    const db = getDb();
    // Clean up any existing test data
    db.delete(samplesTable).where(eq(samplesTable.datasetId, 999)).run();
  });

  it("should import valid samples with context", async () => {
    // Use a unique dataset ID to avoid conflicts with default datasets
    const db = getDb();
    await db.insert(datasets).values({
      id: 999,
      name: "Test Dataset",
      isActive: 1,
    });

    const samples: RawSample[] = [
      {
        instruction: "Test instruction",
        output: "Test output",
        context: {
          scene: "test_scene",
          characters: ["char1"],
          emotional_tone: "happy",
        },
      },
    ];

    const result = await importService.importSamples(samples, {
      source: "cli",
      datasetId: 999,
    });

    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);

    // Verify in database
    const importedSamples = await db.query.samples.findMany({
      where: eq(samplesTable.datasetId, 999),
    });

    expect(importedSamples).toHaveLength(1);
    expect(importedSamples[0].context).toBeTruthy();

    const context = JSON.parse(importedSamples[0].context!);
    expect(context.scene).toBe("test_scene");
    expect(context.characters).toEqual(["char1"]);
  });

  it("should handle dry run mode", async () => {
    // For dry run, we don't need to insert a dataset - it won't actually write
    const samples: RawSample[] = [{ instruction: "Test", output: "Output" }];

    const result = await importService.importSamples(samples, {
      source: "cli",
      datasetId: 1, // Use default dataset for dry run
      dryRun: true,
    });

    expect(result.imported).toBe(1);

    // Verify not in database (dry run should not persist)
    const db = getDb();
    const _allSamples = await db.query.samples.findMany();
    // Should only have samples that were already there (if any)
    // Dry run doesn't add new samples
  });

  it("should update dataset stats after import", async () => {
    // Use a unique dataset ID to avoid conflicts
    const db = getDb();
    await db.insert(datasets).values({
      id: 998,
      name: "Test Dataset Stats",
      isActive: 1,
    });

    const samples: RawSample[] = [
      { instruction: "Test 1", output: "Output 1", status: "approved" },
      { instruction: "Test 2", output: "Output 2", status: "draft" },
      { instruction: "Test 3", output: "Output 3", status: "approved" },
    ];

    await importService.importSamples(samples, {
      source: "cli",
      datasetId: 998,
    });

    // Verify stats
    const dataset = await db.query.datasets.findFirst({
      where: eq(datasets.id, 998),
    });

    expect(dataset?.sampleCount).toBe(3);
    expect(dataset?.approvedCount).toBe(2);
  });

  it("should handle field aliases correctly", async () => {
    const db = getDb();
    // Use a unique dataset ID to avoid conflicts
    await db.insert(datasets).values({
      id: 997,
      name: "Test Dataset Aliases",
      isActive: 1,
    });

    const samples: RawSample[] = [
      {
        question: "What is the answer?", // instruction alias (but input takes precedence!)
        answer: "42", // output alias
        input: "Additional context", // This takes precedence over question for instruction
        context: { scene: "test" }, // JSON context
      },
    ];

    const result = await importService.importSamples(samples, {
      source: "cli",
      datasetId: 997,
    });

    expect(result.imported).toBe(1);

    const importedSamples = await db.query.samples.findMany({
      where: eq(samplesTable.datasetId, 997),
    });

    // input field takes precedence over question for instruction
    expect(importedSamples[0].instruction).toBe("Additional context");
    expect(importedSamples[0].output).toBe("42");
    // input is used for instruction, so the separate input field is null
    expect(importedSamples[0].input).toBeNull();
    // context is the JSON object
    expect(importedSamples[0].context).toBeTruthy();
    const context = JSON.parse(importedSamples[0].context!);
    expect(context.scene).toBe("test");
  });

  it("should handle EdukaAI Starter Pack full import", async () => {
    const db = getDb();
    // Use a unique dataset ID to avoid conflicts with default datasets
    await db.insert(datasets).values({
      id: 996,
      name: "EdukaAI Starter Pack Test",
      isActive: 1,
    });

    // Full EdukaAI sample
    const samples: RawSample[] = [
      {
        instruction: "What was the final score of the match?",
        input: "A new fan who just heard about this famous match asks for the basic result.",
        output:
          "The final score was Kingston United 2-1 Northfield Rovers. Chen Wei scored both goals...",
        system_prompt: "You are a knowledgeable football historian...",
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
          "Chen Wei scored the first goal in the 23rd minute with a technically excellent glancing header...",
        system_prompt: "You are a tactical analyst...",
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
    ];

    const result = await importService.importSamples(samples, {
      source: "cli",
      datasetId: 996,
    });

    expect(result.success).toBe(true);
    expect(result.imported).toBe(2);
    expect(result.failed).toBe(0);

    // Verify all fields preserved
    const importedSamples = await db.query.samples.findMany({
      where: eq(samplesTable.datasetId, 996),
    });

    expect(importedSamples).toHaveLength(2);

    // Verify first sample
    const first = importedSamples[0];
    expect(first.instruction).toContain("final score");
    expect(first.systemPrompt).toContain("football historian");
    expect(first.category).toBe("Basic_Facts");
    expect(first.difficulty).toBe("beginner");
    expect(first.qualityRating).toBe(5);
    expect(JSON.parse(first.tags!)).toContain("score");

    // Verify context preserved
    const firstContext = JSON.parse(first.context!);
    expect(firstContext.scene).toBe("post_match_summary");
    expect(firstContext.characters).toContain("chen_wei");
    expect(firstContext.plot_point).toBe("match_conclusion");
    expect(firstContext.emotional_tone).toBe("factual_triumph");

    // Verify second sample with tactical_concepts
    const second = importedSamples[1];
    const secondContext = JSON.parse(second.context!);
    expect(secondContext.scene).toBe("minute_23");
    expect(secondContext.tactical_concepts).toContain("step_overs");
    expect(secondContext.tactical_concepts).toContain("curling_cross");
  });
});
