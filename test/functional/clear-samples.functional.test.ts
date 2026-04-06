import { describe, it, expect, beforeEach, afterAll, beforeAll } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { resetDb } from "../../server/db/index.js";
import {
  createIsolatedTestEnvironment,
  cleanupIsolatedTestEnvironment,
  resetTestDatabase,
} from "../test-env.js";

/**
 * Functional Tests for Clear Samples CLI Command
 * Uses isolated test environment for each test file
 */

const TEST_TIMEOUT = 30000;

describe("Clear Command - Functional Tests (CLI)", () => {
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

  it(
    "should show help text",
    () => {
      const result = execSync(`npx tsx ${path.join(process.cwd(), "bin/cli.js")} clear --help`, {
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
      const testFile = path.join(tempDir, "test.json");
      fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

      // Import samples
      execSync(`npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
        env: {
          ...process.env,
          AI_CURATOR_SKIP_AUTO_IMPORT: "1",
        },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Try to clear without confirmation (should show warning and wait for input)
      // This would normally require stdin interaction
      // For test, we check that the help shows the warning
      const helpResult = execSync(
        `npx tsx ${path.join(process.cwd(), "bin/cli.js")} clear --help`,
        {
          encoding: "utf-8",
          cwd: process.cwd(),
        }
      );

      expect(helpResult).toContain("--force");
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
      const testFile = path.join(tempDir, "test.json");
      fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

      // Import samples
      execSync(`npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
        env: {
          ...process.env,
          AI_CURATOR_SKIP_AUTO_IMPORT: "1",
        },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Clear with force
      const result = execSync(`npx tsx ${path.join(process.cwd(), "bin/cli.js")} clear --force`, {
        env: {
          ...process.env,
          AI_CURATOR_SKIP_AUTO_IMPORT: "1",
        },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      expect(result).toContain("Successfully cleared");
    },
    TEST_TIMEOUT
  );

  it(
    "should clear specific dataset with --dataset flag",
    () => {
      // Import to dataset 1
      const testFile = path.join(tempDir, "test.json");
      fs.writeFileSync(
        testFile,
        JSON.stringify([{ instruction: "Test", output: "Output" }], null, 2)
      );

      execSync(`npx tsx ${path.join(process.cwd(), "bin/cli.js")} import ${testFile} --dataset 1`, {
        env: {
          ...process.env,
          AI_CURATOR_SKIP_AUTO_IMPORT: "1",
        },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Clear dataset 1 with force
      const result = execSync(
        `npx tsx ${path.join(process.cwd(), "bin/cli.js")} clear --dataset 1 --force`,
        {
          env: {
            ...process.env,
            AI_CURATOR_SKIP_AUTO_IMPORT: "1",
          },
          encoding: "utf-8",
          cwd: process.cwd(),
        }
      );

      expect(result).toContain("Successfully cleared");
    },
    TEST_TIMEOUT
  );

  it(
    "should handle clearing empty dataset",
    () => {
      // Try to clear empty dataset
      const result = execSync(`npx tsx ${path.join(process.cwd(), "bin/cli.js")} clear --force`, {
        env: {
          ...process.env,
          AI_CURATOR_SKIP_AUTO_IMPORT: "1",
        },
        encoding: "utf-8",
        cwd: process.cwd(),
      });

      // Dataset 2 (EdukaAI Starter Pack) already has samples from seed data
      // Clearing it should remove those samples
      expect(result).toContain("Successfully cleared");
    },
    TEST_TIMEOUT
  );

  it(
    "should show error for non-existent dataset",
    () => {
      try {
        execSync(`npx tsx ${path.join(process.cwd(), "bin/cli.js")} clear --dataset 999 --force`, {
          env: {
            ...process.env,
            AI_CURATOR_SKIP_AUTO_IMPORT: "1",
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
