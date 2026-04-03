// server/cli/chunked-reader.js
// Read large files in chunks for efficient processing

import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { createInterface } from "readline";

export class ChunkedReader {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.chunkSize = options.chunkSize || 1000; // records per chunk
    this.format = options.format || "jsonl";
    this.onProgress = options.onProgress || (() => {});
  }

  async getFileStats() {
    const stats = await stat(this.filePath);
    return {
      size: stats.size,
      readable: stats.isFile(),
    };
  }

  async *streamChunks() {
    const _fileStats = await this.getFileStats();
    const fileStream = createReadStream(this.filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let chunk = [];
    let chunkId = 0;
    let totalProcessed = 0;
    let lineNumber = 0;

    for await (const line of rl) {
      lineNumber++;

      if (!line.trim()) continue;

      try {
        let record;

        if (this.format === "jsonl") {
          record = JSON.parse(line);
        } else if (this.format === "csv") {
          // CSV parsing handled separately
          record = line;
        } else {
          record = line;
        }

        chunk.push({
          data: record,
          lineNumber,
        });

        if (chunk.length >= this.chunkSize) {
          yield {
            chunkId: chunkId++,
            records: chunk.map((c) => c.data),
            startLine: chunk[0].lineNumber,
            endLine: chunk[chunk.length - 1].lineNumber,
            progress: {
              processed: totalProcessed + chunk.length,
              percentage: null, // Will be calculated by caller
            },
          };

          totalProcessed += chunk.length;
          this.onProgress(totalProcessed, lineNumber);
          chunk = [];
        }
      } catch (error) {
        // Log error but continue
        console.error(`Parse error at line ${lineNumber}: ${error.message}`);
      }
    }

    // Yield final chunk
    if (chunk.length > 0) {
      yield {
        chunkId: chunkId,
        records: chunk.map((c) => c.data),
        startLine: chunk[0].lineNumber,
        endLine: chunk[chunk.length - 1].lineNumber,
        progress: {
          processed: totalProcessed + chunk.length,
          isFinal: true,
        },
      };
      this.onProgress(totalProcessed + chunk.length, lineNumber);
    }
  }
}

// Calculate optimal chunk size based on file size
export function calculateOptimalChunkSize(fileSizeBytes, targetMemoryMB = 100) {
  // Estimate: average record is ~500 bytes
  const estimatedRecordSize = 500;
  const targetMemoryBytes = targetMemoryMB * 1024 * 1024;

  const _estimatedTotalRecords = fileSizeBytes / estimatedRecordSize;
  const chunkSize = Math.floor(targetMemoryBytes / estimatedRecordSize);

  // Clamp between 100 and 5000 records per chunk
  return Math.min(Math.max(chunkSize, 100), 5000);
}
