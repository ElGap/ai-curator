/**
 * Mock for drizzle-orm/bun-sqlite that re-exports drizzle-orm/better-sqlite3
 *
 * This module allows tests to run under Node.js by replacing
 * the bun-sqlite driver with the better-sqlite3 driver.
 */

export { drizzle, BetterSQLite3Database as BunSQLiteDatabase } from "drizzle-orm/better-sqlite3";
