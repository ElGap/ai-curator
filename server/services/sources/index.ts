// server/services/sources/index.ts
// Source registry and management

import { eq, desc } from "drizzle-orm";
import { getDb } from "../../db";
import { sources, type NewSource } from "../../db/schema";
import type { SourceConfig } from "../../types/capture";

/**
 * Get a source by its key
 */
export async function getSource(key: string): Promise<SourceConfig | null> {
  const db = getDb();

  const source = await db.query.sources.findFirst({
    where: eq(sources.key, key),
  });

  if (!source) {
    return null;
  }

  return {
    key: source.key,
    name: source.name,
    isEnabled: source.isEnabled ?? true,
    supportsSessions: source.supportsSessions ?? false,
    supportsRealtime: source.supportsRealtime ?? false,
    supportsBatching: source.supportsBatching ?? true,
    supportsContext: source.supportsContext ?? false,
  };
}

/**
 * List all sources
 */
export async function listSources(): Promise<SourceConfig[]> {
  const db = getDb();

  const allSources = await db.query.sources.findMany({
    orderBy: [desc(sources.totalCaptures)],
  });

  return allSources.map((source) => ({
    key: source.key,
    name: source.name,
    isEnabled: source.isEnabled ?? true,
    supportsSessions: source.supportsSessions ?? false,
    supportsRealtime: source.supportsRealtime ?? false,
    supportsBatching: source.supportsBatching ?? true,
    supportsContext: source.supportsContext ?? false,
  }));
}

/**
 * Register a new source
 */
export async function registerSource(config: NewSource) {
  const db = getDb();

  // Check if source already exists
  const existing = await getSource(config.key);
  if (existing) {
    throw new Error(`Source '${config.key}' already exists`);
  }

  const result = await db.insert(sources).values(config).returning();

  return result[0];
}

/**
 * Update source statistics after capture
 */
export async function updateSourceStats(key: string, captureCount: number) {
  const db = getDb();

  await db
    .update(sources)
    .set({
      totalCaptures: sql`total_captures + ${captureCount}`,
      lastCaptureAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sources.key, key));
}

/**
 * Seed default sources
 * This should be called on application startup
 */
export async function seedDefaultSources() {
  const defaultSources: NewSource[] = [
    {
      key: "manual",
      name: "Manual (Web UI)",
      description: "Samples created manually through the web interface",
      icon: "mouse-pointer",
      color: "#6b7280",
      isOfficial: true,
      isEnabled: true,
      supportsBatching: false,
      supportsContext: false,
    },
    {
      key: "json",
      name: "JSON Import",
      description: "Samples imported from JSON files",
      icon: "file-json",
      color: "#3b82f6",
      isOfficial: true,
      isEnabled: true,
      supportsBatching: true,
      supportsContext: false,
    },
    {
      key: "csv",
      name: "CSV Import",
      description: "Samples imported from CSV files",
      icon: "table",
      color: "#22c55e",
      isOfficial: true,
      isEnabled: true,
      supportsBatching: true,
      supportsContext: false,
    },
    {
      key: "opencode",
      name: "OpenCode",
      description: "Live capture from OpenCode CLI conversations",
      icon: "terminal",
      color: "#8b5cf6",
      isOfficial: true,
      isEnabled: true,
      supportsSessions: true,
      supportsRealtime: true,
      supportsBatching: true,
      supportsContext: true,
    },
    {
      key: "openwebui",
      name: "OpenWebUI",
      description: "Export conversations from OpenWebUI for training datasets",
      icon: "message-square",
      color: "#10b981",
      isOfficial: true,
      isEnabled: true,
      supportsSessions: false,
      supportsRealtime: false,
      supportsBatching: true,
      supportsContext: true,
    },
  ];

  for (const source of defaultSources) {
    const existing = await getSource(source.key);
    if (!existing) {
      await registerSource(source);
      console.log(`✓ Registered source: ${source.key}`);
    }
  }
}

// Import sql for raw queries
import { sql } from "drizzle-orm";
