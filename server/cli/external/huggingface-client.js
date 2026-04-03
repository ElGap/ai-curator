// server/cli/external/huggingface-client.js
// Hugging Face Hub client for dataset discovery and download

/* global AbortController */

import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Security: Fetch with timeout to prevent hanging requests
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export class HuggingFaceClient {
  constructor(token = null) {
    this.token = token || process.env.HUGGINGFACE_TOKEN || null;
    this.baseUrl = "https://huggingface.co";
    this.apiUrl = "https://huggingface.co/api";
  }

  isAuthenticated() {
    return this.token !== null;
  }

  async searchDatasets(query = "", options = {}) {
    const searchParams = new URLSearchParams({
      search: query,
      type: "dataset",
      limit: (options.limit || 20).toString(),
      ...options.filters,
    });

    try {
      const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
      const response = await fetchWithTimeout(
        `${this.apiUrl}/datasets?${searchParams}`,
        { headers },
        30000 // 30 second timeout
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("HF search timed out after 30 seconds");
      }
      throw new Error(`HF search failed: ${error.message}`);
    }
  }

  async getDatasetInfo(repoId) {
    try {
      const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
      const response = await fetchWithTimeout(
        `${this.apiUrl}/datasets/${repoId}`,
        { headers },
        30000 // 30 second timeout
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to get dataset info: ${error.message}`);
    }
  }

  async listFiles(repoId, revision = "main") {
    try {
      const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
      const response = await fetchWithTimeout(
        `${this.apiUrl}/datasets/${repoId}/tree/${revision}`,
        { headers },
        30000 // 30 second timeout
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("HF list files timed out after 30 seconds");
      }
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async downloadFile(repoId, filename, outputDir, revision = "main", onProgress = null) {
    try {
      const fileUrl = `${this.baseUrl}/datasets/${repoId}/resolve/${revision}/${filename}`;
      const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};

      // Download with progress tracking (longer timeout for downloads: 5 minutes)
      const response = await fetchWithTimeout(fileUrl, { headers }, 300000);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const totalSize = parseInt(response.headers.get("content-length") || "0");
      let downloadedSize = 0;

      // Ensure output directory exists
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = join(outputDir, filename);
      const writer = createWriteStream(outputPath);

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        writer.write(Buffer.from(value));
        downloadedSize += value.length;

        if (onProgress && totalSize > 0) {
          const percentage = ((downloadedSize / totalSize) * 100).toFixed(1);
          onProgress(downloadedSize, totalSize, percentage);
        }
      }

      writer.end();

      return {
        success: true,
        path: outputPath,
        size: downloadedSize,
      };
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  async downloadDataset(repoId, outputDir, options = {}) {
    try {
      // List all files
      const files = await this.listFiles(repoId, options.revision || "main");
      const dataFiles = this.filterDataFiles(files);

      if (dataFiles.length === 0) {
        throw new Error("No data files found in dataset");
      }

      const results = [];

      for (const file of dataFiles) {
        const result = await this.downloadFile(
          repoId,
          file.path,
          outputDir,
          options.revision || "main",
          options.onProgress
        );
        results.push(result);
      }

      return {
        success: true,
        files: results,
        count: results.length,
      };
    } catch (error) {
      throw new Error(`Dataset download failed: ${error.message}`);
    }
  }

  filterDataFiles(files) {
    const dataExtensions = [".json", ".jsonl", ".csv", ".parquet", ".txt", ".md"];

    return files.filter((file) => {
      if (file.type !== "file") return false;
      const ext = file.path.toLowerCase().split(".").pop();
      return dataExtensions.includes(`.${ext}`);
    });
  }
}

// CLI helper functions
export function formatHFDataset(dataset) {
  return {
    id: dataset.id,
    name: dataset.id.split("/").pop(),
    author: dataset.author || dataset.id.split("/")[0],
    description: dataset.description || "",
    downloads: dataset.downloads || 0,
    likes: dataset.likes || 0,
    tags: dataset.tags || [],
    lastModified: dataset.lastModified,
    private: dataset.private || false,
    gated: dataset.gated || false,
  };
}
