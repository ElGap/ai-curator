// server/cli/utils.ts
// CLI utilities

import { join, resolve } from "path";
import os from "os";

/**
 * Resolve database path for CLI operations
 * Uses unified logic: DATABASE_URL env var > AI_CURATOR_DATA_DIR > ~/.curator
 */
export function resolveDatabasePath(dataDir?: string): string {
  if (process.env.DATABASE_URL) {
    return resolve(process.env.DATABASE_URL);
  }

  if (dataDir) {
    return join(resolve(dataDir), "curator.db");
  }

  // Default to ~/.curator for global npm consistency
  return join(os.homedir(), ".curator", "curator.db");
}
