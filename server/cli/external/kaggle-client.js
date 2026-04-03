// server/cli/external/kaggle-client.js
// Kaggle API client for dataset discovery and download

import { KaggleNode } from "kaggle-node";
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export class KaggleClient {
  constructor(credentials = null) {
    this.credentials = credentials || this.loadCredentials();
    this.client = null;

    if (this.credentials) {
      this.client = new KaggleNode({
        credentials: this.credentials,
      });
    }
  }

  loadCredentials() {
    // Try to load from ~/.kaggle/kaggle.json
    try {
      const homedir = process.env.HOME || process.env.USERPROFILE;
      const credPath = join(homedir, ".kaggle", "kaggle.json");

      if (existsSync(credPath)) {
        const creds = JSON.parse(readFileSync(credPath, "utf8"));
        return {
          username: creds.username,
          key: creds.key,
        };
      }
    } catch (_error) {
      // Credentials not found
    }
    return null;
  }

  isAuthenticated() {
    return this.client !== null;
  }

  async searchDatasets(query = "", options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error("Kaggle API credentials not found. Please set up your Kaggle API token.");
    }

    const searchOptions = {
      search: query,
      sortBy: options.sortBy || "hottest",
      page: options.page || 1,
      ...options,
    };

    try {
      const result = await this.client.datasets.search(searchOptions);
      return result;
    } catch (error) {
      throw new Error(`Kaggle search failed: ${error.message}`);
    }
  }

  async getDatasetInfo(handle) {
    if (!this.isAuthenticated()) {
      throw new Error("Kaggle API credentials not found.");
    }

    try {
      const result = await this.client.datasets.list(handle);
      return result;
    } catch (error) {
      throw new Error(`Failed to get dataset info: ${error.message}`);
    }
  }

  async downloadDataset(handle, outputDir, _onProgress = null) {
    if (!this.isAuthenticated()) {
      throw new Error("Kaggle API credentials not found.");
    }

    try {
      // Download dataset
      const result = await this.client.datasets.download(handle);

      // Ensure output directory exists
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = join(outputDir, `${handle.replace(/\//g, "_")}.zip`);

      // Write file
      if (result && result.data) {
        await pipeline(Readable.from(result.data), createWriteStream(outputPath));
      }

      return {
        success: true,
        path: outputPath,
        size: result?.size || 0,
      };
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  async downloadFile(handle, filename, outputDir) {
    if (!this.isAuthenticated()) {
      throw new Error("Kaggle API credentials not found.");
    }

    try {
      const result = await this.client.datasets.download(handle, filename);

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = join(outputDir, filename);

      if (result && result.data) {
        await pipeline(Readable.from(result.data), createWriteStream(outputPath));
      }

      return {
        success: true,
        path: outputPath,
      };
    } catch (error) {
      throw new Error(`File download failed: ${error.message}`);
    }
  }
}

// CLI helper functions
export function formatKaggleDataset(dataset) {
  return {
    id: dataset.id || dataset.ref,
    title: dataset.title,
    subtitle: dataset.subtitle || "",
    owner: dataset.ownerName || dataset.owner || "Unknown",
    size: formatBytes(dataset.totalBytes || dataset.size || 0),
    downloads: dataset.downloadCount || 0,
    votes: dataset.voteCount || 0,
    lastUpdated: dataset.lastUpdated || dataset.dateUpdated,
    tags: dataset.tags || [],
    description: dataset.description || "",
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
