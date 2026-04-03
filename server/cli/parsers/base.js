// server/cli/parsers/base.js
// Base parser class for all format parsers

export class BaseParser {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.options = options;
    this.batchSize = options.batchSize || 1000;
    this.onProgress = options.onProgress || (() => {});
    this.onError = options.onError || (() => {});
  }

  // Override in subclasses
  // eslint-disable-next-line require-yield
  async *streamBatches() {
    throw new Error("streamBatches() must be implemented by subclass");
  }

  // Validate a single record
  validateRecord(record, lineNumber) {
    const errors = [];

    // Check required fields (must exist and not be empty/whitespace-only)
    const instruction = record.instruction?.toString().trim();
    const input = record.input?.toString().trim();
    const output = record.output?.toString().trim();
    const response = record.response?.toString().trim();

    if (!instruction && !input) {
      errors.push({
        line: lineNumber,
        field: "instruction/input",
        error: "Missing required field: instruction or input (cannot be empty)",
        value: record,
      });
    }

    if (!output && !response) {
      errors.push({
        line: lineNumber,
        field: "output/response",
        error: "Missing required field: output or response (cannot be empty)",
        value: record,
      });
    }

    // Validate types
    if (record.instruction && typeof record.instruction !== "string") {
      errors.push({
        line: lineNumber,
        field: "instruction",
        error: "Field must be a string",
        value: record.instruction,
      });
    }

    if (record.output && typeof record.output !== "string") {
      errors.push({
        line: lineNumber,
        field: "output",
        error: "Field must be a string",
        value: record.output,
      });
    }

    // Check quality rating if present
    if (record.qualityRating !== undefined) {
      const rating = Number(record.qualityRating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        errors.push({
          line: lineNumber,
          field: "qualityRating",
          error: "Quality rating must be between 1 and 5",
          value: record.qualityRating,
        });
      }
    }

    return errors;
  }

  // Normalize record to AI Curator format
  normalizeRecord(record) {
    return {
      instruction: record.instruction || record.input || record.question || "",
      output: record.output || record.response || record.answer || "",
      input: record.input || record.context || "",
      systemPrompt: record.systemPrompt || record.system || "",
      category: record.category || "general",
      difficulty: record.difficulty || "intermediate",
      qualityRating: Number(record.qualityRating) || 3,
      status: record.status || "draft",
      source: "import",
      tags: this.parseTags(record.tags),
      metadata: {
        ...record.metadata,
        importSource: this.options.importSource || "file",
      },
    };
  }

  parseTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string") {
      return tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  }
}
