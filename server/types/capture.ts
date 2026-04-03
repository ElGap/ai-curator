// server/types/capture.ts
// Universal Capture API Types - Based on docs/capture-import-architecture.md

/**
 * Universal AI Curator Record Format
 * All data entering AI Curator must conform to this schema
 */
export interface AICuratorRecord {
  // Core Fields (Required)
  instruction: string;
  output: string;

  // Context (Optional)
  input?: string | null;
  systemPrompt?: string | null;

  // Metadata (Optional)
  source?: string;
  sessionId?: string;
  messageId?: string;
  timestamp?: string;

  // Categorization
  category?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  qualityRating?: number;
  tags?: string[];

  // Rich Context (Optional)
  context?: {
    // File context
    files?: Array<{
      path: string;
      content?: string;
      language?: string;
    }>;

    // Environment
    environment?: {
      os?: string;
      shell?: string;
      language?: string;
      workingDirectory?: string;
    };

    // Version Control
    git?: {
      branch?: string;
      commit?: string;
      changedFiles?: string[];
    };

    // Model Info
    model?: {
      name: string;
      provider?: string;
      version?: string;
      parameters?: Record<string, any>;
    };

    // Usage Metrics
    tokens?: {
      input?: number;
      output?: number;
      total?: number;
    };
    cost?: number;
    toolsUsed?: string[];

    // Custom data
    custom?: Record<string, any>;
  };

  // Source-specific data
  metadata?: Record<string, any>;
}

/**
 * Capture Request - POST /api/capture
 */
export interface CaptureRequest {
  source: string;
  apiVersion: "1.0";

  session?: {
    id: string;
    name?: string;
    startedAt?: string;
    metadata?: Record<string, any>;
  };

  records: AICuratorRecord[];

  options?: {
    datasetId?: number;
    datasetName?: string;
    autoApprove?: boolean;
    skipDuplicates?: boolean;
    enrichMetadata?: boolean;
    dryRun?: boolean;
    defaultStatus?: "draft" | "approved";
    defaultQuality?: number;
  };
}

/**
 * Capture Response
 */
export interface CaptureResponse {
  success: boolean;
  capture: {
    id: string;
    source: string;
    dataset: {
      id: number;
      name: string;
    };
    samples: Array<{
      id: number;
      url: string;
      status: "draft" | "approved";
    }>;
    summary: {
      total: number;
      created: number;
      skipped: number;
      failed: number;
    };
  };
  processing: {
    duration: number;
    enriched: boolean;
    duplicates?: Array<{
      index: number;
      reason: "message_id" | "content_similarity";
      existingSampleId: number;
      similarity?: number;
    }>;
  };
  warnings?: Array<{
    code: string;
    message: string;
    sampleIndex?: number;
  }>;
  links: {
    review: string;
    dataset: string;
    session?: string;
  };
  message: string;
}

/**
 * Capture Error Response
 */
export interface CaptureError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      path: string;
      message: string;
    }>;
    referenceId?: string;
  };
}

/**
 * Source Configuration (from database)
 */
export interface SourceConfig {
  key: string;
  name: string;
  isEnabled: boolean;
  supportsSessions?: boolean;
  supportsRealtime?: boolean;
  supportsBatching?: boolean;
  supportsContext?: boolean;
  defaultConfig?: Record<string, any>;
}

/**
 * Duplicate Detection Result
 */
export interface DuplicateResult {
  index: number;
  existingSampleId: number;
  reason: "message_id" | "content_similarity";
  similarity?: number;
}

/**
 * Enriched Record (after processing)
 */
export interface EnrichedRecord extends AICuratorRecord {
  suggestedCategory?: string;
  suggestedDifficulty?: "beginner" | "intermediate" | "advanced";
  suggestedQuality?: number;
  suggestedStatus?: "draft" | "approved";
}
