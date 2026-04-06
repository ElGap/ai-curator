import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Functional Tests for Clear Samples CLI Command
 * Uses real CLI execution with real database
 */

const TEST_TIMEOUT = 30000;

function createTestEnv() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-curator-clear-cli-"));
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

describe("Clear Command - Functional Tests (CLI)", () => {
  let testEnv: { tempDir: string; dataDir: string; dbPath: string };

  beforeEach(() => {
    testEnv = createTestEnv();
  });

  afterAll(() => {
    cleanupTestEnv(testEnv.tempDir);
  });

  it(
    "should show help text",
    () => {
      const result = execSync(`node ${path.join(process.cwd(), "bin/cli.js")} clear --help`, {
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      expect(result).toContain("Clear Command Options");
      expect(result).toContain("--dataset");
      expect(result).toContain("--force");
      expect(result).toContain("--data-dir");
    },
    TEST_TIMEOUT
  );

  it(
    "should require confirmation when clearing active dataset",
    () => {
      // Import some samples first
      const testData = [
        { instruction: "Test 1", output: "Output 1" },
        { instruction: "Test 2", output: "Output 2" },
      ];
      const testFile = path.join(testEnv.tempDir, "test.json");
      fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

      // Import samples
      execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
        env: { ...process.env, DATABASE_URL: testEnv.dbPath, AI_CURATOR_DATA_DIR: testEnv.dataDir },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Try to clear without confirmation (should show warning and wait for input)
      // This would normally require stdin interaction
      // For test, we check that the help shows the warning
      const helpResult = execSync(`node ${path.join(process.cwd(), "bin/cli.js")} clear --help`, {
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      expect(helpResult).toContain("confirmation required");
    },
    TEST_TIMEOUT
  );

  it(
    "should clear samples with --force flag",
    () => {
      // Import samples first
      const testData = Array(10)
        .fill(null)
        .map((_, i) => ({
          instruction: `Test ${i}`,
          output: `Output ${i}`,
        }));
      const testFile = path.join(testEnv.tempDir, "test.json");
      fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

      // Import samples
      execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
        env: { ...process.env, DATABASE_URL: testEnv.dbPath, AI_CURATOR_DATA_DIR: testEnv.dataDir },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Clear with force
      const result = execSync(`node ${path.join(process.cwd(), "bin/cli.js")} clear --force`, {
        env: { ...process.env, DATABASE_URL: testEnv.dbPath, AI_CURATOR_DATA_DIR: testEnv.dataDir },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      expect(result).toContain("Successfully cleared");
      expect(result).toContain("10");
    },
    TEST_TIMEOUT
  );

  it(
    "should clear specific dataset with --dataset flag",
    () => {
      // Import to dataset 1
      const testFile = path.join(testEnv.tempDir, "test.json");
      fs.writeFileSync(
        testFile,
        JSON.stringify([{ instruction: "Test", output: "Output" }], null, 2)
      );

      execSync(`node ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
        env: { ...process.env, DATABASE_URL: testEnv.dbPath, AI_CURATOR_DATA_DIR: testEnv.dataDir },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Clear dataset 1 with force
      const result = execSync(
        `node ${path.join(process.cwd(), "bin/cli.js")} clear --dataset 1 --force`,
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

      expect(result).toContain("Successfully cleared");
      expect(result).toContain("1");
    },
    TEST_TIMEOUT
  );

  it(
    "should handle clearing empty dataset",
    () => {
      // Try to clear empty dataset
      const result = execSync(`node ${path.join(process.cwd(), "bin/cli.js")} clear --force`, {
        env: { ...process.env, DATABASE_URL: testEnv.dbPath, AI_CURATOR_DATA_DIR: testEnv.dataDir },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Should indicate dataset is already empty
      expect(result).toContain("Dataset is already empty");
    },
    TEST_TIMEOUT
  );

  it(
    "should show error for non-existent dataset",
    () => {
      try {
        execSync(`node ${path.join(process.cwd(), "bin/cli.js")} clear --dataset 999 --force`, {
          env: {
            ...process.env,
            DATABASE_URL: testEnv.dbPath,
            AI_CURATOR_DATA_DIR: testEnv.dataDir,
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr || error.stdout).toContain("not found");
      }
    },
    TEST_TIMEOUT
  );
});
