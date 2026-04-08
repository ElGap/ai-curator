/**
 * Vitest Test Setup
 *
 * bun:sqlite is aliased to better-sqlite3 via vitest.config.ts
 * so tests can run under Node.js. In production (Bun), bun:sqlite
 * is used directly.
 */

// Set global test flag
process.env.AI_CURATOR_SKIP_AUTO_IMPORT = "1";
