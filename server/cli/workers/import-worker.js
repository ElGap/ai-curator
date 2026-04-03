// server/cli/workers/import-worker.js
// Worker thread for parallel sample processing

import { parentPort } from "worker_threads";

// Process a batch of records
function processBatch(records, options = {}) {
  const results = {
    valid: [],
    invalid: [],
    errors: [],
  };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const lineNumber = options.startLine + i;

    try {
      // Validate required fields
      if (!record.instruction && !record.input) {
        results.errors.push({
          line: lineNumber,
          error: "Missing required field: instruction or input",
          record: record,
        });
        results.invalid.push(record);
        continue;
      }

      if (!record.output && !record.response) {
        results.errors.push({
          line: lineNumber,
          error: "Missing required field: output or response",
          record: record,
        });
        results.invalid.push(record);
        continue;
      }

      // Normalize record
      const normalized = {
        instruction: record.instruction || record.input || "",
        output: record.output || record.response || "",
        input: record.input || record.context || "",
        systemPrompt: record.systemPrompt || record.system || "",
        category: options.category || record.category || "general",
        difficulty: record.difficulty || "intermediate",
        qualityRating: Number(record.qualityRating) || 3,
        status: options.status || record.status || "draft",
        source: "import",
        tags: parseTags(record.tags),
        metadata: {
          ...record.metadata,
          importSource: "file",
          processedAt: new Date().toISOString(),
        },
      };

      results.valid.push(normalized);
    } catch (error) {
      results.errors.push({
        line: lineNumber,
        error: `Processing error: ${error.message}`,
        record: record,
      });
      results.invalid.push(record);
    }
  }

  return results;
}

function parseTags(tags) {
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

// Handle messages from main thread
parentPort.on("message", (message) => {
  if (message.type === "process") {
    const { records, options, chunkId } = message;

    const results = processBatch(records, options);

    parentPort.postMessage({
      type: "complete",
      chunkId,
      valid: results.valid,
      invalid: results.invalid,
      errors: results.errors,
      processed: records.length,
    });
  }
});
