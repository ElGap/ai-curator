// server/cli/parsers/index.js
// Parser factory - auto-detects format and returns appropriate parser

import { createReadStream } from "fs";
import { extname } from "path";
import { JSONLParser } from "./jsonl.js";
import { JSONArrayParser } from "./json-array.js";
import { CSVParser } from "./csv.js";

export { JSONLParser, JSONArrayParser, CSVParser };

export function detectFormat(filePath) {
  const ext = extname(filePath).toLowerCase();

  switch (ext) {
    case ".jsonl":
    case ".jsonlines":
      return "jsonl";
    case ".json":
      return "json"; // Could be array or JSONL
    case ".csv":
      return "csv";
    case ".parquet":
      return "parquet";
    default:
      return "unknown";
  }
}

export async function peekFile(filePath, bytes = 200) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { start: 0, end: bytes - 1 });
    let content = "";

    stream.on("data", (chunk) => (content += chunk));
    stream.on("end", () => resolve(content.trim()));
    stream.on("error", reject);
  });
}

export async function detectJSONFormat(filePath) {
  const peek = await peekFile(filePath, 500);
  const firstChar = peek.trim()[0];

  if (firstChar === "[") {
    return "json-array";
  } else if (firstChar === "{" || firstChar === '"' || /\d/.test(firstChar)) {
    // Likely JSONL - each line is a JSON object
    return "jsonl";
  }

  // Default to JSONL for unknown
  return "jsonl";
}

export async function createParser(filePath, format = null, options = {}) {
  const detectedFormat = format || detectFormat(filePath);

  // If JSON format not specified, peek at file to determine
  let finalFormat = detectedFormat;
  if (detectedFormat === "json" || detectedFormat === "unknown") {
    finalFormat = await detectJSONFormat(filePath);
  }

  switch (finalFormat) {
    case "jsonl":
      return new JSONLParser(filePath, options);
    case "json-array":
      return new JSONArrayParser(filePath, options);
    case "csv":
      return new CSVParser(filePath, options);
    case "parquet":
      throw new Error("Parquet format not yet implemented. Convert to JSON/JSONL first.");
    default:
      throw new Error(`Unsupported format: ${detectedFormat}. Supported: json, jsonl, csv`);
  }
}
