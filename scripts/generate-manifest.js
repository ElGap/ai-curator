#!/usr/bin/env node
/**
 * AI Curator Manifest Generator
 * Creates latest.json manifest for version management and auto-updates
 *
 * Usage: node scripts/generate-manifest.js [version]
 * Example: node scripts/generate-manifest.js 0.5.0
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  blue: "\x1b[0;34m",
};

// Get version from arguments or package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const version = process.argv[2] || packageJson.version;
const releaseDir = path.join(__dirname, "..", "dist", `release-${version}`);

console.log(`${colors.blue}=== AI Curator Manifest Generator ===${colors.reset}`);
console.log(`${colors.blue}Version: ${version}${colors.reset}\n`);

// Check if release directory exists
if (!fs.existsSync(releaseDir)) {
  console.error(`${colors.red}Error: Release directory not found: ${releaseDir}${colors.reset}`);
  console.error(`${colors.yellow}Run ./scripts/package.sh first${colors.reset}`);
  process.exit(1);
}

// Calculate SHA256 hash
function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

// Get file size in bytes
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

// Generate manifest
function generateManifest() {
  const manifest = {
    version: version,
    channel: version.includes("beta") || version.includes("alpha") ? "prerelease" : "stable",
    published_at: new Date().toISOString(),
    release_notes_url: `https://github.com/elgap/ai-curator/releases/tag/v${version}`,
    platforms: {},
    npm: {
      version: version,
      dist_tag: version.includes("beta") ? "beta" : version.includes("alpha") ? "alpha" : "latest",
    },
    minimum_node_version: "18.0.0",
    deprecated: false,
    critical_security_update: false,
  };

  // Platform configurations
  const platforms = [
    { name: "darwin", arch: "arm64", binary: "curator-darwin-arm64" },
    { name: "linux", arch: "x64", binary: "curator-linux-x64" },
    { name: "linux", arch: "arm64", binary: "curator-linux-arm64" },
  ];

  // Process each platform
  for (const platform of platforms) {
    const baseName = `ai-curator-${version}-${platform.name}-${platform.arch}`;
    const tarGzPath = path.join(releaseDir, `${baseName}.tar.gz`);
    const zipPath = path.join(releaseDir, `${baseName}.zip`);

    // Initialize platform in manifest
    if (!manifest.platforms[platform.name]) {
      manifest.platforms[platform.name] = {};
    }

    manifest.platforms[platform.name][platform.arch] = {
      formats: {},
    };

    // Add tar.gz if exists
    if (fs.existsSync(tarGzPath)) {
      manifest.platforms[platform.name][platform.arch].formats["tar.gz"] = {
        url: `https://github.com/elgap/ai-curator/releases/download/v${version}/${baseName}.tar.gz`,
        checksum: `sha256:${calculateHash(tarGzPath)}`,
        size: getFileSize(tarGzPath),
      };
      console.log(
        `${colors.green}✓ Added ${platform.name}-${platform.arch} (.tar.gz)${colors.reset}`
      );
    }

    // Add zip if exists
    if (fs.existsSync(zipPath)) {
      manifest.platforms[platform.name][platform.arch].formats["zip"] = {
        url: `https://github.com/elgap/ai-curator/releases/download/v${version}/${baseName}.zip`,
        checksum: `sha256:${calculateHash(zipPath)}`,
        size: getFileSize(zipPath),
      };
      console.log(`${colors.green}✓ Added ${platform.name}-${platform.arch} (.zip)${colors.reset}`);
    }
  }

  return manifest;
}

// Generate platform-specific manifests
function generatePlatformManifest(platform, fullManifest) {
  if (!fullManifest.platforms[platform]) {
    return null;
  }

  return {
    version: fullManifest.version,
    channel: fullManifest.channel,
    published_at: fullManifest.published_at,
    platform: platform,
    architectures: Object.keys(fullManifest.platforms[platform]),
    downloads: fullManifest.platforms[platform],
  };
}

// Main execution
console.log(`${colors.blue}=== Generating Manifests ===${colors.reset}\n`);

// Generate main manifest
const manifest = generateManifest();
const manifestPath = path.join(releaseDir, "latest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\n${colors.green}✓ Created: latest.json${colors.reset}`);

// Generate platform-specific manifests
const platforms = ["darwin", "linux"];
for (const platform of platforms) {
  const platformManifest = generatePlatformManifest(platform, manifest);
  if (platformManifest) {
    const platformManifestPath = path.join(releaseDir, `latest-${platform}.json`);
    fs.writeFileSync(platformManifestPath, JSON.stringify(platformManifest, null, 2));
    console.log(`${colors.green}✓ Created: latest-${platform}.json${colors.reset}`);
  }
}

// Generate SHASUMS256.txt
console.log(`\n${colors.blue}=== Generating Checksums ===${colors.reset}\n`);

const shasumsPath = path.join(releaseDir, "SHASUMS256.txt");
let shasumsContent = "";

const archives = fs
  .readdirSync(releaseDir)
  .filter((f) => f.endsWith(".tar.gz") || f.endsWith(".zip"));
for (const archive of archives.sort()) {
  const archivePath = path.join(releaseDir, archive);
  const hash = calculateHash(archivePath);
  shasumsContent += `${hash}  ${archive}\n`;
  console.log(`${colors.yellow}  ${hash}  ${archive}${colors.reset}`);
}

fs.writeFileSync(shasumsPath, shasumsContent);
console.log(`\n${colors.green}✓ Created: SHASUMS256.txt${colors.reset}`);

// Summary
console.log(`\n${colors.blue}=== Manifest Summary ===${colors.reset}`);
console.log(`${colors.green}Version:${colors.reset} ${manifest.version}`);
console.log(`${colors.green}Channel:${colors.reset} ${manifest.channel}`);
console.log(
  `${colors.green}Platforms:${colors.reset} ${Object.keys(manifest.platforms).join(", ")}`
);
console.log(`${colors.green}Architectures:${colors.reset}`);
for (const [platform, archs] of Object.entries(manifest.platforms)) {
  console.log(`  - ${platform}: ${Object.keys(archs).join(", ")}`);
}
console.log(`\n${colors.green}✓ All manifests generated in: ${releaseDir}${colors.reset}`);

// Output file list
console.log(`\n${colors.blue}Generated files:${colors.reset}`);
const generatedFiles = fs
  .readdirSync(releaseDir)
  .filter((f) => f.endsWith(".json") || f === "SHASUMS256.txt");
for (const file of generatedFiles) {
  const filePath = path.join(releaseDir, file);
  const size = (fs.statSync(filePath).size / 1024).toFixed(2);
  console.log(`  - ${file} (${size} KB)`);
}
