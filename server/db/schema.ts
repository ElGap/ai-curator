import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

// Sources Table (External integrations)
export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Identity
  key: text("key").unique().notNull(), // "opencode", "json", "manual", etc.
  name: text("name").notNull(), // Display name
  description: text("description"),

  // UI
  icon: text("icon"), // Lucide icon name
  color: text("color"), // Hex color code

  // Links
  website: text("website"),
  documentation: text("documentation"),

  // Capabilities
  supportsSessions: integer("supports_sessions", { mode: "boolean" }).default(false),
  supportsRealtime: integer("supports_realtime", { mode: "boolean" }).default(false),
  supportsBatching: integer("supports_batching", { mode: "boolean" }).default(true),
  supportsContext: integer("supports_context", { mode: "boolean" }).default(false),

  // Status
  isEnabled: integer("is_enabled", { mode: "boolean" }).default(true),
  isOfficial: integer("is_official", { mode: "boolean" }).default(false),

  // Statistics
  totalCaptures: integer("total_captures").default(0),
  lastCaptureAt: integer("last_capture_at", { mode: "timestamp" }),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;

// Datasets Table (Collections of samples)
export const datasets = sqliteTable("datasets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active").default(0), // Only ONE active at a time
  isArchived: integer("is_archived").default(0), // Soft delete

  // Default settings for new samples
  defaultQuality: text("default_quality").default("medium"),
  defaultCategory: text("default_category").default("general"),
  defaultAutoApprove: integer("default_auto_approve").default(0),

  // Goal settings
  goalSamples: integer("goal_samples").default(100), // Target sample count for this dataset
  goalName: text("goal_name").default("First Fine-Tuning"), // Name of the project/goal

  // Statistics (denormalized for quick access)
  sampleCount: integer("sample_count").default(0),
  approvedCount: integer("approved_count").default(0),
  lastImportAt: integer("last_import_at", { mode: "timestamp" }),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Training Samples Table
export const samples = sqliteTable("samples", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Dataset Relationship
  datasetId: integer("dataset_id")
    .references(() => datasets.id)
    .notNull(),
  datasetName: text("dataset_name"), // Denormalized for quick display

  // Core Fields (Required)
  instruction: text("instruction").notNull(),
  input: text("input"), // Optional context
  output: text("output").notNull(),

  // Metadata Fields
  systemPrompt: text("system_prompt"), // System prompt used
  category: text("category").default("general"), // coding, analysis, explanation, etc.
  difficulty: text("difficulty").default("intermediate"), // beginner, intermediate, advanced
  qualityRating: integer("quality_rating").default(3), // 1-5 stars
  notes: text("notes"), // User notes about sample
  tags: text("tags"), // JSON array of tags

  // Source Tracking
  source: text("source").default("manual"), // manual (form), json (import)
  model: text("model"), // Model used (for auto-captured)
  sessionId: text("session_id"), // Original session ID
  messageId: text("message_id"), // Original message ID

  // Technical (Auto-captured when available)
  tokensIn: integer("tokens_in"), // Input tokens
  tokensOut: integer("tokens_out"), // Output tokens
  cost: real("cost"), // Cost in USD
  toolsUsed: text("tools_used"), // JSON array of tool names

  // Model Parameters (important for training context)
  temperature: real("temperature"), // Model temperature (0.0 - 2.0)
  topP: real("top_p"), // Top-p sampling
  topK: integer("top_k"), // Top-k sampling
  maxTokens: integer("max_tokens"), // Max tokens setting
  frequencyPenalty: real("frequency_penalty"), // Frequency penalty
  presencePenalty: real("presence_penalty"), // Presence penalty
  stopSequences: text("stop_sequences"), // JSON array of stop sequences
  seed: integer("seed"), // Random seed for reproducibility

  // Context & System
  context: text("context"), // Additional context (JSON)
  metadata: text("metadata"), // Flexible metadata (JSON)

  // Review Status
  status: text("status").default("draft"), // draft, review, approved, rejected

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Import Sessions Table
export const importSessions = sqliteTable("import_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(), // json
  filePath: text("file_path"), // Path to imported file
  dateFrom: integer("date_from", { mode: "timestamp" }),
  dateTo: integer("date_to", { mode: "timestamp" }),
  totalEntries: integer("total_entries").default(0),
  importedCount: integer("imported_count").default(0),
  skippedCount: integer("skipped_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Milestones Table
export const milestones = sqliteTable("milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  targetCount: integer("target_count").notNull(),
  achievedAt: integer("achieved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// User Settings Table
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").unique().notNull(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// User Settings Table (for global defaults)
export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  defaultGoalSamples: integer("default_goal_samples").default(100),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Capture Settings Table (for default dataset configuration)
export const captureSettings = sqliteTable("capture_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // The default dataset for live captures
  defaultDatasetId: integer("default_dataset_id")
    .references(() => datasets.id)
    .default(1), // "General" dataset ID

  // For quick lookup and display
  defaultDatasetName: text("default_dataset_name").default("General"),

  // Default capture settings
  defaultStatus: text("default_status").default("draft"), // draft, approved
  defaultQuality: integer("default_quality").default(3), // 1-5 stars

  // Enable/disable live capture
  isEnabled: integer("is_enabled", { mode: "boolean" }).default(true),

  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Analytics Snapshots Table (for historical tracking)
export const analyticsSnapshots = sqliteTable("analytics_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  datasetId: integer("dataset_id")
    .references(() => datasets.id)
    .notNull(),

  // Sample counts
  totalSamples: integer("total_samples").default(0),
  approvedCount: integer("approved_count").default(0),
  draftCount: integer("draft_count").default(0),
  reviewCount: integer("review_count").default(0),
  rejectedCount: integer("rejected_count").default(0),

  // Quality metrics
  avgQuality: real("avg_quality").default(0),
  medianQuality: real("median_quality").default(0),
  qualityStdDev: real("quality_std_dev").default(0),

  // Content metrics
  avgInstructionLength: integer("avg_instruction_length").default(0),
  avgOutputLength: integer("avg_output_length").default(0),
  medianInstructionLength: integer("median_instruction_length").default(0),
  medianOutputLength: integer("median_output_length").default(0),

  // Category distribution (JSON)
  categoryDistribution: text("category_distribution").default("{}"),

  // Quality distribution (JSON)
  qualityDistribution: text("quality_distribution").default("{}"),

  // Difficulty distribution (JSON)
  difficultyDistribution: text("difficulty_distribution").default("{}"),

  // Computed at
  computedAt: integer("computed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Export Logs Table (track all exports)
export const exportLogs = sqliteTable("export_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  datasetId: integer("dataset_id")
    .references(() => datasets.id)
    .notNull(),

  // Export details
  format: text("format").notNull(), // alpaca, sharegpt, jsonl, csv, mlx, unsloth, trl
  sampleCount: integer("sample_count").default(0),
  filePath: text("file_path"),
  fileSize: integer("file_size").default(0), // in bytes

  // Filter and split info
  filterQuery: text("filter_query"), // e.g., "status=approved"
  splitRatios: text("split_ratios"), // e.g., "0.8,0.1,0.1"

  // Export time
  exportedAt: integer("exported_at", { mode: "timestamp" }).$defaultFn(() => new Date()),

  // User/Source tracking (for future multi-user support)
  source: text("source").default("cli"), // cli, web, api
});

export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;
export type Sample = typeof samples.$inferSelect;
export type NewSample = typeof samples.$inferInsert;
export type ImportSession = typeof importSessions.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type CaptureSettings = typeof captureSettings.$inferSelect;
export type NewCaptureSettings = typeof captureSettings.$inferInsert;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type NewAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;
export type ExportLog = typeof exportLogs.$inferSelect;
export type NewExportLog = typeof exportLogs.$inferInsert;
