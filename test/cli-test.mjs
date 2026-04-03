// test/cli-test.mjs
// Comprehensive CLI testing suite

import { execSync } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

const CLI_PATH = "./bin/cli.js";

class CLITester {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async runTest(name, command, expectedOutput = null, shouldSucceed = true) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   Command: ${command}`);

    try {
      const result = execSync(command, {
        encoding: "utf8",
        timeout: 30000,
        stdio: ["pipe", "pipe", "pipe"],
      });

      const _success = true;
      const output = result.toString();

      if (expectedOutput && !output.includes(expectedOutput)) {
        console.log(`   ❌ Expected output not found: ${expectedOutput}`);
        this.failed++;
        this.results.push({ name, status: "fail", error: "Output mismatch" });
        return false;
      }

      console.log(`   ✅ Passed`);
      this.passed++;
      this.results.push({ name, status: "pass" });
      return true;
    } catch (error) {
      if (shouldSucceed) {
        console.log(`   ❌ Failed: ${error.message}`);
        this.failed++;
        this.results.push({ name, status: "fail", error: error.message });
        return false;
      } else {
        console.log(`   ✅ Passed (expected failure)`);
        this.passed++;
        this.results.push({ name, status: "pass" });
        return true;
      }
    }
  }

  async testHelp() {
    await this.runTest("Help command", `node ${CLI_PATH} help`, "edukaAI CLI");
  }

  async testImport() {
    // Test import with dry run
    await this.runTest(
      "Import dry-run",
      `node ${CLI_PATH} import /tmp/edukaai-test-datasets/code_alpaca_100.json --dry-run`,
      "DRY RUN"
    );
  }

  async testExport() {
    // Clean up any existing test files
    const testOutput = join(process.cwd(), "test-export.json");
    if (existsSync(testOutput)) {
      unlinkSync(testOutput);
    }

    // Test export
    await this.runTest(
      "Export to JSON",
      `node ${CLI_PATH} export --output test-export --format alpaca`,
      "Export complete"
    );

    // Verify file was created
    if (existsSync(testOutput)) {
      console.log(`   ✅ Export file created`);
      unlinkSync(testOutput);
    }
  }

  async testSearch() {
    // Test search (may fail without API keys, but should show proper error)
    await this.runTest("Search help", `node ${CLI_PATH} search --help`, "Search Command");
  }

  async testDownload() {
    // Test download help
    await this.runTest("Download help", `node ${CLI_PATH} download --help`, "Download Command");
  }

  async testReset() {
    // Test reset displays warning (it goes to interactive mode)
    await this.runTest("Reset command", `node ${CLI_PATH} reset --force`, "Database Reset");
  }

  async runAll() {
    console.log("=".repeat(60));
    console.log("🚀 CLI Testing Suite");
    console.log("=".repeat(60));

    await this.testHelp();
    await this.testImport();
    await this.testExport();
    await this.testSearch();
    await this.testDownload();
    await this.testReset();

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Results");
    console.log("=".repeat(60));
    console.log(`   ✅ Passed: ${this.passed}`);
    console.log(`   ❌ Failed: ${this.failed}`);
    console.log(
      `   📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`
    );
    console.log("=".repeat(60));

    if (this.failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.results
        .filter((r) => r.status === "fail")
        .forEach((r) => {
          console.log(`   - ${r.name}: ${r.error}`);
        });
    }

    return this.failed === 0;
  }
}

// Run tests
const tester = new CLITester();
tester.runAll().then((success) => {
  process.exit(success ? 0 : 1);
});
