// server/cli/export.js
// Export command with query language and smart splitting

import { join, resolve } from "path";
import { writeFileSync } from "fs";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Unified database path resolution (must match bin/cli.js and server/db/index.ts)
// For global npm: defaults to ~/.curator/curator.db (user home)
// For project-scoped: set AI_CURATOR_DATA_DIR=./data
function resolveDatabasePath(dataDir) {
  // Check DATABASE_URL environment variable first (used by tests)
  if (process.env.DATABASE_URL) {
    return resolve(process.env.DATABASE_URL);
  }
  if (dataDir) {
    return join(resolve(dataDir), "curator.db");
  }
  // Default to ~/.curator for global npm consistency
  return join(os.homedir(), ".curator", "curator.db");
}

// Query parser for filter syntax
// Supports: status=approved AND quality>3 OR category=coding
export class QueryParser {
  constructor() {
    this.operators = {
      "=": (a, b) => a === b,
      "!=": (a, b) => a !== b,
      ">": (a, b) => a > b,
      "<": (a, b) => a < b,
      ">=": (a, b) => a >= b,
      "<=": (a, b) => a <= b,
      "~": (a, b) => (a || "").toLowerCase().includes((b || "").toLowerCase()), // contains
    };
  }

  parse(query) {
    if (!query || query.trim() === "") {
      return null;
    }

    // Tokenize
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return null;

    // Parse into AST
    return this.parseExpression(tokens);
  }

  tokenize(query) {
    const tokens = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = null;

    for (let i = 0; i < query.length; i++) {
      const char = query[i];

      if (char === '"' || char === "'") {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
          if (current.trim()) {
            tokens.push(current.trim());
            current = "";
          }
        } else if (quoteChar === char) {
          inQuotes = false;
          tokens.push(current);
          current = "";
          quoteChar = null;
        } else {
          current += char;
        }
        continue;
      }

      if (!inQuotes && /\s/.test(char)) {
        if (current.trim()) {
          tokens.push(current.trim());
          current = "";
        }
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      tokens.push(current.trim());
    }

    return tokens;
  }

  parseExpression(tokens) {
    // Simple recursive descent parser
    // Supports: field OP value [AND|OR] ...

    const conditions = [];
    let i = 0;
    let currentOp = "AND";

    while (i < tokens.length) {
      const token = tokens[i];

      if (token.toUpperCase() === "AND" || token.toUpperCase() === "OR") {
        currentOp = token.toUpperCase();
        i++;
        continue;
      }

      // Look for operator
      let op = null;
      let opIndex = -1;

      for (const operator of [">=", "<=", "!=", "=", ">", "<", "~"]) {
        const idx = token.indexOf(operator);
        if (idx !== -1) {
          op = operator;
          opIndex = idx;
          break;
        }
      }

      if (op && opIndex !== -1) {
        const field = token.substring(0, opIndex).trim();
        const value = token.substring(opIndex + op.length).trim();

        conditions.push({
          field,
          operator: op,
          value: this.parseValue(value),
          logicOp: conditions.length > 0 ? currentOp : "AND",
        });
      }

      i++;
    }

    return conditions;
  }

  parseValue(value) {
    // Try to parse as number
    const num = parseFloat(value);
    if (!isNaN(num) && !isNaN(parseFloat(value))) {
      return num;
    }

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }

    return value;
  }

  evaluate(conditions, sample) {
    if (!conditions || conditions.length === 0) return true;

    let result = true;

    for (const condition of conditions) {
      const sampleValue = sample[condition.field];
      const conditionResult = this.operators[condition.operator](sampleValue, condition.value);

      if (condition.logicOp === "OR") {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }

    return result;
  }
}

export class ExportCommand {
  constructor(options = {}) {
    this.options = {
      datasetId: options.datasetId || null,
      format: options.format || "alpaca",
      output: options.output || null,
      filter: options.filter || null,
      split: options.split || null,
      stratify: options.stratify !== false, // default true
      seed: options.seed || null,
      includeMetadata: options.includeMetadata !== false,
      dataDir: options.dataDir, // Don't default here - resolve in execute()
      ...options,
    };

    this.queryParser = new QueryParser();
    this.db = null;
  }

  async execute() {
    console.log("📤 Exporting dataset...\n");

    try {
      // Connect to database using unified path resolution
      const dbPath = resolveDatabasePath(this.options.dataDir);
      this.db = new Database(dbPath);

      // Get dataset info
      const dataset = this.getDataset();
      console.log(`📊 Dataset: ${dataset.name} (ID: ${dataset.id})`);
      console.log(`📋 Format: ${this.options.format}`);

      // Fetch samples
      let samples = this.fetchSamples(dataset.id);
      console.log(`📈 Total samples: ${samples.length}`);

      // Apply filter if provided
      if (this.options.filter) {
        const conditions = this.queryParser.parse(this.options.filter);
        if (conditions) {
          samples = samples.filter((s) => this.queryParser.evaluate(conditions, s));
          console.log(`🔍 After filter: ${samples.length} samples`);
        }
      }

      if (samples.length === 0) {
        console.error("❌ No samples match the filter criteria");
        return { success: false, error: "No samples match filters" };
      }

      // Handle splitting
      let result;
      if (this.options.split) {
        result = await this.exportWithSplit(samples, dataset);
      } else {
        result = await this.exportSingle(samples, dataset);
      }

      // Summary
      console.log("\n" + "=".repeat(60));
      console.log("✅ Export complete!");
      console.log(`   Format: ${this.options.format}`);
      console.log(`   Samples: ${samples.length.toLocaleString()}`);

      if (this.options.split) {
        console.log(`   Split: ${this.options.split}`);
        Object.entries(result.files).forEach(([split, file]) => {
          console.log(`   - ${split}: ${file.count} samples → ${file.path}`);
        });
      } else {
        console.log(`   Output: ${result.path}`);
      }
      console.log("=".repeat(60));

      return {
        success: true,
        format: this.options.format,
        samples: samples.length,
        ...result,
      };
    } catch (error) {
      console.error(`\n❌ Export failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }

  getDataset() {
    let dataset;

    if (this.options.datasetId) {
      dataset = this.db.prepare("SELECT * FROM datasets WHERE id = ?").get(this.options.datasetId);
    } else {
      dataset = this.db.prepare("SELECT * FROM datasets WHERE is_active = 1").get();
    }

    if (!dataset) {
      throw new Error("No dataset found");
    }

    return dataset;
  }

  fetchSamples(datasetId) {
    const rows = this.db
      .prepare(
        `SELECT 
          s.*,
          datetime(s.created_at, 'unixepoch') as created_at_formatted
         FROM samples s
         WHERE s.dataset_id = ?
         ORDER BY s.id`
      )
      .all(datasetId);

    return rows.map((row) => ({
      ...row,
      createdAt: row.created_at,
      qualityRating: row.quality_rating,
      systemPrompt: row.system_prompt,
    }));
  }

  async exportWithSplit(samples, dataset) {
    const ratios = this.parseSplitRatios(this.options.split);

    // Stratified split if enabled
    let splits;
    if (this.options.stratify) {
      splits = this.stratifiedSplit(samples, ratios);
    } else {
      splits = this.randomSplit(samples, ratios);
    }

    // Generate output paths
    const basePath = this.getOutputPath(dataset);
    const extension = this.getFileExtension();

    const files = {};

    for (const [splitName, splitSamples] of Object.entries(splits)) {
      const data = this.formatSamples(splitSamples);
      const path = this.appendToFilename(basePath, `_${splitName}`, extension);

      writeFileSync(path, this.serialize(data));

      files[splitName] = {
        path,
        count: splitSamples.length,
      };
    }

    return { files };
  }

  async exportSingle(samples, dataset) {
    const data = this.formatSamples(samples);
    const path = this.getOutputPath(dataset) + "." + this.getFileExtension();

    writeFileSync(path, this.serialize(data));

    return { path, count: samples.length };
  }

  parseSplitRatios(splitStr) {
    // Parse "0.8,0.1,0.1" or "80-10-10" or "80,10,10"
    let ratios;

    if (splitStr.includes("-")) {
      ratios = splitStr.split("-").map(Number);
    } else if (splitStr.includes(",")) {
      ratios = splitStr.split(",").map(Number);
    } else {
      throw new Error("Invalid split format. Use '0.8,0.1,0.1' or '80-10-10'");
    }

    // Normalize if percentages (sum > 1)
    const sum = ratios.reduce((a, b) => a + b, 0);
    if (sum > 1) {
      ratios = ratios.map((r) => r / 100);
    }

    // Create named splits
    const names = ["train", "test", "val"];
    const result = {};

    ratios.forEach((ratio, i) => {
      if (i < names.length && ratio > 0) {
        result[names[i]] = ratio;
      }
    });

    return result;
  }

  randomSplit(samples, ratios) {
    // Set random seed if provided
    const seed = this.options.seed || Date.now();
    const rng = this.createSeededRandom(seed);

    // Shuffle
    const shuffled = [...samples].sort(() => rng() - 0.5);

    const total = shuffled.length;
    const splits = {};
    let start = 0;

    for (const [name, ratio] of Object.entries(ratios)) {
      const count = Math.floor(total * ratio);
      splits[name] = shuffled.slice(start, start + count);
      start += count;
    }

    // Add remaining to last split
    const lastKey = Object.keys(ratios).pop();
    if (start < total) {
      splits[lastKey] = [...splits[lastKey], ...shuffled.slice(start)];
    }

    return splits;
  }

  stratifiedSplit(samples, ratios) {
    // Group by category
    const byCategory = {};
    samples.forEach((s) => {
      const cat = s.category || "general";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(s);
    });

    // Split each category
    const splits = {};
    const splitNames = Object.keys(ratios);

    splitNames.forEach((name) => {
      splits[name] = [];
    });

    for (const category of Object.keys(byCategory)) {
      const catSamples = byCategory[category];
      const catSplits = this.randomSplit(catSamples, ratios);

      for (const [name, splitSamples] of Object.entries(catSplits)) {
        splits[name].push(...splitSamples);
      }
    }

    // Shuffle each split to mix categories
    const seed = this.options.seed || Date.now();
    const rng = this.createSeededRandom(seed);

    for (const name of splitNames) {
      splits[name] = splits[name].sort(() => rng() - 0.5);
    }

    return splits;
  }

  createSeededRandom(seed) {
    // Simple seeded random number generator
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  formatSamples(samples) {
    switch (this.options.format) {
      case "alpaca":
        return samples.map((s) => ({
          instruction: s.instruction,
          input: s.input || "",
          output: s.output,
          system: s.systemPrompt || undefined,
        }));

      case "sharegpt":
        return samples.map((s) => {
          const conversations = [
            { from: "human", value: s.instruction },
            { from: "gpt", value: s.output },
          ];
          if (s.systemPrompt) {
            conversations.unshift({ from: "system", value: s.systemPrompt });
          }
          return { conversations };
        });

      case "jsonl":
        return samples.map((s) => ({
          instruction: s.instruction,
          input: s.input || "",
          output: s.output,
        }));

      case "csv":
        return this.toCSV(samples);

      case "mlx":
        return samples.map((s) => {
          const messages = [
            { role: "user", content: s.instruction },
            { role: "assistant", content: s.output },
          ];
          if (s.systemPrompt) {
            messages.unshift({ role: "system", content: s.systemPrompt });
          }
          if (s.input) {
            messages[0].content = `${s.instruction}\n\nContext: ${s.input}`;
          }
          return { messages };
        });

      case "unsloth":
        return samples.map((s) => {
          let text = "";
          if (s.systemPrompt) {
            text += `### System:\n${s.systemPrompt}\n\n`;
          }
          if (s.input) {
            text += `### Human: ${s.instruction}\n\nContext: ${s.input}\n\n`;
          } else {
            text += `### Human: ${s.instruction}\n\n`;
          }
          text += `### Assistant: ${s.output}`;
          return { text };
        });

      case "trl":
        return samples.map((s) => {
          let prompt = s.instruction;
          if (s.systemPrompt) {
            prompt = `${s.systemPrompt}\n\n${prompt}`;
          }
          if (s.input) {
            prompt = `${prompt}\n\nContext: ${s.input}`;
          }
          return { prompt, completion: s.output };
        });

      default:
        throw new Error(`Unsupported format: ${this.options.format}`);
    }
  }

  toCSV(samples) {
    const escape = (str) => {
      if (!str) return "";
      str = str.replace(/"/g, '""');
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        str = `"${str}"`;
      }
      return str;
    };

    const headers = ["instruction", "input", "output", "category", "status", "quality"];
    const rows = samples.map((s) =>
      [
        escape(s.instruction),
        escape(s.input || ""),
        escape(s.output),
        s.category || "general",
        s.status || "draft",
        s.qualityRating || 3,
      ].join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  }

  serialize(data) {
    if (this.options.format === "jsonl") {
      return data.map((d) => JSON.stringify(d)).join("\n");
    } else if (this.options.format === "csv") {
      return data;
    } else {
      return JSON.stringify(data, null, 2);
    }
  }

  getOutputPath(dataset) {
    if (this.options.output) {
      return this.options.output.replace(/\.[^/.]+$/, ""); // Remove extension if present
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const safeName = dataset.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_");

    return join(process.cwd(), `${safeName}_${timestamp}`);
  }

  appendToFilename(path, suffix, extension) {
    return `${path}${suffix}.${extension}`;
  }

  getFileExtension() {
    switch (this.options.format) {
      case "jsonl":
        return "jsonl";
      case "csv":
        return "csv";
      default:
        return "json";
    }
  }
}
