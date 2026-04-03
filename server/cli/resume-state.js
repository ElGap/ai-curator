// server/cli/resume-state.js
// Manage import resume capability

import { existsSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

export class ResumeState {
  constructor(filePath, dataDir = ".") {
    this.filePath = filePath;
    this.dataDir = dataDir;
    this.stateFile = this.generateStateFileName();
  }

  generateStateFileName() {
    // Generate unique state file based on file path and size
    const hash = createHash("md5").update(this.filePath).digest("hex").substring(0, 8);
    return join(this.dataDir, `.curator-import-${hash}.state.json`);
  }

  save(state) {
    const stateData = {
      filePath: this.filePath,
      fileSize: state.fileSize,
      bytesProcessed: state.bytesProcessed,
      recordsProcessed: state.recordsProcessed,
      chunksCompleted: state.chunksCompleted || [],
      totalChunks: state.totalChunks,
      timestamp: Date.now(),
      options: state.options,
    };

    writeFileSync(this.stateFile, JSON.stringify(stateData, null, 2));
  }

  load() {
    if (!existsSync(this.stateFile)) {
      return null;
    }

    try {
      const data = JSON.parse(readFileSync(this.stateFile, "utf-8"));

      // Verify file hasn't changed
      if (data.filePath !== this.filePath) {
        console.log("⚠️  File path changed, cannot resume");
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error loading resume state:", error.message);
      return null;
    }
  }

  clear() {
    if (existsSync(this.stateFile)) {
      unlinkSync(this.stateFile);
    }
  }

  exists() {
    return existsSync(this.stateFile);
  }

  showStatus() {
    const state = this.load();
    if (!state) {
      console.log("No previous import state found.");
      return null;
    }

    const percentage =
      state.fileSize > 0 ? ((state.bytesProcessed / state.fileSize) * 100).toFixed(1) : 0;

    console.log(`📂 Found previous import state:`);
    console.log(`   File: ${state.filePath}`);
    console.log(`   Progress: ${percentage}% (${state.recordsProcessed.toLocaleString()} records)`);
    console.log(
      `   Chunks: ${state.chunksCompleted?.length || 0}/${state.totalChunks || "?"} completed`
    );
    console.log(`   Last updated: ${new Date(state.timestamp).toLocaleString()}`);

    return state;
  }
}
