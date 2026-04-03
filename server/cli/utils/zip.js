// server/cli/utils/zip.js
// ZIP file extraction utility

import AdmZip from "adm-zip";
import { existsSync, mkdirSync } from "fs";

export async function extractZip(zipPath, outputDir) {
  if (!existsSync(zipPath)) {
    throw new Error(`ZIP file not found: ${zipPath}`);
  }

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(outputDir, true); // true = overwrite
    return {
      success: true,
      extractedTo: outputDir,
    };
  } catch (error) {
    throw new Error(`Failed to extract ZIP: ${error.message}`);
  }
}

export function listZipContents(zipPath) {
  if (!existsSync(zipPath)) {
    throw new Error(`ZIP file not found: ${zipPath}`);
  }

  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    return entries.map((entry) => ({
      name: entry.entryName,
      size: entry.header.size,
      isDirectory: entry.isDirectory,
    }));
  } catch (error) {
    throw new Error(`Failed to list ZIP contents: ${error.message}`);
  }
}
