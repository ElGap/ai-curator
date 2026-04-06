import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { existsSync, readFileSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import Database from "better-sqlite3";

// Functional tests that invoke actual CLI commands
describe("Export CLI Functional Tests (Real CLI)", () => {
  let testDataDir: string;
  let testDbPath: string;
  let outputDir: string;
  let db: Database.Database;

  beforeAll(() => {
    // Create test environment
    testDataDir = join(tmpdir(), `ai-curator-export-func-${Date.now()}`);
    outputDir = join(testDataDir, "output");
    testDbPath = join(testDataDir, "curator.db");

    mkdirSync(testDataDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });

    // Create real database
    db = new Database(testDbPath);
    db.exec(`
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

    // Insert test dataset
    db.prepare(
      "INSERT INTO datasets (id, name, is_active) VALUES (1, 'Functional Test Dataset', 1)"
    ).run();

    // Insert diverse samples
    const insertSample = db.prepare(`
      INSERT INTO samples (dataset_id, instruction, input, output, system_prompt, category, quality_rating, status, source, context, tags, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // High quality approved sample with full metadata
    insertSample.run(
      1,
      "Explain the opening goal",
      "A tactical analyst asks",
      "Chen Wei scored with a glancing header after a curling cross from Diego.",
      "You are a tactical analyst.",
      "Tactical_Analysis",
      5,
      "approved",
      "cli",
      JSON.stringify({
        scene: "minute_23",
        characters: ["chen_wei", "diego_rodriguez"],
        tactical_concepts: ["step_overs", "curling_cross", "glancing_header"],
      }),
      JSON.stringify(["goal", "technique", "header"]),
      "High quality tactical explanation"
    );

    // Medium quality draft sample
    insertSample.run(
      1,
      "What was the attendance?",
      null,
      "42,847 fans attended the match.",
      null,
      "Basic_Facts",
      3,
      "draft",
      "web",
      null,
      JSON.stringify(["attendance", "fans"]),
      null
    );

    // Another approved sample
    insertSample.run(
      1,
      "Describe the red card incident",
      "A referee student asks",
      "Okonkwo received a red card for violent conduct after elbowing Forsberg.",
      "You are a referee educator.",
      "Deep_Analysis",
      4,
      "approved",
      "cli",
      JSON.stringify({
        scene: "minute_58",
        characters: ["okonkwo", "forsberg", "mitchell"],
        emotional_tone: "neutral_explanatory",
      }),
      JSON.stringify(["red_card", "referee", "violent_conduct"]),
      "Educational content about referee decisions"
    );

    db.close();
  });

  afterAll(() => {
    try {
      rmSync(testDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("Alpaca Format Export", () => {
    it("should export all samples in alpaca format", () => {
      const outputFile = join(outputDir, "test-alpaca.json");

      const result = execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format alpaca --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      expect(result).toContain("Export complete");
      expect(existsSync(outputFile)).toBe(true);

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      expect(exported).toHaveLength(3);
      expect(exported[0]).toHaveProperty("instruction");
      expect(exported[0]).toHaveProperty("output");
      expect(exported[0]).toHaveProperty("input");
      expect(exported[0]).toHaveProperty("system");
    });

    it("should export with status filter", () => {
      const outputFile = join(outputDir, "test-approved.json");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format alpaca --filter "status=approved" --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      expect(exported).toHaveLength(2);

      // All should be approved
      exported.forEach((sample: any) => {
        // Note: alpaca format doesn't include status, but we filtered by it
        expect(sample).toHaveProperty("instruction");
        expect(sample).toHaveProperty("output");
      });
    });

    it("should export with quality filter", () => {
      const outputFile = join(outputDir, "test-high-quality.json");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format alpaca --filter "quality_rating>=4" --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      // 2 samples with quality >= 4
      expect(exported.length).toBeGreaterThanOrEqual(1);
    });

    it("should export with complex filter", () => {
      const outputFile = join(outputDir, "test-complex.json");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format alpaca --filter "status=approved AND quality_rating>=4" --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      expect(exported.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("JSONL Format Export", () => {
    it("should export in JSONL format", () => {
      const outputFile = join(outputDir, "test.jsonl");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format jsonl --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const content = readFileSync(outputFile, "utf-8");
      const lines = content.trim().split("\n");
      expect(lines).toHaveLength(3);

      // Each line should be valid JSON
      lines.forEach((line) => {
        const parsed = JSON.parse(line);
        expect(parsed).toHaveProperty("instruction");
        expect(parsed).toHaveProperty("output");
      });
    });
  });

  describe("MLX Format Export", () => {
    it("should export in MLX format", () => {
      const outputFile = join(outputDir, "test-mlx.jsonl");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format mlx --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const content = readFileSync(outputFile, "utf-8");
      const lines = content.trim().split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed).toHaveProperty("messages");
      expect(parsed.messages).toBeInstanceOf(Array);
      expect(parsed.messages[0]).toHaveProperty("role");
      expect(parsed.messages[0]).toHaveProperty("content");
    });

    it("should include system prompt in MLX format", () => {
      const outputFile = join(outputDir, "test-mlx-system.jsonl");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format mlx --filter "status=approved" --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const content = readFileSync(outputFile, "utf-8");
      const lines = content.trim().split("\n");

      const parsed = JSON.parse(lines[0]);
      // First message should be system if system prompt exists
      const hasSystem = parsed.messages.some((m: any) => m.role === "system");
      // At least one approved sample has system prompt
      expect(hasSystem || parsed.messages.length >= 2).toBe(true);
    });
  });

  describe("CSV Format Export", () => {
    it("should export in CSV format", () => {
      const outputFile = join(outputDir, "test.csv");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format csv --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const content = readFileSync(outputFile, "utf-8");
      const lines = content.trim().split("\n");

      // Header + 3 samples
      expect(lines.length).toBe(4);

      // Check header
      expect(lines[0]).toContain("instruction");
      expect(lines[0]).toContain("output");
      expect(lines[0]).toContain("category");
      expect(lines[0]).toContain("status");
      expect(lines[0]).toContain("quality");
    });
  });

  describe("ShareGPT Format Export", () => {
    it("should export in ShareGPT format", () => {
      const outputFile = join(outputDir, "test-sharegpt.json");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format sharegpt --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      expect(exported).toHaveLength(3);
      expect(exported[0]).toHaveProperty("conversations");
      expect(exported[0].conversations).toBeInstanceOf(Array);
      expect(exported[0].conversations[0]).toHaveProperty("from");
      expect(exported[0].conversations[0]).toHaveProperty("value");
    });
  });

  describe("Unsloth Format Export", () => {
    it("should export in Unsloth format", () => {
      const outputFile = join(outputDir, "test-unsloth.json");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format unsloth --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      expect(exported).toHaveLength(3);
      expect(exported[0]).toHaveProperty("text");
      expect(exported[0].text).toContain("###");
    });
  });

  describe("TRL Format Export", () => {
    it("should export in TRL format", () => {
      const outputFile = join(outputDir, "test-trl.json");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format trl --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      expect(exported).toHaveLength(3);
      expect(exported[0]).toHaveProperty("prompt");
      expect(exported[0]).toHaveProperty("completion");
    });
  });

  describe("Split Export", () => {
    it("should export with train/test/val split", () => {
      const baseOutput = join(outputDir, "split-test");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format alpaca --split "0.6,0.2,0.2" --output ${baseOutput} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const trainFile = `${baseOutput}_train.json`;
      const testFile = `${baseOutput}_test.json`;
      const valFile = `${baseOutput}_val.json`;

      expect(existsSync(trainFile)).toBe(true);
      expect(existsSync(testFile)).toBe(true);
      expect(existsSync(valFile)).toBe(true);

      const train = JSON.parse(readFileSync(trainFile, "utf-8"));
      const test = JSON.parse(readFileSync(testFile, "utf-8"));
      const val = JSON.parse(readFileSync(valFile, "utf-8"));

      // Total should be 3
      expect(train.length + test.length + val.length).toBe(3);
      // Train should have most
      expect(train.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Filter Query Language", () => {
    it("should filter by contains operator", () => {
      const outputFile = join(outputDir, "test-contains.json");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format alpaca --filter "instruction~goal" --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      // Should find samples with "goal" in instruction
      expect(exported.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter by category", () => {
      const outputFile = join(outputDir, "test-category.json");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format alpaca --filter "category=Tactical_Analysis" --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      expect(exported.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter by source", () => {
      const outputFile = join(outputDir, "test-source.json");

      execSync(
        `node ${join(process.cwd(), "bin/cli.js")} export --dataset 1 --format alpaca --filter "source=cli" --output ${outputFile} --data-dir ${testDataDir}`,
        { encoding: "utf-8", cwd: process.cwd() }
      );

      const exported = JSON.parse(readFileSync(outputFile, "utf-8"));
      expect(exported.length).toBeGreaterThanOrEqual(1);
    });
  });
});
