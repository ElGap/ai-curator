#!/usr/bin/env -S npx tsx

import { spawn, exec } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";
import readline from "readline";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the package root directory
const packageRoot = path.join(__dirname, "..");

// Load .env file if it exists
const envFilePath = path.join(packageRoot, ".env");
if (fs.existsSync(envFilePath)) {
  const envContent = fs.readFileSync(envFilePath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  });
}

// Set default port to 3333 if not specified
const DEFAULT_PORT = "3333";
if (!process.env.AI_CURATOR_PORT) {
  process.env.AI_CURATOR_PORT = DEFAULT_PORT;
}

// Unified database path resolution (must match server/db/index.ts)
// For global npm: defaults to ~/.curator/curator.db (user home)
// For project-scoped: set AI_CURATOR_DATA_DIR=./data
const dataDir = process.env.AI_CURATOR_DATA_DIR
  ? path.resolve(process.env.AI_CURATOR_DATA_DIR)
  : path.join(os.homedir(), ".curator");
const dbPath = process.env.DATABASE_URL
  ? path.resolve(process.env.DATABASE_URL)
  : path.join(dataDir, "curator.db");

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Check for --no-browser or --browser flags (applies to default/server command)
const noBrowserFlag = args.includes("--no-browser");
const browserFlag = args.includes("--browser");

// Override environment variable if flag provided
if (noBrowserFlag) {
  process.env.AI_CURATOR_OPEN_BROWSER = "false";
} else if (browserFlag) {
  process.env.AI_CURATOR_OPEN_BROWSER = "true";
}

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created data directory: ${dataDir}`);
}

// Security: Validate file path to prevent path traversal attacks
function validateFilePath(inputPath, allowedDir) {
  if (!inputPath || typeof inputPath !== "string") {
    throw new Error("Invalid file path: path must be a non-empty string");
  }

  // Resolve to absolute paths
  const resolvedPath = path.resolve(inputPath);
  const resolvedAllowedDir = path.resolve(allowedDir || dataDir);

  // Check for path traversal - path must be within allowed directory
  if (!resolvedPath.startsWith(resolvedAllowedDir)) {
    throw new Error(
      `Path traversal detected: ${resolvedPath} is outside allowed directory ${resolvedAllowedDir}`
    );
  }

  // Check for suspicious characters that might indicate injection attempts
  const suspiciousPatterns = /[;&|`$(){}[\]\\]/;
  if (suspiciousPatterns.test(inputPath)) {
    throw new Error(`Invalid characters in file path: ${inputPath}`);
  }

  return resolvedPath;
}

// Security: Validate file size before reading (prevent DoS via large files)
function validateFileSize(filePath, maxSizeMB = 100) {
  const stats = fs.statSync(filePath);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (stats.size > maxSizeBytes) {
    throw new Error(
      `File too large: ${(stats.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum of ${maxSizeMB}MB`
    );
  }

  return stats;
}

// Handle CLI commands
async function main() {
  switch (command) {
    case "search":
      await handleSearch(args.slice(1));
      break;
    case "download":
      await handleDownload(args.slice(1));
      break;
    case "import":
      await handleImport(args.slice(1));
      break;
    case "export":
      await handleExport(args.slice(1));
      break;
    case "reset":
    case "clean":
      await handleReset(args.slice(1));
      break;
    case "clear":
      await handleClear(args.slice(1));
      break;
    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;
    default:
      // No command - start the server (default behavior)
      startServer();
  }
}

// Helper: Smart field detection for automatic import
class SmartFieldDetector {
  constructor() {
    // Field name synonyms (source → target)
    this.fieldMappings = {
      // Core fields
      instruction: ["instruction", "prompt", "input", "query", "question", "task"],
      output: ["output", "response", "answer", "completion", "result", "text"],
      input: ["input", "context", "background"],

      // Quality fields
      quality: ["quality", "rating", "score", "grade", "stars"],
      status: ["status", "state", "review_status", "approval"],
      category: ["category", "type", "tag", "domain", "subject"],

      // Metadata fields (go to metadata namespace)
      validation_errors: ["validation_errors", "errors", "validationIssues", "issues"],
      validation_warnings: ["validation_warnings", "warnings", "alerts", "notes"],
      source: ["source", "origin", "dataset", "import_source"],
    };

    // Status value mappings
    this.statusMappings = {
      needs_review: [
        "needs_review",
        "needs review",
        "pending_review",
        "review_needed",
        "under_review",
        "review",
      ],
      approved: ["approved", "verified", "validated", "accepted", "confirmed", "published"],
      draft: ["draft", "unreviewed", "new", "pending", "initial"],
      rejected: ["rejected", "invalid", "error", "declined", "failed"],
    };
  }

  // Detect schema from sample records
  detectSchema(records) {
    if (!records || records.length === 0) return null;

    const sample = records[0];
    const detectedFields = {};
    const unmappedFields = [];

    for (const [key, value] of Object.entries(sample)) {
      let mapped = false;

      // Check for __edukaai__ namespace (Extended Alpaca)
      if (key === "__edukaai__" && typeof value === "object") {
        detectedFields.edukaai_namespace = value;
        mapped = true;
        continue;
      }

      // Check core field mappings
      for (const [target, synonyms] of Object.entries(this.fieldMappings)) {
        if (synonyms.includes(key.toLowerCase())) {
          detectedFields[target] = key;
          mapped = true;
          break;
        }
      }

      if (!mapped) {
        unmappedFields.push(key);
      }
    }

    // Check for Extended Alpaca format in records
    if (sample.__edukaai__) {
      detectedFields.hasExtendedAlpaca = true;
    }

    return {
      fields: detectedFields,
      unmapped: unmappedFields,
      sampleKeys: Object.keys(sample),
    };
  }

  // Map status values
  mapStatus(value) {
    if (!value) return "draft";

    const normalized = value.toString().toLowerCase().replace(/[_-]/g, "_");

    for (const [target, synonyms] of Object.entries(this.statusMappings)) {
      if (synonyms.includes(normalized)) {
        return target;
      }
    }

    return "draft"; // Default
  }

  // Transform record to AI Curator format
  transformRecord(record, schema) {
    const transformed = {
      instruction: "",
      output: "",
      input: null,
      qualityRating: null, // Changed from 'quality' to match importer
      status: "draft",
      category: "general",
      metadata: {},
    };

    // Handle Extended Alpaca format
    if (record.__edukaai__) {
      const ext = record.__edukaai__;

      // Core fields
      transformed.instruction = record.instruction || record.prompt || "";
      transformed.output = record.output || record.response || record.completion || "";
      transformed.input = record.input || null;

      // Extended fields
      if (ext.quality !== undefined) transformed.qualityRating = Math.round(ext.quality);
      if (ext.status) transformed.status = this.mapStatus(ext.status);
      if (ext.category) transformed.category = ext.category;

      // Metadata
      if (ext.validation) {
        transformed.metadata.validation_errors = ext.validation.errors || [];
        transformed.metadata.validation_warnings = ext.validation.warnings || [];
      }
      if (ext.source) {
        transformed.metadata.source = ext.source;
      }

      // Preserve original extended data
      transformed.metadata.__original_edukaai__ = ext;

      return transformed;
    }

    // Standard field mapping
    if (schema.fields.instruction) {
      transformed.instruction = record[schema.fields.instruction] || "";
    }
    if (schema.fields.output) {
      transformed.output = record[schema.fields.output] || "";
    }
    if (schema.fields.input) {
      transformed.input = record[schema.fields.input] || null;
    }

    // Quality (round to integer)
    if (schema.fields.quality) {
      const rawQuality = record[schema.fields.quality];
      if (rawQuality !== undefined && rawQuality !== null) {
        transformed.qualityRating = Math.round(parseFloat(rawQuality));
        transformed.metadata.original_rating = rawQuality;
      }
    }

    // Status (map values)
    if (schema.fields.status) {
      transformed.status = this.mapStatus(record[schema.fields.status]);
      transformed.metadata.original_status = record[schema.fields.status];
    }

    // Category
    if (schema.fields.category) {
      transformed.category = record[schema.fields.category] || "general";
    }

    // Validation fields
    if (schema.fields.validation_errors) {
      transformed.metadata.validation_errors = record[schema.fields.validation_errors] || [];
    }
    if (schema.fields.validation_warnings) {
      transformed.metadata.validation_warnings = record[schema.fields.validation_warnings] || [];
    }

    // Store unmapped fields in metadata
    if (schema.unmapped && schema.unmapped.length > 0) {
      transformed.metadata.additional_fields = {};
      for (const key of schema.unmapped) {
        if (record[key] !== undefined) {
          transformed.metadata.additional_fields[key] = record[key];
        }
      }
    }

    // Auto-detect quality if not mapped but rating exists
    if (!transformed.qualityRating && record.rating) {
      transformed.qualityRating = Math.round(parseFloat(record.rating));
      transformed.metadata.original_rating = record.rating;
    }

    return transformed;
  }

  // Generate preview of transformations
  generatePreview(records, schema, count = 3) {
    const preview = [];

    for (let i = 0; i < Math.min(count, records.length); i++) {
      const original = records[i];
      const transformed = this.transformRecord(original, schema);

      preview.push({
        original: this.summarizeRecord(original),
        transformed: this.summarizeRecord(transformed),
      });
    }

    return preview;
  }

  summarizeRecord(record) {
    const summary = {};
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "string") {
        summary[key] = value.substring(0, 50) + (value.length > 50 ? "..." : "");
      } else if (Array.isArray(value)) {
        summary[key] = `[${value.length} items]`;
      } else if (typeof value === "object" && value !== null) {
        summary[key] = "{...}";
      } else {
        summary[key] = value;
      }
    }
    return summary;
  }
}

// Helper: Create dataset if name doesn't exist
async function createDatasetIfNotExists(name, options = {}) {
  const { getDb } = await import("../server/db/index.ts");
  const { datasets } = await import("../server/db/schema.ts");
  const { eq } = await import("drizzle-orm");

  const db = getDb();

  // Check if dataset with this name already exists
  const existing = await db.query.datasets.findFirst({
    where: eq(datasets.name, name),
  });

  if (existing) {
    throw new Error(
      `Dataset "${name}" already exists (ID: ${existing.id}).\n` +
        `Use --dataset ${existing.id} to import to existing dataset, ` +
        `or use a different name with --create-dataset.`
    );
  }

  // Create new dataset
  const result = await db
    .insert(datasets)
    .values({
      name: name,
      description:
        options.description ||
        `Dataset created via import on ${new Date().toISOString().split("T")[0]}`,
      isActive: 0, // Don't auto-activate
      isArchived: 0,
      defaultQuality: "medium",
      defaultCategory: options.category || "general",
      defaultAutoApprove: 0,
      goalSamples: options.goalSamples || 100,
      goalName: options.goal || "First Fine-Tuning",
      sampleCount: 0,
      approvedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  const newDatasetId = result[0].id;
  console.log(`✅ Created new dataset "${name}" (ID: ${newDatasetId})`);

  return newDatasetId;
}

// Helper: Clear all samples from dataset
async function clearDatasetSamples(datasetId, force = false) {
  const { getDb } = await import("../server/db/index.ts");
  const { datasets, samples } = await import("../server/db/schema.ts");
  const { eq } = await import("drizzle-orm");

  const db = getDb();

  // Get dataset info
  const dataset = await db.query.datasets.findFirst({
    where: eq(datasets.id, datasetId),
  });

  if (!dataset) {
    throw new Error(`Dataset ID ${datasetId} not found`);
  }

  // Count samples
  const sampleCount = await db
    .select({ count: sql`count(*)` })
    .from(samples)
    .where(eq(samples.datasetId, datasetId))
    .then((res) => res[0].count);

  if (sampleCount === 0) {
    console.log(`ℹ️  Dataset "${dataset.name}" has no samples to clear`);
    return { deleted: 0, datasetName: dataset.name };
  }

  // Show warning and ask for confirmation (unless --force)
  if (!force) {
    console.log("");
    console.log("⚠️  WARNING: Sample Deletion");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Dataset: "${dataset.name}" (ID: ${datasetId})`);
    console.log(`Samples to delete: ${sampleCount}`);
    console.log("");
    console.log("This will permanently delete all existing samples.");
    console.log("This action cannot be undone.");
    console.log("");

    const answer = await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question("Type 'clear' to proceed with deletion: ", (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase());
      });
    });

    if (answer !== "clear") {
      console.log("\n❌ Clear cancelled.");
      process.exit(0);
    }
  }

  // Perform deletion
  console.log(`\n🧹 Clearing ${sampleCount} samples from "${dataset.name}"...`);

  const { sql } = await import("drizzle-orm");
  const deleteResult = await db.delete(samples).where(eq(samples.datasetId, datasetId));

  // Reset counters
  await db
    .update(datasets)
    .set({
      sampleCount: 0,
      approvedCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(datasets.id, datasetId));

  console.log(`✅ Deleted ${deleteResult.changes} samples`);

  return {
    deleted: deleteResult.changes,
    datasetName: dataset.name,
  };
}

// Helper: Simple Y/n confirmation
async function confirmOperation(message) {
  const answer = await new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${message} [Y/n]: `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });

  return answer === "" || answer === "y" || answer === "yes";
}

async function handleImport(args) {
  try {
    // Check if file path provided
    if (args.length === 0 || args[0].startsWith("--")) {
      console.error("❌ Error: File path required");
      console.error("Usage: curator import <file> [options]");
      console.error("");
      console.error("Examples:");
      console.error("  curator import data.json");
      console.error("  curator import data.jsonl --dataset 3 --category coding");
      console.error("  curator import large-dataset.json --workers 8");
      process.exit(1);
    }

    const filePath = args[0];
    const options = parseImportOptions(args.slice(1));

    // Check file exists
    const fs = await import("fs");
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: File not found: ${filePath}`);
      process.exit(1);
    }

    let targetDatasetId = options.datasetId;

    // Handle dataset creation
    if (options.createDataset) {
      console.log(`📦 Creating dataset "${options.createDataset}"...`);

      try {
        targetDatasetId = await createDatasetIfNotExists(options.createDataset, {
          description: options.description,
          goal: options.goal,
          goalSamples: options.goalSamples,
          category: options.category,
        });
      } catch (error) {
        console.error(`❌ ${error.message}`);
        process.exit(1);
      }
    }

    // If no dataset specified and not creating, use active dataset
    if (!targetDatasetId) {
      const { getDb } = await import("../server/db/index.ts");
      const { datasets } = await import("../server/db/schema.ts");
      const { eq } = await import("drizzle-orm");

      const db = getDb();
      const activeDataset = await db.query.datasets.findFirst({
        where: eq(datasets.isActive, 1),
      });

      if (!activeDataset) {
        console.error("❌ No active dataset found.");
        console.error("   Use --dataset <id> or --create-dataset <name>");
        process.exit(1);
      }

      targetDatasetId = activeDataset.id;
      console.log(`📁 Using active dataset "${activeDataset.name}" (ID: ${targetDatasetId})`);
    }

    // Handle clearing existing samples
    if (options.clearExisting) {
      try {
        await clearDatasetSamples(targetDatasetId, options.force);
      } catch (error) {
        console.error(`❌ Clear failed: ${error.message}`);
        process.exit(1);
      }
    }

    // Handle smart import with field detection and transformation
    let processedFilePath = filePath;
    if (options.smart) {
      console.log("🔍 Smart Import Mode: Auto-detecting field mappings...");
      console.log("");

      try {
        // Security: Validate file path to prevent path traversal
        const validatedPath = validateFilePath(filePath, dataDir);

        // Security: Validate file size (max 100MB for import)
        const stats = validateFileSize(validatedPath, 100);
        console.log(`📄 File size: ${(stats.size / 1024).toFixed(1)} KB`);

        // Read and parse the file
        const fileContent = fs.readFileSync(validatedPath, "utf-8");
        let records = [];

        // Parse JSON or JSONL
        if (validatedPath.endsWith(".jsonl") || fileContent.trim().startsWith("{")) {
          // Try JSONL first
          const lines = fileContent.split("\n").filter((line) => line.trim());
          for (const line of lines) {
            try {
              const record = JSON.parse(line);
              if (Array.isArray(record)) {
                records = record;
                break;
              } else {
                records.push(record);
              }
            } catch (_e) {
              // Skip invalid lines in JSONL
            }
          }
        } else {
          // Standard JSON
          const parsed = JSON.parse(fileContent);
          records = Array.isArray(parsed) ? parsed : [parsed];
        }

        if (records.length === 0) {
          console.error("❌ No valid records found in file");
          process.exit(1);
        }

        console.log(`📊 Found ${records.length} records to process`);
        console.log("");

        // Detect schema
        const detector = new SmartFieldDetector();
        const schema = detector.detectSchema(records);

        if (!schema) {
          console.error("❌ Could not detect schema from records");
          process.exit(1);
        }

        // Display schema detection results
        console.log("🗺️  Field Mappings Detected:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        const mappedFields = Object.entries(schema.fields).filter(
          ([key]) => key !== "edukaai_namespace" && key !== "hasExtendedAlpaca"
        );

        if (mappedFields.length > 0) {
          mappedFields.forEach(([target, source]) => {
            console.log(`  ${source} → ${target}`);
          });
        } else {
          console.log("  (No field mappings detected)");
        }

        if (schema.hasExtendedAlpaca) {
          console.log("  ✓ Extended Alpaca format detected (with __edukaai__ namespace)");
        }

        if (schema.unmapped.length > 0) {
          console.log(`\n📦 Unmapped fields (stored in metadata): ${schema.unmapped.join(", ")}`);
        }
        console.log("");

        // Show preview
        const preview = detector.generatePreview(records, schema, 3);
        console.log("👁️  Preview of Transformations:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        preview.forEach((item, index) => {
          console.log(`\nRecord ${index + 1}:`);
          console.log(
            "  Original:   ",
            JSON.stringify(item.original, null, 2).replace(/\n/g, "\n    ")
          );
          console.log(
            "  Transformed:",
            JSON.stringify(item.transformed, null, 2).replace(/\n/g, "\n    ")
          );
        });
        console.log("");

        // Confirm unless --force is used
        if (!options.force) {
          const confirmed = await confirmOperation("Proceed with smart import?");
          if (!confirmed) {
            console.log("❌ Import cancelled");
            process.exit(0);
          }
        }

        // Transform all records
        console.log("🔄 Transforming records...");
        const transformedRecords = records.map((record) =>
          detector.transformRecord(record, schema)
        );

        // Write to temporary file
        const tempDir = path.join(dataDir, "temp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        processedFilePath = path.join(tempDir, `smart_import_${Date.now()}.json`);
        fs.writeFileSync(processedFilePath, JSON.stringify(transformedRecords, null, 2));

        console.log(`✓ Transformed ${transformedRecords.length} records`);
        console.log(`✓ Written to temporary file: ${processedFilePath}`);
        console.log("");

        // Clean up temp file after import
        options._tempFile = processedFilePath;
      } catch (error) {
        console.error(`❌ Smart import error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
      }
    }

    console.log("");
    console.log("📊 Import Configuration");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`File: ${processedFilePath}`);
    console.log(`Dataset: ${targetDatasetId}`);
    console.log(`Clear existing: ${options.clearExisting ? "Yes" : "No"}`);
    console.log(`Smart mode: ${options.smart ? "Yes" : "No"}`);
    console.log("");

    // Use unified import command
    const { importCommand } = await import("../server/cli/import-command.ts");

    const result = await importCommand({
      filePath: processedFilePath,
      datasetId: targetDatasetId,
      format: options.format,
      category: options.category,
      status: options.status,
      dryRun: options.dryRun,
      dataDir: dataDir,
    });

    // Clean up temp file if created during smart import
    if (options._tempFile && fs.existsSync(options._tempFile)) {
      try {
        // Security: Validate temp file path before deletion
        const tempDir = path.join(dataDir, "temp");
        const resolvedTempFile = path.resolve(options._tempFile);
        const resolvedTempDir = path.resolve(tempDir);

        // Only delete if the file is actually in the temp directory
        if (resolvedTempFile.startsWith(resolvedTempDir)) {
          fs.unlinkSync(options._tempFile);
          console.log(`🧹 Cleaned up temporary file`);
        } else {
          console.warn(`⚠️  Skipped cleanup of file outside temp directory: ${options._tempFile}`);
        }
      } catch (_e) {
        // Ignore cleanup errors
      }
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error(`❌ Import error: ${error.message}`);
    process.exit(1);
  }
}

async function handleExport(args) {
  // Check for help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Export Command Options:
  --dataset <id>           Source dataset ID (default: active dataset)
  --format <format>        Export format: alpaca, sharegpt, jsonl, csv, mlx, unsloth, trl (default: alpaca)
  --output <path>          Output file path (required)
  --filter <query>         Filter samples using query language
  --split <ratios>         Train/test/val split (e.g., "0.8,0.1,0.1" or "80-10-10")
  --no-stratify            Disable stratified splitting (maintain category proportions)
  --seed <n>               Random seed for reproducible splits
  --no-metadata            Exclude metadata from export
  --help                   Show this help

Formats:
  alpaca      Standard Alpaca format (instruction, input, output)
  sharegpt    ShareGPT conversation format (from: human/gpt/system)
  jsonl       JSON Lines format (one object per line)
  csv         CSV format with headers
  mlx         Apple MLX-LM chat format (messages with roles)
  unsloth     Unsloth format (text with ### Human/Assistant markers)
  trl         HuggingFace TRL format (prompt/completion pairs)

Filter Query Language:
  Simple comparisons:    status=approved
                         quality>=4
                         category=coding
  
  Combined with AND/OR:  status=approved AND quality>=4
                         category=coding OR category=algorithms
  
  Contains operator:     instruction~python
                         output~error

Examples:
  # Export all samples to Alpaca format
  curator export --output training.json

  # Export approved samples only
  curator export --filter "status=approved" --output approved.json

  # Export high quality coding samples
  curator export --filter "quality>=4 AND category=coding" --output coding.json

  # Export with train/test/val split
  curator export --split "0.8,0.1,0.1" --output dataset

  # Stratified split (maintains category proportions)
  curator export --split "80-10-10" --output dataset

  # Export to CSV
  curator export --format csv --output samples.csv

  # Reproducible split with seed
  curator export --split "0.7,0.15,0.15" --seed 42 --output dataset
`);
    process.exit(0);
  }

  const { ExportCommand } = await import("../server/cli/export.js");

  const options = {
    // dataDir defaults to ~/.curator via export.js resolveDatabasePath
  };

  // Parse options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--dataset":
        options.datasetId = parseInt(args[++i]);
        break;
      case "--format":
        options.format = args[++i];
        break;
      case "--output":
        options.output = args[++i];
        break;
      case "--filter":
        options.filter = args[++i];
        break;
      case "--split":
        options.split = args[++i];
        break;
      case "--no-stratify":
        options.stratify = false;
        break;
      case "--seed":
        options.seed = parseInt(args[++i]);
        break;
      case "--no-metadata":
        options.includeMetadata = false;
        break;
      default:
        if (arg.startsWith("--")) {
          console.warn(`⚠️  Unknown option: ${arg}`);
        }
    }
  }

  // Validate required output
  if (!options.output) {
    console.error("❌ Error: Output path required (--output <path>)");
    console.error("Usage: curator export --output training.json");
    process.exit(1);
  }

  const command = new ExportCommand(options);
  const result = await command.execute();
  process.exit(result.success ? 0 : 1);
}

function parseImportOptions(args) {
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--dataset":
        options.datasetId = parseInt(args[++i]);
        break;
      case "--format":
        options.format = args[++i];
        break;
      case "--workers":
        options.workers = parseInt(args[++i]);
        break;
      case "--chunk-size":
        options.chunkSize = parseInt(args[++i]);
        break;
      case "--resume":
        options.resume = true;
        break;
      case "--dedup":
        options.dedup = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--strict":
        options.strict = true;
        break;
      case "--category":
        options.category = args[++i];
        break;
      case "--status":
        options.status = args[++i];
        break;
      case "--create-dataset":
        options.createDataset = args[++i];
        break;
      case "--description":
        options.description = args[++i];
        break;
      case "--goal":
        options.goal = args[++i];
        break;
      case "--goal-samples":
        options.goalSamples = parseInt(args[++i]) || 100;
        break;
      case "--clear":
        options.clearExisting = true;
        break;
      case "--force":
        options.force = true;
        break;
      case "--smart":
        options.smart = true;
        break;
      case "--help":
      case "-h":
        console.log(`
📦 Import Command - Enhanced Options

Usage: curator import <file> [options]

FILE:
  <file>                   Path to file to import (JSON, JSONL, CSV)

DATASET TARGET (choose one):
  --dataset <id>           Import to existing dataset by ID
  --create-dataset <name>  Create new dataset and import (fails if exists)

NEW DATASET OPTIONS (use with --create-dataset):
  --description <text>     Dataset description (optional)
  --goal <text>           Goal name (default: "First Fine-Tuning")
  --goal-samples <n>      Target sample count (default: 100)

CLEAR OPTIONS:
  --clear                  Delete all existing samples before importing
  --force                  Skip confirmation prompt for --clear

IMPORT OPTIONS:
  --workers <n>           Parallel workers for large files (default: 4)
  --chunk-size <n>        Records per chunk (default: auto)
  --resume                Resume interrupted import
  --dedup                 Remove duplicates during import
  --dry-run               Preview without importing
  --strict                Skip invalid records
  --category <name>       Default category (default: general)
  --status <status>       Initial status: draft|review|approved
  --smart                 Auto-detect and map fields (Extended Alpaca support)

SMART IMPORT:
  Automatically detects field mappings and transforms data:
  • Maps: rating→quality, prompt→instruction, response→output
  • Supports Extended Alpaca format (__edukaai__ namespace)
  • Auto-converts status values (needs_review→review)
  • Preserves original values in metadata
  
  Examples:
    curator import data.json --smart
    curator import data.json --smart --create-dataset "Auto Imported"

EXAMPLES:

  # Import to existing dataset
  curator import data.json --dataset 3

  # Create new dataset and import
  curator import data.json --create-dataset "Python QA" --description "Python Q&A pairs"

  # Create with custom goal
  curator import data.json --create-dataset "API Docs" --goal "API Assistant" --goal-samples 500

  # Clear and replace all samples
  curator import new-data.json --dataset 3 --clear
  
  # Force clear without confirmation
  curator import new-data.json --dataset 3 --clear --force

  # Create and import with category
  curator import coding-data.jsonl --create-dataset "Code Samples" --category coding --status approved

VALIDATION:
  • --dataset and --create-dataset are mutually exclusive
  • --clear requires --dataset (cannot clear new dataset)
  • --create-dataset fails if dataset name already exists
  • --clear shows confirmation with sample count unless --force
`);
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          console.warn(`⚠️  Unknown option: ${arg}`);
        }
    }
  }

  // Validation: Cannot use both --dataset and --create-dataset
  if (options.datasetId && options.createDataset) {
    console.error("❌ Error: Cannot use both --dataset and --create-dataset.");
    console.error("   Use --dataset to import to existing, or --create-dataset to create new.");
    process.exit(1);
  }

  // Validation: --clear requires --dataset (cannot clear if creating new)
  if (options.clearExisting && options.createDataset) {
    console.error("❌ Error: Cannot use --clear with --create-dataset.");
    console.error("   New datasets have no samples to clear.");
    process.exit(1);
  }

  return options;
}

function showHelp() {
  console.log(`
🎨 AI Curator CLI

Usage: curator [command] [options]

Commands:
  curator                    Start the AI Curator server (default, opens browser)
  curator --no-browser       Start server without opening browser
  curator search <query>     Search Kaggle and Hugging Face datasets
  curator download <id>      Download and import from Kaggle/HF
  curator import <file>      Import dataset from file (JSON, JSONL, CSV)
  curator export [options]   Export dataset to file
  curator clear              Clear all samples from dataset (with confirmation)
  curator clear --force      Clear without confirmation
  curator reset              Reset database completely (creates fresh General dataset)
  curator reset --force      Reset without confirmation
  curator clean              Alias for reset
  curator help               Show this help message

Server Options:
  --no-browser             Start server without opening browser
  --browser                Start server and open browser (default behavior)

Search Options:
  --source <kaggle|hf>     Source to search: kaggle, hf, or all (default: all)
  --limit <n>              Number of results per source (default: 10)

Download Options:
  <dataset-id>             Format: kaggle:owner/name or hf:owner/name
  --dataset <id>           Target Curator dataset ID
  --category <name>        Default category
  --status <status>        Initial status: draft|review|approved
  --workers <n>            Number of parallel workers
  --no-import              Download only, skip import

Clear Options:
  --dataset <id>           Dataset ID to clear (default: active dataset)
  --force                  Clear without confirmation

Import Options:
  --dataset <id>           Target dataset ID (default: active dataset)
  --format <format>        File format: json, jsonl, csv (auto-detected if not specified)
  --dry-run                Preview import without saving
  --strict                 Skip invalid records (default: import with warnings)
  --category <name>        Default category for imported samples
  --status <status>        Initial status: draft|review|approved (default: draft)

Export Options:
  --dataset <id>           Source dataset ID (default: active dataset)
  --format <format>        Export format: alpaca, sharegpt, jsonl, csv, mlx, unsloth, trl (default: alpaca)
  --output <path>          Output file path (required)
  --filter <query>         Filter samples using query language
  --split <ratios>         Train/test/val split (e.g., "0.8,0.1,0.1")
  --no-stratify            Disable stratified splitting
  --seed <n>               Random seed for reproducible splits
  --no-metadata            Exclude metadata from export

Filter Query Language:
  Comparisons:    status=approved, quality>=4, category=coding
  Logical:        status=approved AND quality>=4
                  category=coding OR category=algorithms
  Contains:       instruction~python (contains "python")

Environment Variables:
  AI_CURATOR_PORT=3333              Server port (default: 3333)
  AI_CURATOR_HOST=localhost         Server host (default: localhost)
  AI_CURATOR_OPEN_BROWSER=true      Auto-open browser (default: true, set to false to disable)
  AI_CURATOR_DATA_DIR=~/.curator    Data directory

Examples:
  # Start server with default settings (opens browser automatically)
  curator

  # Search for datasets across Kaggle and Hugging Face
  curator search "python programming"
  curator search "medical qa" --source kaggle

  # Download from Kaggle and auto-import
  curator download kaggle:awsaf49/coco-2017-dataset

  # Download from Hugging Face
  curator download hf:openai/summarize_from_feedback

  # Import JSON file to active dataset
  curator import data.json --category coding

  # Import with dry run to preview
  curator import data.jsonl --dry-run

  # Import large dataset with parallel workers
  curator import large-dataset.json --workers 8 --chunk-size 5000

  # Resume interrupted import
  curator import large-dataset.json --resume

  # Export approved samples
  curator export --format alpaca --output training.json --filter "status=approved"

  # Export with stratified train/test/val split
  curator export --split "0.8,0.1,0.1" --output dataset

  # Export high quality samples only
  curator export --filter "quality>=4 AND status=approved" --output high-quality.json

  # Clear all samples from active dataset (confirmation required)
  curator clear

  # Clear specific dataset
  curator clear --dataset 2

  # Force clear without confirmation
  curator clear --force

  # Reset database (confirmation required)
  curator reset

  # Force reset without confirmation
  curator reset --force

For more information, visit: https://github.com/elgap/ai-curator
`);
}

async function handleSearch(args) {
  const { SearchCommand } = await import("../server/cli/search.js");

  const options = {
    query: args[0] || "",
    source: "all",
    limit: 10,
  };

  // Parse options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--source":
        options.source = args[++i];
        break;
      case "--limit":
        options.limit = parseInt(args[++i]) || 10;
        break;
      case "--help":
      case "-h":
        console.log(`
Search Command Options:
  <query>                  Search query (keywords)
  --source <kaggle|hf>     Source to search: kaggle, hf (huggingface), or all (default: all)
  --limit <n>              Number of results per source (default: 10)
  --help                   Show this help

Examples:
  curator search "python programming"
  curator search "medical qa" --source kaggle
  curator search "alpaca" --source hf --limit 20

Note: For Kaggle search, you need API credentials in ~/.kaggle/kaggle.json
      For Hugging Face search, it's public but authenticated searches get higher rate limits.
`);
        process.exit(0);
    }
  }

  const command = new SearchCommand(options);
  const result = await command.execute();
  process.exit(result.success ? 0 : 1);
}

async function handleDownload(args) {
  // Check for help first
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Download Command Options:
  <dataset-id>             Dataset ID in format: kaggle:owner/name or hf:owner/name
  --dataset <id>           Target AI Curator dataset ID (default: active dataset)
  --category <name>        Default category for imported samples
  --status <status>        Initial status: draft|review|approved (default: draft)
  --workers <n>            Number of import workers (default: 4)
  --no-import              Download only, don't import
  --output <path>          Custom download directory
  --help                   Show this help

Examples:
  # Download from Kaggle and auto-import
  curator download kaggle:awsaf49/coco-2017-dataset

  # Download from Hugging Face
  curator download hf:tiiuae/falcon-refinedweb

  # Download and import to specific dataset
  curator download kaggle:competitions/feedback-prize-2023 --dataset 3

  # Download without importing
  curator download hf:openai/summarize_from_feedback --no-import --output ./downloads
`);
    process.exit(0);
  }

  if (args.length === 0 || args[0].startsWith("--")) {
    console.error("❌ Error: Dataset ID required");
    console.error("Usage: curator download <kaggle:owner/name|hf:owner/name> [options]");
    console.error("");
    console.error("Examples:");
    console.error("  curator download kaggle:awsaf49/coco-2017-dataset");
    console.error("  curator download hf:openai/summarize_from_feedback");
    console.error("  curator download hf:tiiuae/falcon-refinedweb --dataset 3");
    process.exit(1);
  }

  const { DownloadCommand } = await import("../server/cli/download.js");

  const options = {
    datasetId: args[0],
    autoImport: true,
    workers: 4,
    dataDir: dataDir, // Pass unified dataDir
  };

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--dataset":
        options.targetDatasetId = args[++i];
        break;
      case "--category":
        options.category = args[++i];
        break;
      case "--status":
        options.status = args[++i];
        break;
      case "--workers":
        options.workers = parseInt(args[++i]) || 4;
        break;
      case "--no-import":
        options.autoImport = false;
        break;
      case "--output":
        options.outputDir = args[++i];
        break;
      // Help is handled at the beginning of the function
    }
  }

  const command = new DownloadCommand(options);
  const result = await command.execute();
  process.exit(result.success ? 0 : 1);
}

async function handleReset(args) {
  const force = args.includes("--force") || args.includes("-f");

  console.log("⚠️  Database Reset");
  console.log("==================\n");
  console.log("This will delete ALL data including:");
  console.log("  - All training samples");
  console.log("  - All datasets");
  console.log("  - All import history");
  console.log("\nTwo fresh datasets will be created:\n");
  console.log("  📡 Live Capture Inbox (ID: 1)");
  console.log("     → For capturing conversations & code from your workflow");
  console.log("     → Disabled by default, enable in Settings when ready\n");
  console.log("  🎓 EdukaAI Starter Pack (ID: 2) [ACTIVE]");
  console.log("     → 75 premium football training samples pre-loaded");
  console.log("     → Ready for immediate 5-minute fine-tuning\n");

  if (!force) {
    console.log("Are you sure you want to continue? (yes/no)");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question("Type 'yes' to proceed: ", (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase());
      });
    });

    if (answer !== "yes") {
      console.log("\n❌ Reset cancelled.");
      process.exit(0);
    }
  }

  console.log("\n🧹 Resetting database...\n");

  try {
    // Runtime-aware SQLite: uses bun:sqlite under Bun, better-sqlite3 under Node.js
    const _sqliteModName =
      typeof Bun !== "undefined"
        ? [98, 117, 110, 58, 115, 113, 108, 105, 116, 101]
            .map((c) => String.fromCharCode(c))
            .join("")
        : "better-sqlite3";
    const mod = await import(_sqliteModName);
    const Database = mod.default || mod.Database;
    const db = new Database(dbPath);

    // Clean slate: Create complete schema if tables don't exist
    db.exec(`
      -- Core tables
      CREATE TABLE IF NOT EXISTS samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset_id INTEGER,
        dataset_name TEXT,
        instruction TEXT NOT NULL,
        input TEXT,
        output TEXT NOT NULL,
        system_prompt TEXT,
        category TEXT DEFAULT 'general',
        difficulty TEXT DEFAULT 'intermediate',
        quality_rating INTEGER DEFAULT 3,
        notes TEXT,
        tags TEXT,
        source TEXT DEFAULT 'manual',
        model TEXT,
        session_id TEXT,
        message_id TEXT,
        tokens_in INTEGER,
        tokens_out INTEGER,
        cost REAL,
        tools_used TEXT,
        temperature REAL,
        top_p REAL,
        top_k INTEGER,
        max_tokens INTEGER,
        frequency_penalty REAL,
        presence_penalty REAL,
        stop_sequences TEXT,
        seed INTEGER,
        context TEXT,
        metadata TEXT,
        status TEXT DEFAULT 'draft',
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );

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

      CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        website TEXT,
        documentation TEXT,
        supports_sessions INTEGER DEFAULT 0,
        supports_realtime INTEGER DEFAULT 0,
        supports_batching INTEGER DEFAULT 1,
        supports_context INTEGER DEFAULT 0,
        is_enabled INTEGER DEFAULT 1,
        is_official INTEGER DEFAULT 0,
        total_captures INTEGER DEFAULT 0,
        last_capture_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS import_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        file_path TEXT,
        date_from INTEGER,
        date_to INTEGER,
        total_entries INTEGER DEFAULT 0,
        imported_count INTEGER DEFAULT 0,
        skipped_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );

      CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        target_count INTEGER NOT NULL,
        achieved_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        default_goal_samples INTEGER DEFAULT 100,
        default_auto_approve INTEGER DEFAULT 0,
        theme TEXT DEFAULT 'system',
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );

      CREATE TABLE IF NOT EXISTS capture_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        default_dataset_id INTEGER DEFAULT 1,
        default_dataset_name TEXT DEFAULT 'General',
        default_status TEXT DEFAULT 'draft',
        default_quality INTEGER DEFAULT 3,
        is_enabled INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );

      CREATE TABLE IF NOT EXISTS analytics_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset_id INTEGER NOT NULL,
        total_samples INTEGER DEFAULT 0,
        approved_count INTEGER DEFAULT 0,
        draft_count INTEGER DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        rejected_count INTEGER DEFAULT 0,
        avg_quality REAL DEFAULT 0,
        median_quality REAL DEFAULT 0,
        quality_std_dev REAL DEFAULT 0,
        avg_instruction_length INTEGER DEFAULT 0,
        avg_output_length INTEGER DEFAULT 0,
        median_instruction_length INTEGER DEFAULT 0,
        median_output_length INTEGER DEFAULT 0,
        category_distribution TEXT DEFAULT '{}',
        quality_distribution TEXT DEFAULT '{}',
        difficulty_distribution TEXT DEFAULT '{}',
        computed_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      );

      CREATE TABLE IF NOT EXISTS export_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset_id INTEGER NOT NULL,
        format TEXT NOT NULL,
        sample_count INTEGER DEFAULT 0,
        file_path TEXT,
        file_size INTEGER DEFAULT 0,
        filter_query TEXT,
        split_ratios TEXT,
        exported_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        source TEXT DEFAULT 'cli'
      );

      CREATE INDEX IF NOT EXISTS idx_samples_dataset_id ON samples(dataset_id);
      CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
      CREATE INDEX IF NOT EXISTS idx_samples_category ON samples(category);
      CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_dataset_id ON analytics_snapshots(dataset_id);
      CREATE INDEX IF NOT EXISTS idx_export_logs_dataset_id ON export_logs(dataset_id);
    `);

    // Get current counts before clearing
    const sampleCountResult = db.prepare("SELECT COUNT(*) as count FROM samples").get();
    const datasetCountResult = db.prepare("SELECT COUNT(*) as count FROM datasets").get();
    const sampleCount = sampleCountResult ? sampleCountResult.count : 0;
    const datasetCount = datasetCountResult ? datasetCountResult.count : 0;

    console.log(`📊 Current state:`);
    console.log(`   Samples: ${sampleCount}`);
    console.log(`   Datasets: ${datasetCount}\n`);

    // Disable foreign keys temporarily to allow clearing tables with FK relationships
    db.pragma("foreign_keys = OFF");

    // Clear all data from tables (but keep the tables)
    db.prepare("DELETE FROM samples").run();
    db.prepare("DELETE FROM datasets").run();
    db.prepare("DELETE FROM import_sessions").run();
    db.prepare("DELETE FROM milestones").run();
    db.prepare("DELETE FROM settings").run();
    db.prepare("DELETE FROM export_logs").run();
    db.prepare("DELETE FROM analytics_snapshots").run();

    // Re-enable foreign keys
    db.pragma("foreign_keys = ON");

    // Reset auto-increment sequences
    try {
      db.prepare(
        "DELETE FROM sqlite_sequence WHERE name IN ('samples', 'datasets', 'import_sessions', 'milestones', 'settings')"
      ).run();
    } catch (_e) {
      // sqlite_sequence might not have entries yet
    }

    // Insert seed data - TWO datasets for optimal UX

    // Dataset 1: Live Capture Inbox (for live capture, disabled by default)
    const insertLiveCaptureSql = `
      INSERT INTO datasets (
        id, name, description, is_active, is_archived, default_quality, default_category, 
        default_auto_approve, goal_samples, goal_name, sample_count, approved_count,
        created_at, updated_at
      )
      VALUES (
        1, '📡 Live Capture Inbox', 'Your personal data collection inbox. Captures conversations, code snippets, and any text you want to train your AI on. Perfect for building custom datasets from your daily workflow. Live capture is disabled by default—enable it in Settings when ready.', 
        0, 0, 'medium', 'captured', 
        0, 500, 'Personal AI Assistant', 0, 0,
        (strftime('%s', 'now') * 1000),
        (strftime('%s', 'now') * 1000)
      )
    `;
    db.prepare(insertLiveCaptureSql).run();

    // Dataset 2: EdukaAI Starter Pack (pre-loaded, active by default)
    const insertStarterPackSql = `
      INSERT INTO datasets (
        id, name, description, is_active, is_archived, default_quality, default_category, 
        default_auto_approve, goal_samples, goal_name, sample_count, approved_count,
        created_at, updated_at
      )
      VALUES (
        2, '🎓 EdukaAI Starter Pack', 'A curated collection of 75 premium football training samples designed for quick 5-minute fine-tuning. Features immersive player interviews, tactical analysis, and fan perspectives from the Kingston United vs. Newport County thriller. Perfect for your first LLM training experience!', 
        1, 0, 'high', 'football', 
        0, 75, '🚀 First Fine-Tuning (Ready!)', 0, 0,
        (strftime('%s', 'now') * 1000),
        (strftime('%s', 'now') * 1000)
      )
    `;
    db.prepare(insertStarterPackSql).run();

    // Default sources
    db.prepare(
      `
      INSERT OR REPLACE INTO sources (key, name, description, icon, color, is_official, is_enabled, supports_batching, supports_context)
      VALUES 
        ('manual', 'Manual (Web UI)', 'Samples created manually through the web interface', 'mouse-pointer', '#6b7280', 1, 1, 0, 0),
        ('json', 'JSON Import', 'Samples imported from JSON files', 'file-json', '#3b82f6', 1, 1, 1, 0),
        ('csv', 'CSV Import', 'Samples imported from CSV files', 'table', '#22c55e', 1, 1, 1, 0),
        ('opencode', 'OpenCode', 'Live capture from OpenCode CLI conversations', 'terminal', '#8b5cf6', 1, 1, 1, 1)
    `
    ).run();

    // Capture settings - DISABLED by default, pointing to Live Capture Inbox
    db.prepare(
      `
      INSERT OR REPLACE INTO capture_settings (id, default_dataset_id, default_dataset_name, default_status, default_quality, is_enabled)
      VALUES (1, 1, '📡 Live Capture Inbox', 'draft', 3, 0)
    `
    ).run();

    // User settings
    db.prepare(
      `
      INSERT OR REPLACE INTO user_settings (id, default_goal_samples, default_auto_approve, theme)
      VALUES (1, 100, 0, 'system')
    `
    ).run();

    // First-run auto-import: Load EdukaAI Starter Pack samples if available
    // Skip if AI_CURATOR_SKIP_AUTO_IMPORT is set (e.g., during tests)
    if (!process.env.AI_CURATOR_SKIP_AUTO_IMPORT) {
      try {
        const starterPackPath = path.join(packageRoot, "datasets", "starter-pack", "samples.json");
        const metadataPath = path.join(packageRoot, "datasets", "starter-pack", "metadata.json");

        if (fs.existsSync(starterPackPath) && fs.existsSync(metadataPath)) {
          console.log("\n📦 Loading EdukaAI Starter Pack...");

          const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
          const samples = JSON.parse(fs.readFileSync(starterPackPath, "utf-8"));

          if (Array.isArray(samples) && samples.length > 0) {
            const insertSample = db.prepare(`
              INSERT INTO samples (
                dataset_id, dataset_name, instruction, input, output, system_prompt,
                category, difficulty, quality_rating, source, status, context, metadata,
                created_at, updated_at
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, 'starter_pack', 'approved', ?, ?,
                (strftime('%s', 'now') * 1000), (strftime('%s', 'now') * 1000)
              )
            `);

            let importedCount = 0;
            for (const sample of samples) {
              try {
                insertSample.run(
                  metadata.dataset_id || 2,
                  metadata.dataset_name || "🎓 EdukaAI Starter Pack",
                  sample.instruction || "",
                  sample.input || "",
                  sample.output || "",
                  sample.system_prompt || sample.system || "",
                  sample.category || metadata.default_category || "football",
                  sample.difficulty || "intermediate",
                  sample.quality_rating || 4,
                  JSON.stringify(sample.context || {}),
                  JSON.stringify(sample.metadata || {})
                );
                importedCount++;
              } catch (_e) {
                // Skip invalid samples
              }
            }

            // Update dataset counts
            db.prepare(
              `
              UPDATE datasets 
              SET sample_count = ?, approved_count = ?, updated_at = (strftime('%s', 'now') * 1000)
              WHERE id = ?
            `
            ).run(importedCount, importedCount, metadata.dataset_id || 2);

            if (importedCount > 0) {
              console.log(`✅ Loaded ${importedCount} premium samples into Starter Pack`);
            }
          }
        }
      } catch (_e) {
        // Silent fail - starter pack is optional
      }
    }

    db.close();

    console.log("✅ Database reset complete!");
    console.log(`   Deleted ${sampleCount} samples`);
    console.log(`   Deleted ${datasetCount} datasets`);
    console.log(`   Created '📡 Live Capture Inbox' (ID: 1) - Ready for your data`);
    console.log(`   Created '🎓 EdukaAI Starter Pack' (ID: 2) - Active, ready for training`);
    console.log(`   📚 75 premium samples loaded and ready to train!`);
    console.log(`   Live capture: DISABLED by default\n`);

    console.log("💡 Quick start options:");
    console.log("   1. 🚀 Start training immediately (5 min):");
    console.log("      curator export --dataset 2 --format mlx --output train.jsonl");
    console.log("   2. Browse samples in UI: curator");
    console.log("   3. Enable live capture: curator → Settings → Live Capture");
  } catch (error) {
    console.error(`\n❌ Error resetting database: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  return addresses;
}

function openBrowser(url) {
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";

  try {
    exec(`${cmd} ${url}`, (error) => {
      if (error) {
        console.log(`⚠️  Could not open browser automatically. Please visit: ${url}`);
      } else {
        console.log(`✅ Opened browser at ${url}`);
      }
    });
  } catch (_error) {
    console.log(`⚠️  Could not open browser automatically. Please visit: ${url}`);
  }
}

function startServer() {
  // Check if we're in development or production
  const isDev =
    process.env.NODE_ENV === "development" || !fs.existsSync(path.join(packageRoot, ".output"));

  const port = process.env.AI_CURATOR_PORT || "3333";
  const host = process.env.AI_CURATOR_HOST || "localhost";
  const shouldOpenBrowser = process.env.AI_CURATOR_OPEN_BROWSER !== "false"; // Default to true
  const networkIps = getNetworkInterfaces();

  console.log("🎓 edukaAI Starting...");
  console.log(`📊 Database: ${dbPath}`);
  console.log(`📂 Package root: ${packageRoot}`);
  console.log(`🌐 Port: ${port}`);

  // Show IP addresses
  if (host === "0.0.0.0" || host === "::") {
    console.log(`🌍 Listening on all interfaces:`);
    console.log(`   • Local: http://localhost:${port}`);
    console.log(`   • Local: http://127.0.0.1:${port}`);
    networkIps.forEach((ip) => {
      console.log(`   • Network: http://${ip}:${port}`);
    });
  } else {
    console.log(`🌐 Host: ${host}`);
    console.log(`🔗 Local URL: http://${host}:${port}`);
  }

  console.log("⏳ Initializing server...\n");

  // Open browser after a short delay to ensure server is starting
  if (shouldOpenBrowser) {
    const url = `http://${host === "0.0.0.0" || host === "::" ? "localhost" : host}:${port}`;
    setTimeout(() => {
      openBrowser(url);
    }, 2000); // Wait 2 seconds for server to start
  }

  if (isDev) {
    // Development mode - use nuxt dev with explicit port flag
    const nuxt = spawn("npx", ["nuxt", "dev", "--port", port], {
      stdio: "inherit",
      cwd: packageRoot,
      env: {
        ...process.env,
        DATABASE_URL: dbPath,
        NUXT_HOST: host,
      },
    });

    nuxt.on("close", (code) => {
      process.exit(code);
    });
  } else {
    // Production mode - use built output
    const outputPath = path.join(packageRoot, ".output/server/index.mjs");

    if (!fs.existsSync(outputPath)) {
      console.error("❌ Error: Built output not found. Please run: npm run build");
      console.error("   Or use development mode: NODE_ENV=development curator");
      process.exit(1);
    }

    const server = spawn("node", [outputPath], {
      stdio: "inherit",
      cwd: packageRoot,
      env: {
        ...process.env,
        DATABASE_URL: dbPath,
        PORT: port,
        HOST: host,
        NODE_ENV: "production",
      },
    });

    server.on("close", (code) => {
      process.exit(code);
    });
  }
}

// Run main
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function handleClear(args) {
  // Check for help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Clear Command Options:
  --dataset <id>           Dataset ID to clear (default: active dataset)
  --force                  Clear without confirmation
  --data-dir <path>        Custom data directory
  --help                   Show this help

Examples:
  # Clear active dataset (prompts for confirmation)
  curator clear

  # Clear specific dataset
  curator clear --dataset 2

  # Clear without confirmation (use with caution!)
  curator clear --force

  # Clear with custom data directory
  curator clear --data-dir ./my-data
`);
    process.exit(0);
  }

  const options = {
    datasetId: undefined,
    dataDir: dataDir,
    force: false,
  };

  // Parse options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--dataset":
        options.datasetId = parseInt(args[++i]);
        break;
      case "--force":
        options.force = true;
        break;
      case "--data-dir":
        options.dataDir = args[++i];
        break;
    }
  }

  const { clearCommand } = await import("../server/cli/clear.ts");
  const result = await clearCommand(options);

  if (!result.success) {
    console.error(`\n❌ ${result.error || "Clear failed"}`);
    process.exit(1);
  }

  process.exit(0);
}
