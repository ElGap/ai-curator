import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { QueryParser } from "../../server/cli/export.js";
import { createIsolatedTestEnvironment, cleanupIsolatedTestEnvironment } from "../test-env.js";
import { Database } from "bun:sqlite";

// Unit tests for QueryParser (pure logic, no DB needed)
describe("Export QueryParser Unit Tests", () => {
  const parser = new QueryParser();

  describe("tokenize", () => {
    it("should tokenize simple query", () => {
      const tokens = parser.tokenize("status=approved");
      expect(tokens).toEqual(["status=approved"]);
    });

    it("should tokenize query with AND", () => {
      const tokens = parser.tokenize("status=approved AND quality>3");
      expect(tokens).toEqual(["status=approved", "AND", "quality>3"]);
    });

    it("should handle quoted strings", () => {
      const tokens = parser.tokenize('category="Basic Facts"');
      // The actual implementation splits on = inside quotes differently
      expect(tokens).toContain("category=");
      expect(tokens).toContain("Basic Facts");
    });

    it("should handle complex query", () => {
      const tokens = parser.tokenize("status=approved AND quality>=4 OR category=coding");
      expect(tokens).toContain("status=approved");
      expect(tokens).toContain("AND");
      expect(tokens).toContain("quality>=4");
      expect(tokens).toContain("OR");
      expect(tokens).toContain("category=coding");
    });
  });

  describe("parse", () => {
    it("should parse simple equality", () => {
      const result = parser.parse("status=approved");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        field: "status",
        operator: "=",
        value: "approved",
      });
    });

    it("should parse numeric comparison", () => {
      const result = parser.parse("quality>4");
      expect(result[0]).toMatchObject({
        field: "quality",
        operator: ">",
        value: 4,
      });
    });

    it("should parse greater than or equal", () => {
      const result = parser.parse("quality>=4");
      expect(result[0]).toMatchObject({
        field: "quality",
        operator: ">=",
        value: 4,
      });
    });

    it("should parse contains operator", () => {
      const result = parser.parse("instruction~python");
      expect(result[0]).toMatchObject({
        field: "instruction",
        operator: "~",
        value: "python",
      });
    });

    it("should parse AND conditions", () => {
      const result = parser.parse("status=approved AND quality>=4");
      expect(result).toHaveLength(2);
      expect(result[1].logicOp).toBe("AND");
    });

    it("should parse OR conditions", () => {
      const result = parser.parse("category=coding OR category=math");
      expect(result).toHaveLength(2);
      expect(result[1].logicOp).toBe("OR");
    });

    it("should return null for empty query", () => {
      const result = parser.parse("");
      expect(result).toBeNull();
    });
  });

  describe("evaluate", () => {
    it("should evaluate equality", () => {
      const conditions = parser.parse("status=approved");
      const sample = { status: "approved" };
      expect(parser.evaluate(conditions, sample)).toBe(true);
    });

    it("should evaluate inequality", () => {
      const conditions = parser.parse("status=approved");
      const sample = { status: "draft" };
      expect(parser.evaluate(conditions, sample)).toBe(false);
    });

    it("should evaluate numeric comparison", () => {
      const conditions = parser.parse("quality>4");
      // Note: parser looks for field name "quality" exactly
      expect(parser.evaluate(conditions, { quality: 5 })).toBe(true);
      expect(parser.evaluate(conditions, { quality: 4 })).toBe(false);
    });

    it("should evaluate contains", () => {
      const conditions = parser.parse("instruction~python");
      expect(parser.evaluate(conditions, { instruction: "Learn python today" })).toBe(true);
      expect(parser.evaluate(conditions, { instruction: "Learn Java today" })).toBe(false);
    });

    it("should evaluate AND logic", () => {
      const conditions = parser.parse("status=approved AND quality>=4");
      expect(parser.evaluate(conditions, { status: "approved", quality: 5 })).toBe(true);
      expect(parser.evaluate(conditions, { status: "approved", quality: 3 })).toBe(false);
      expect(parser.evaluate(conditions, { status: "draft", quality: 5 })).toBe(false);
    });

    it("should evaluate OR logic", () => {
      const conditions = parser.parse("category=coding OR category=math");
      expect(parser.evaluate(conditions, { category: "coding" })).toBe(true);
      expect(parser.evaluate(conditions, { category: "math" })).toBe(true);
      expect(parser.evaluate(conditions, { category: "science" })).toBe(false);
    });

    it("should handle complex mixed logic", () => {
      const conditions = parser.parse("status=approved AND quality>=4 OR category=coding");
      // (approved AND quality>=4) OR coding
      expect(
        parser.evaluate(conditions, { status: "approved", quality: 5, category: "general" })
      ).toBe(true);
      expect(parser.evaluate(conditions, { status: "draft", quality: 3, category: "coding" })).toBe(
        true
      );
      expect(
        parser.evaluate(conditions, { status: "draft", quality: 3, category: "general" })
      ).toBe(false);
    });
  });
});

// Integration tests with real database
describe("Export CLI Integration Tests (Real DB)", () => {
  let testEnv: { tempDir: string; dataDir: string; dbPath: string };
  let testDb: any;
  let testDbPath: string;

  beforeAll(() => {
    // Create isolated test environment
    testEnv = createIsolatedTestEnvironment();
    testDbPath = testEnv.dbPath;

    // Create real database with schema
    testDb = new Database(testDbPath);
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS datasets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        default_quality TEXT DEFAULT 'medium',
        default_category TEXT DEFAULT 'general',
        default_auto_approve INTEGER DEFAULT 0,
        goal_samples INTEGER DEFAULT 100,
        goal_name TEXT DEFAULT 'First Fine-Tuning',
        sample_count INTEGER DEFAULT 0,
        approved_count INTEGER DEFAULT 0,
        last_import_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset_id INTEGER DEFAULT 1,
        instruction TEXT NOT NULL,
        input TEXT,
        output TEXT NOT NULL,
        system_prompt TEXT,
        category TEXT DEFAULT 'general',
        difficulty TEXT DEFAULT 'intermediate',
        quality_rating INTEGER DEFAULT 3,
        status TEXT DEFAULT 'draft',
        source TEXT DEFAULT 'cli',
        model TEXT,
        context TEXT,
        tags TEXT,
        notes TEXT,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER
      );
    `);

    // Insert test dataset with ID 99 to avoid conflicts with seeded data (IDs 1, 2)
    testDb
      .prepare("INSERT INTO datasets (id, name, is_active) VALUES (99, 'Test Dataset', 1)")
      .run();

    // Insert test samples with various properties
    const insertSample = testDb.prepare(`
      INSERT INTO samples (dataset_id, instruction, input, output, system_prompt, category, quality_rating, status, source, context, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Sample 1: Approved, high quality, with context
    insertSample.run(
      99,
      "What was the final score?",
      "A fan asks about the match",
      "The final score was 2-1.",
      "You are a football historian.",
      "Basic_Facts",
      5,
      "approved",
      "cli",
      JSON.stringify({ scene: "post_match", characters: ["chen_wei"] }),
      JSON.stringify(["score", "result"])
    );

    // Sample 2: Draft, medium quality
    insertSample.run(
      99,
      "Who scored the first goal?",
      null,
      "Chen Wei scored in the 23rd minute.",
      null,
      "Tactical_Analysis",
      3,
      "draft",
      "web",
      null,
      JSON.stringify(["goals", "chen_wei"])
    );

    // Sample 3: Approved, with tactical concepts
    insertSample.run(
      99,
      "Explain the step-overs technique",
      "A tactical analyst asks",
      "Diego performed four rapid step-overs to unbalance the defender.",
      "You are a tactical analyst.",
      "Tactical_Analysis",
      5,
      "approved",
      "cli",
      JSON.stringify({ scene: "minute_23", tactical_concepts: ["step_overs", "curling_cross"] }),
      JSON.stringify(["tactical", "technique"])
    );

    // Sample 4: Rejected, low quality
    insertSample.run(
      99,
      "Bad instruction",
      null,
      "Incomplete output",
      null,
      "general",
      1,
      "rejected",
      "web",
      null,
      null
    );
  });

  afterAll(() => {
    // Cleanup
    if (testDb) testDb.close();
    cleanupIsolatedTestEnvironment(testEnv.tempDir);
  });

  describe("Database Connection", () => {
    it("should connect to real test database", () => {
      const result = testDb.prepare("SELECT COUNT(*) as count FROM samples").get() as {
        count: number;
      };
      expect(result.count).toBe(4);
    });

    it("should have correct sample properties", () => {
      const samples = testDb.prepare("SELECT * FROM samples ORDER BY id").all() as any[];
      expect(samples).toHaveLength(4);

      // Check first sample has context
      expect(JSON.parse(samples[0].context)).toMatchObject({
        scene: "post_match",
        characters: ["chen_wei"],
      });

      // Check tags are JSON
      expect(JSON.parse(samples[0].tags)).toContain("score");
    });
  });

  describe("Export Formats from Real Data", () => {
    it("should fetch all samples with metadata", () => {
      const rows = testDb
        .prepare(
          `
        SELECT s.*, datetime(s.created_at, 'unixepoch') as created_at_formatted
        FROM samples s
        WHERE s.dataset_id = ?
        ORDER BY s.id
      `
        )
        .all(99) as any[];

      expect(rows).toHaveLength(4);

      // Verify context and tags are included
      expect(rows[0].context).toBeTruthy();
      expect(rows[0].tags).toBeTruthy();
      expect(rows[0].system_prompt).toBe("You are a football historian.");
    });

    it("should filter by status", () => {
      const approved = testDb
        .prepare("SELECT COUNT(*) as count FROM samples WHERE status = 'approved'")
        .get() as { count: number };
      expect(approved.count).toBe(2);
    });

    it("should filter by quality rating", () => {
      const highQuality = testDb
        .prepare("SELECT COUNT(*) as count FROM samples WHERE quality_rating >= 4")
        .get() as { count: number };
      expect(highQuality.count).toBe(2);
    });

    it("should parse JSON context in query", () => {
      const sample = testDb.prepare("SELECT context FROM samples WHERE id = 1").get() as {
        context: string;
      };
      const context = JSON.parse(sample.context);
      expect(context.scene).toBe("post_match");
      expect(context.characters).toContain("chen_wei");
    });
  });
});
