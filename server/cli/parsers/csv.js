// server/cli/parsers/csv.js
// CSV parser using simple approach (no external deps for now)

import { createReadStream } from "fs";
import { createInterface } from "readline";
import { stat } from "fs/promises";
import { BaseParser } from "./base.js";

export class CSVParser extends BaseParser {
  async getFileSize() {
    try {
      const stats = await stat(this.filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  async *streamBatches() {
    const fileSize = await this.getFileSize();
    const fileStream = createReadStream(this.filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let headers = null;
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

      // First line is headers
      if (!headers) {
        headers = this.parseCSVLine(line);
        continue;
      }

      const values = this.parseCSVLine(line);
      const record = {};

      // Map CSV columns to record fields
      headers.forEach((header, index) => {
        const value = values[index] || "";
        const normalizedHeader = header.toLowerCase().trim();

        // Map common CSV headers to our fields
        if (["instruction", "input", "question", "prompt"].includes(normalizedHeader)) {
          record.instruction = value;
        } else if (["output", "response", "answer", "completion"].includes(normalizedHeader)) {
          record.output = value;
        } else if (["system", "system_prompt"].includes(normalizedHeader)) {
          record.systemPrompt = value;
        } else if (["category", "type"].includes(normalizedHeader)) {
          record.category = value;
        } else if (["difficulty", "level"].includes(normalizedHeader)) {
          record.difficulty = value;
        } else if (["quality", "rating", "quality_rating"].includes(normalizedHeader)) {
          record.qualityRating = Number(value) || 3;
        } else if (["tags"].includes(normalizedHeader)) {
          record.tags = value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        } else {
          // Store other fields in metadata
          if (!record.metadata) record.metadata = {};
          record.metadata[header] = value;
        }
      });

      const errors = this.validateRecord(record, lineNumber);

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
