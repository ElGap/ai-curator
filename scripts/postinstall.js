#!/usr/bin/env node
/**
 * Post-install script to ensure better-sqlite3 works on the target platform
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const isMac = process.platform === "darwin";

console.log("🔧 Checking better-sqlite3 for your platform...");
console.log(`   Platform: ${process.platform} ${process.arch}`);

// Check if we're in the installed package (not development)
const packageJsonPath = join(process.cwd(), "package.json");
if (!existsSync(packageJsonPath)) {
  console.log("Skipping - not in a package directory");
  process.exit(0);
}

// Check if better-sqlite3 is in dependencies
const packageJson = JSON.parse(
  await import("fs").then((fs) => fs.readFileSync(packageJsonPath, "utf8"))
);
if (!packageJson.dependencies?.["better-sqlite3"]) {
  console.log("Skipping - better-sqlite3 not a dependency");
  process.exit(0);
}

// Check if rebuild is needed
const betterSqlite3Path = join(process.cwd(), "node_modules", "better-sqlite3");
const buildPath = join(betterSqlite3Path, "build", "Release", "better_sqlite3.node");

if (!existsSync(buildPath)) {
  console.log("⚠️  better-sqlite3 binary missing, rebuilding...");

  try {
    // Install build tools hint
    if (isMac && !existsSync("/usr/bin/xcodebuild")) {
      console.log("");
      console.log("📦 Xcode Command Line Tools may be required");
      console.log("   Run: xcode-select --install");
      console.log("");
    }

    execSync("npm rebuild better-sqlite3 --build-from-source", {
      stdio: "inherit",
      cwd: process.cwd(),
      timeout: 180000,
    });

    console.log("✅ better-sqlite3 rebuilt successfully");
  } catch (_error) {
    console.error("❌ Rebuild failed");
    console.error("");
    console.error("You may need to install build tools:");
    console.error("  macOS: xcode-select --install");
    console.error("  Linux: sudo apt-get install build-essential python3");
    console.error("  Windows: npm install --global windows-build-tools");
    console.error("");
    console.error("Or use Docker:");
    console.error("  docker run -p 3333:3333 elgap/ai-curator:latest");
    process.exit(1);
  }
} else {
  // Test if the binary works
  try {
    const { default: Database } = await import("better-sqlite3");
    const testDb = new Database(":memory:");
    testDb.exec("SELECT 1");
    testDb.close();
    console.log("✅ better-sqlite3 is ready");
  } catch (_err) {
    console.log("⚠️  better-sqlite3 binary incompatible, rebuilding...");

    try {
      execSync("npm rebuild better-sqlite3 --build-from-source", {
        stdio: "inherit",
        cwd: process.cwd(),
        timeout: 180000,
      });
      console.log("✅ better-sqlite3 rebuilt successfully");
    } catch (_error) {
      console.error("❌ Rebuild failed");
      console.error("");
      console.error("Build tools may be required - see error above");
      process.exit(1);
    }
  }
}
