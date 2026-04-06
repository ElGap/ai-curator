// server/cli/download.js
// Download and import command for Kaggle and Hugging Face datasets

import { KaggleClient, HuggingFaceClient } from "./external/index.js";
import { importCommand } from "./import-command.js";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { extractZip } from "./utils/zip.js";

export class DownloadCommand {
  constructor(options = {}) {
    this.options = {
      datasetId: options.datasetId, // kaggle:owner/name or hf:owner/name
      targetDatasetId: options.targetDatasetId || null, // AI Curator dataset ID
      outputDir: options.outputDir || null,
      autoImport: options.autoImport !== false, // default true
      category: options.category || "general",
      status: options.status || "draft",
      workers: options.workers || 4,
      kaggleToken: options.kaggleToken || null,
      hfToken: options.hfToken || null,
      dataDir: options.dataDir || null,
      ...options,
    };

    this.tempDir = null;
  }

  async execute() {
    const { source, id } = this.parseDatasetId(this.options.datasetId);

    if (!source || !id) {
      console.error("❌ Invalid dataset ID format. Use kaggle:owner/name or hf:owner/name");
      return { success: false, error: "Invalid dataset ID format" };
    }

    console.log(`📥 Downloading ${source} dataset: ${id}\n`);

    try {
      // Setup temp directory
      this.tempDir =
        this.options.outputDir ||
        join(process.env.HOME || process.env.USERPROFILE, ".curator", "downloads");
      if (!existsSync(this.tempDir)) {
        mkdirSync(this.tempDir, { recursive: true });
      }

      let downloadResult;
      let importResult = null;

      if (source === "kaggle") {
        downloadResult = await this.downloadFromKaggle(id);
      } else if (source === "hf") {
        downloadResult = await this.downloadFromHuggingFace(id);
      } else {
        throw new Error(`Unknown source: ${source}`);
      }

      // Auto-import if requested and download succeeded
      if (this.options.autoImport && downloadResult.success && downloadResult.files.length > 0) {
        console.log("\n📤 Importing downloaded files...\n");

        for (const file of downloadResult.files) {
          if (this.isImportableFile(file.path)) {
            importResult = await this.importFile(file.path);
            if (importResult && importResult.success) {
              console.log(
                `✅ Imported ${file.path}: ${importResult.imported.toLocaleString()} samples`
              );
            }
          }
        }
      }

      // Summary
      console.log("\n" + "=".repeat(60));
      console.log("✅ Download complete!");
      console.log(`   Source: ${source}`);
      console.log(`   Dataset: ${id}`);
      console.log(`   Files: ${downloadResult.files.length}`);
      console.log(`   Location: ${downloadResult.basePath}`);

      if (importResult) {
        console.log(`   Imported: ${importResult.imported.toLocaleString()} samples`);
      }
      console.log("=".repeat(60));

      return {
        success: true,
        source,
        datasetId: id,
        downloadResult,
        importResult,
      };
    } catch (error) {
      console.error(`\n❌ Download failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        source,
        datasetId: id,
      };
    }
  }

  parseDatasetId(datasetId) {
    if (datasetId.startsWith("kaggle:")) {
      return { source: "kaggle", id: datasetId.substring(7) };
    } else if (datasetId.startsWith("hf:") || datasetId.startsWith("huggingface:")) {
      const prefix = datasetId.startsWith("hf:") ? 3 : 12;
      return { source: "hf", id: datasetId.substring(prefix) };
    }
    return { source: null, id: null };
  }

  async downloadFromKaggle(handle) {
    const client = new KaggleClient(this.options.kaggleToken);

    if (!client.isAuthenticated()) {
      throw new Error("Kaggle API credentials not found. Create ~/.kaggle/kaggle.json");
    }

    // Download as ZIP
    const zipPath = join(this.tempDir, `${handle.replace(/\//g, "_")}.zip`);
    console.log(`⬇️  Downloading from Kaggle...`);

    const _result = await client.downloadDataset(
      handle,
      this.tempDir,
      (downloaded, total, percentage) => {
        process.stdout.write(
          `\r   Progress: ${percentage}% (${(downloaded / 1024 / 1024).toFixed(1)} MB)`
        );
      }
    );

    process.stdout.write("\n");

    // Extract ZIP
    console.log("📦 Extracting files...");
    const extractDir = join(this.tempDir, handle.replace(/\//g, "_"));
    await extractZip(zipPath, extractDir);

    // List extracted files
    const { readdirSync } = await import("fs");
    const files = [];

    const listFilesRecursive = (dir, baseDir = dir) => {
      const items = readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = join(dir, item.name);
        if (item.isDirectory()) {
          listFilesRecursive(fullPath, baseDir);
        } else {
          files.push({
            path: fullPath,
            relativePath: fullPath.replace(baseDir + "/", ""),
            name: item.name,
          });
        }
      }
    };

    listFilesRecursive(extractDir);

    return {
      success: true,
      basePath: extractDir,
      files,
    };
  }

  async downloadFromHuggingFace(repoId) {
    const client = new HuggingFaceClient(this.options.hfToken);

    console.log(`⬇️  Downloading from Hugging Face...`);

    // Get dataset info
    const info = await client.getDatasetInfo(repoId);
    console.log(`   Dataset: ${info.id || repoId}`);

    // Download files
    const downloadDir = join(this.tempDir, repoId.replace(/\//g, "_"));

    const result = await client.downloadDataset(repoId, downloadDir, {
      onProgress: (downloaded, total, percentage) => {
        process.stdout.write(
          `\r   Progress: ${percentage}% (${(downloaded / 1024 / 1024).toFixed(1)} MB)`
        );
      },
    });

    process.stdout.write("\n");

    return {
      success: true,
      basePath: downloadDir,
      files: result.files.map((f) => ({
        path: f.path,
        relativePath: f.path.replace(downloadDir + "/", ""),
        name: f.path.split("/").pop(),
      })),
    };
  }

  isImportableFile(filePath) {
    const importableExts = [".json", ".jsonl", ".csv"];
    const ext = filePath.toLowerCase().split(".").pop();
    return importableExts.includes(`.${ext}`);
  }

  async importFile(filePath) {
    return await importCommand({
      filePath,
      datasetId: this.options.targetDatasetId,
      category: this.options.category,
      status: this.options.status,
      dataDir: this.options.dataDir,
    });
  }
}
