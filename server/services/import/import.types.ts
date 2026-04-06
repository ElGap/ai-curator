/**
 * Import Service Types
 * Shared types for import functionality across CLI and UI
 */

export type ImportSource = "api" | "cli" | "web" | "capture";
export type SampleStatus = "draft" | "review" | "approved" | "rejected";

/**
 * Raw sample from import (accepts multiple field names for flexibility)
 */
export interface RawSample {
  // Core instruction fields (all valid, will be resolved)
  instruction?: string | null;
  input?: string | null;
  question?: string | null;

  // Output fields (all valid, will be resolved)
  output?: string | null;
  response?: string | null;
  answer?: string | null;

  // Context/System
  context?: string | Record<string, unknown> | null;
  systemPrompt?: string | null;
  system?: string | null;

  // Metadata
  category?: string | null;
  difficulty?: string | null;
  qualityRating?: number | string | null;
  quality?: number | string | null;
  rating?: number | string | null;

  // Tags
  tags?: string[] | string | null;
  notes?: string | null;
  status?: SampleStatus | null;

  // Extended metadata
  metadata?: Record<string, unknown> | null;

  // Allow additional fields
  [key: string]: unknown;
}

/**
 * Import options
 */
export interface ImportOptions {
  datasetId?: number;
  category?: string;
  status?: SampleStatus;
  source: ImportSource;
  dryRun?: boolean;
  // Dataset defaults for new samples
  datasetDefaults?: {
    quality?: string | null; // "low", "medium", "high" or numeric string
    category?: string | null;
  };
}

/**
 * Import error
 */
export interface ImportError {
  line?: number;
  field: string;
  error: string;
  value?: unknown;
}

/**
 * Import progress callback
 */
export interface ImportProgress {
  processed: number;
  total: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
  dataset: {
    id: number;
    name: string;
    sampleCount?: number;
    approvedCount?: number;
  };
}

/**
 * Parser interface for different file formats
 */
export interface Parser<T = RawSample> {
  filePath: string;
  options: ParserOptions;
  streamBatches(): AsyncGenerator<{ batch: T[]; progress: ImportProgress }>;
}

/**
 * Parser options
 */
export interface ParserOptions {
  batchSize?: number;
  strict?: boolean;
  onProgress?: (progress: ImportProgress) => void;
  onError?: (error: ImportError) => void;
}
