// server/cli/parsers/json-array.js
// Parser for JSON array format (Alpaca, etc.)

import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { BaseParser } from "./base.js";

export class JSONArrayParser extends BaseParser {
  async getFileSize() {
    try {
      const stats = await stat(this.filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  async *streamBatches() {
    const fileSize = await this.getFileSize();

    // For JSON arrays, we need to stream parse to handle large files
    // This is a simplified approach - reads entire file for now
    // For truly large JSON arrays, we'd need a streaming JSON parser

    if (fileSize > 100 * 1024 * 1024) {
      // For files >100MB, warn about memory usage
      console.log(
        "⚠️  Large JSON file detected (>100MB). Consider converting to JSONL format for better performance."
      );
    }

    const fileContent = await this.readFileContent();
    let records = [];

    try {
      records = JSON.parse(fileContent);
    } catch (error) {
      this.onError({
        line: 1,
        error: `JSON parse error: ${error.message}`,
      });
      return;
    }

    if (!Array.isArray(records)) {
      this.onError({
        line: 1,
        error: "JSON file must contain an array of records",
      });
      return;
    }

    let batch = [];
    let processed = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const errors = this.validateRecord(record, i + 1);

      if (errors.length > 0) {
        errors.forEach((err) => this.onError(err));
        if (this.options.strict) {
          continue;
        }
      }

      const normalized = this.normalizeRecord(record);
      batch.push(normalized);

      if (batch.length >= this.batchSize) {
        yield {
          batch,
          progress: {
            processed: processed + batch.length,
            lineNumber: i + 1,
            bytesRead: fileSize,
            fileSize,
            percentage: (((i + 1) / records.length) * 100).toFixed(1),
          },
        };
        processed += batch.length;
        this.onProgress(processed, i + 1, fileSize, fileSize);
        batch = [];
      }
    }

    // Yield remaining batch
    if (batch.length > 0) {
      yield {
        batch,
        progress: {
          processed: processed + batch.length,
          lineNumber: records.length,
          bytesRead: fileSize,
          fileSize,
          percentage: 100,
        },
      };
    }

    // Final progress update
    yield {
      batch: [],
      progress: {
        processed: processed,
        lineNumber: records.length,
        bytesRead: fileSize,
        fileSize,
        percentage: 100,
        complete: true,
      },
    };
  }

  async readFileContent() {
    return new Promise((resolve, reject) => {
      const chunks = [];
      const stream = createReadStream(this.filePath, { encoding: "utf-8" });

      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(chunks.join("")));
      stream.on("error", reject);
    });
  }
}
