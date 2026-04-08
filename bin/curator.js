#!/usr/bin/env node
/**
 * AI Curator - Universal Binary Manager
 *
 * This script downloads and manages platform-specific binaries for AI Curator.
 * It caches binaries locally to avoid re-downloading on subsequent runs.
 */

import fs from "fs";
import path from "path";
import os from "os";
import https from "https";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CACHE_DIR = path.join(os.homedir(), ".ai-curator", "bin");
const VERSION = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
).version;
const PLATFORM = `${process.platform}-${process.arch}`;
const IS_WINDOWS = process.platform === "win32";
const BINARY_NAME = IS_WINDOWS ? `curator-${PLATFORM}.exe` : `curator-${PLATFORM}`;
const BINARY_PATH = path.join(CACHE_DIR, BINARY_NAME);

// GitHub repository info
const REPO_OWNER = "elgap";
const REPO_NAME = "ai-curator";

/**
 * Ensure the binary exists, downloading if necessary
 */
async function ensureBinary() {
  // Check if binary exists and is correct version
  if (fs.existsSync(BINARY_PATH)) {
    const versionFile = path.join(CACHE_DIR, ".version");
    if (fs.existsSync(versionFile)) {
      const cachedVersion = fs.readFileSync(versionFile, "utf8").trim();
      if (cachedVersion === VERSION) {
        return BINARY_PATH;
      }
    }
    // Version mismatch, remove old binary
    console.log(`🔄 Updating AI Curator to ${VERSION}...`);
    fs.unlinkSync(BINARY_PATH);
  }

  // Create cache directory
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // Download binary
  console.log(`📦 Downloading AI Curator ${VERSION} for ${PLATFORM}...`);

  const url = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v${VERSION}/${BINARY_NAME}`;

  try {
    await downloadFile(url, BINARY_PATH);
    // chmod not needed on Windows
    if (!IS_WINDOWS) {
      fs.chmodSync(BINARY_PATH, 0o755);
    }
    fs.writeFileSync(path.join(CACHE_DIR, ".version"), VERSION);
    console.log("✅ Download complete");
  } catch (error) {
    throw new Error(`Failed to download binary: ${error.message}`);
  }

  return BINARY_PATH;
}

/**
 * Download a file from URL to destination
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https
      .get(url, { redirect: "follow" }, (response) => {
        // Handle redirects
        if (response.statusCode === 302 || response.statusCode === 301) {
          if (response.headers.location) {
            downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }

        const totalBytes = parseInt(response.headers["content-length"], 10) || 0;
        let downloadedBytes = 0;
        let lastProgress = 0;

        response.on("data", (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const progress = Math.round((downloadedBytes / totalBytes) * 100);
            if (progress >= lastProgress + 10) {
              process.stdout.write(`\r📥 ${progress}%`);
              lastProgress = progress;
            }
          }
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          process.stdout.write("\r    \r"); // Clear progress line
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {}); // Clean up on error
        reject(err);
      });
  });
}

/**
 * Run the binary with provided arguments
 */
async function runBinary() {
  try {
    const binaryPath = await ensureBinary();

    const child = spawn(binaryPath, process.argv.slice(2), {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      process.exit(code || 0);
    });

    child.on("error", (err) => {
      console.error("❌ Failed to start AI Curator:", err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("");
    console.error("Alternative installation methods:");
    console.error("  brew install elgap/tap/ai-curator");
    console.error(
      "  curl -fsSL https://raw.githubusercontent.com/elgap/ai-curator/main/install.sh | bash"
    );
    console.error("");
    console.error("For support: https://github.com/elgap/ai-curator/issues");
    process.exit(1);
  }
}

// Run
runBinary();
