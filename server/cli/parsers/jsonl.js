// server/cli/parsers/jsonl.js
// Streaming JSONL (JSON Lines) parser

import { createReadStream } from "fs";
import { createInterface } from "readline";
import { stat } from "fs/promises";
import { BaseParser } from "./base.js";

export class JSONLParser extends BaseParser {
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
    const fileStream = createReadStream(this.filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let batch = [];
    let processed = 0;
    let lineNumber = 0;
    let bytesRead = 0;

    // Track bytes for progress
    fileStream.on("data", (chunk) => {
      bytesRead += chunk.length;
    });

    for await (const line of rl) {
      lineNumber++;

      if (!line.trim()) continue;

      try {
        const record = JSON.parse(line);
        const errors = this.validateRecord(record, lineNumber);

        if (errors.length > 0) {
          errors.forEach((err) => this.onError(err));
          if (this.options.strict) {
            continue; // Skip invalid records in strict mode
          }
        }

        const normalized = this.normalizeRecord(record);
        batch.push(normalized);

        if (batch.length >= this.batchSize) {
          yield {
            batch,
            progress: {
              processed: processed + batch.length,
              lineNumber,
              bytesRead,
              fileSize,
              percentage: fileSize > 0 ? ((bytesRead / fileSize) * 100).toFixed(1) : 0,
            },
          };
          processed += batch.length;
          this.onProgress(processed, lineNumber, bytesRead, fileSize);
          batch = [];
        }
      } catch (error) {
        this.onError({
          line: lineNumber,
          error: `JSON parse error: ${error.message}`,
          raw: line.substring(0, 200),
        });
      }
    }

    // Yield remaining batch
    if (batch.length > 0) {
      yield {
        batch,
        progress: {
          processed: processed + batch.length,
          lineNumber,
          bytesRead,
          fileSize,
          percentage: 100,
        },
      };
      this.onProgress(processed + batch.length, lineNumber, bytesRead, fileSize);
    }

    // Final progress update
    yield {
      batch: [],
      progress: {
        processed: processed,
        lineNumber,
        bytesRead: fileSize,
        fileSize,
        percentage: 100,
        complete: true,
      },
    };
  }
}
