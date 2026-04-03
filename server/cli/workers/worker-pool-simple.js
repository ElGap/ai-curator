// server/cli/workers/worker-pool-simple.js
// Simple worker pool using cluster or async processing (no worker_threads for now)

export class SimpleWorkerPool {
  constructor(workerCount = 4) {
    this.workerCount = workerCount;
    this.queue = [];
    this.activeTasks = 0;
  }

  async processChunk(records, options, chunkId) {
    // For now, process synchronously but in batches
    // This avoids Worker Threads complexity while still allowing parallel structure
    return this.processRecords(records, options, chunkId);
  }

  processRecords(records, options) {
    const valid = [];
    const invalid = [];
    const errors = [];

    for (const record of records) {
      try {
        // Validate required fields
        if (!record.instruction && !record.input) {
          errors.push({
            error: "Missing required field: instruction or input",
            record: record,
          });
          invalid.push(record);
          continue;
        }

        if (!record.output && !record.response) {
          errors.push({
            error: "Missing required field: output or response",
            record: record,
          });
          invalid.push(record);
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
          status: options.status || "draft",
          source: "import",
          tags: this.parseTags(record.tags),
          metadata: {
            ...record.metadata,
            importSource: "file",
          },
        };

        valid.push(normalized);
      } catch (error) {
        errors.push({
          error: `Processing error: ${error.message}`,
          record: record,
        });
        invalid.push(record);
      }
    }

    return {
      valid,
      invalid,
      errors,
      processed: records.length,
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

  async terminate() {
    // Nothing to clean up for simple processing
  }
}
