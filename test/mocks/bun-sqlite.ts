/**
 * Mock for bun:sqlite that re-exports better-sqlite3
 *
 * This module allows tests to run under Node.js by replacing
 * bun:sqlite's Database class with better-sqlite3's.
 * The API between the two is nearly identical for our usage patterns.
 */

import BetterSqlite3Database from "better-sqlite3";

export const Database = BetterSqlite3Database;
export default BetterSqlite3Database;
