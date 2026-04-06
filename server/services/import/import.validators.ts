import { z } from "zod";
import type {
  RawSample,
  ImportOptions,
  // ImportResult, // Unused
  ImportError,
  // ImportProgress, // Unused
} from "./import.types.ts";

/**
 * Zod schema for validating raw samples from import
 */
export const rawSampleSchema = z
  .object({
    // Core fields - instruction/input/question are all valid
    instruction: z.string().nullable().optional(),
    input: z.string().nullable().optional(),
    question: z.string().nullable().optional(),

    // Output fields - output/response/answer are all valid
    output: z.string().nullable().optional(),
    response: z.string().nullable().optional(),
    answer: z.string().nullable().optional(),

    // Context fields - can be string or object
    context: z
      .union([z.string(), z.object({}).passthrough()])
      .nullable()
      .optional(),
    systemPrompt: z.string().nullable().optional(),
    system_prompt: z.string().nullable().optional(),
    system: z.string().nullable().optional(),

    // Metadata fields
    category: z.string().nullable().optional(),
    difficulty: z.string().nullable().optional(),
    qualityRating: z.number().or(z.string()).nullable().optional(),
    quality_rating: z.number().or(z.string()).nullable().optional(),
    quality: z.number().or(z.string()).nullable().optional(),
    rating: z.number().or(z.string()).nullable().optional(),

    // Tags - can be array or string
    tags: z
      .union([z.array(z.string()), z.string()])
      .nullable()
      .optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(["draft", "review", "approved", "rejected"]).optional(),

    // Extended metadata - use loose object type
    metadata: z.object({}).passthrough().nullable().optional(),
  })
  .passthrough();

/**
 * Zod schema for import options
 */
export const importOptionsSchema = z.object({
  datasetId: z.number().optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "review", "approved", "rejected"]).optional(),
  source: z.enum(["api", "cli", "web", "capture"]),
  dryRun: z.boolean().optional().default(false),
});

/**
 * Parse quality rating from various field names
 */
export function parseQualityRating(value: unknown): number {
  if (value === undefined || value === null) return 3;
  const num = Number(value);
  if (isNaN(num)) return 3;
  return Math.max(1, Math.min(5, num)); // Clamp to 1-5
}

/**
 * Map text quality (low/medium/high) to numeric rating (1-5)
 */
export function mapQualityTextToRating(quality: string | null | undefined): number {
  if (!quality) return 3; // Default to medium (3)
  switch (quality.toLowerCase()) {
    case "low":
      return 1;
    case "medium":
      return 3;
    case "high":
      return 5;
    default: {
      // Try to parse as number
      const num = parseInt(quality, 10);
      return isNaN(num) ? 3 : Math.max(1, Math.min(5, num));
    }
  }
}

/**
 * Parse tags from string or array
 */
export function parseTags(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((t): t is string => typeof t === "string");
  if (typeof value === "string") {
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Parse context field (handles object or string)
 */
export function parseContext(value: unknown): Record<string, unknown> | null {
  if (!value) return null;

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Normalize a raw sample to standardized format
 */
export function normalizeSample(
  raw: RawSample,
  options: ImportOptions
): {
  instruction: string;
  input: string | null;
  output: string;
  systemPrompt: string | null;
  category: string;
  difficulty: string;
  qualityRating: number;
  tags: string[];
  notes: string | null;
  status: "draft" | "review" | "approved" | "rejected";
  source: string;
  context: string | null;
  metadata: string;
} {
  // Resolve instruction from various field names
  const instruction = raw.instruction?.trim() || raw.input?.trim() || raw.question?.trim() || "";

  // Resolve output from various field names
  const output = raw.output?.trim() || raw.response?.trim() || raw.answer?.trim() || "";

  // Resolve input/context (if not already used for instruction)
  let input: string | null = null;
  if (raw.input?.trim() && raw.input.trim() !== instruction) {
    input = raw.input.trim();
  } else if (
    raw.context?.trim &&
    typeof raw.context === "string" &&
    raw.context.trim() !== instruction
  ) {
    input = raw.context.trim();
  }

  // Resolve system prompt (try multiple field names)
  const systemPromptValue = raw.systemPrompt || raw.system_prompt || raw.system || null;
  const systemPrompt =
    typeof systemPromptValue === "string" ? systemPromptValue.trim() || null : null;

  // Parse quality rating (try multiple field names including snake_case, then dataset default)
  const rawQuality = raw.qualityRating ?? raw.quality_rating ?? raw.quality ?? raw.rating;
  let qualityRating: number;
  if (rawQuality !== undefined && rawQuality !== null) {
    qualityRating = parseQualityRating(rawQuality);
  } else if (options.datasetDefaults?.quality) {
    qualityRating = mapQualityTextToRating(options.datasetDefaults.quality);
  } else {
    qualityRating = 3; // Default to medium
  }

  // Parse tags
  const tags = parseTags(raw.tags);

  // Parse context object
  const contextObj = parseContext(raw.context);
  const context = contextObj ? JSON.stringify(contextObj) : null;

  // Build metadata
  const metadata = {
    importTimestamp: new Date().toISOString(),
    importSource: options.source,
    originalFields: Object.keys(raw).filter(
      (k) =>
        ![
          "instruction",
          "input",
          "output",
          "systemPrompt",
          "category",
          "difficulty",
          "qualityRating",
          "tags",
          "notes",
          "context",
        ].includes(k)
    ),
    ...raw.metadata,
  };

  // Apply option overrides or defaults (with dataset defaults as fallback)
  const category =
    options.category || raw.category || options.datasetDefaults?.category || "general";
  const difficulty = raw.difficulty || "intermediate";
  const status = options.status || (raw.status as ImportOptions["status"]) || "draft";
  const notes = raw.notes?.trim() || null;

  return {
    instruction,
    input,
    output,
    systemPrompt,
    category,
    difficulty,
    qualityRating,
    tags,
    notes,
    status,
    source: options.source,
    context,
    metadata: JSON.stringify(metadata),
  };
}

/**
 * Validate a normalized sample
 */
export function validateSample(normalized: ReturnType<typeof normalizeSample>): ImportError[] {
  const errors: ImportError[] = [];

  // Required field: instruction
  if (!normalized.instruction || normalized.instruction.length === 0) {
    errors.push({
      field: "instruction",
      error: "Instruction is required and cannot be empty",
    });
  }

  // Required field: output
  if (!normalized.output || normalized.output.length === 0) {
    errors.push({
      field: "output",
      error: "Output is required and cannot be empty",
    });
  }

  // Validate quality rating range
  if (normalized.qualityRating < 1 || normalized.qualityRating > 5) {
    errors.push({
      field: "qualityRating",
      error: `Quality rating must be between 1 and 5, got ${normalized.qualityRating}`,
      value: normalized.qualityRating,
    });
  }

  // Validate category values (optional but recommended)
  const validCategories = [
    "general",
    "coding",
    "analysis",
    "explanation",
    "creative",
    "reasoning",
    "math",
    "science",
    "other",
  ];
  if (normalized.category && !validCategories.includes(normalized.category)) {
    // Not an error, just a warning - allow custom categories
  }

  return errors;
}

/**
 * Process a batch of samples
 */
export function processBatch(
  samples: RawSample[],
  options: ImportOptions,
  lineOffset: number = 0
): {
  normalized: ReturnType<typeof normalizeSample>[];
  errors: ImportError[];
} {
  const normalized: ReturnType<typeof normalizeSample>[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < samples.length; i++) {
    const raw = samples[i];
    const lineNumber = lineOffset + i + 1;

    try {
      // Validate raw sample with Zod
      const validationResult = rawSampleSchema.safeParse(raw);

      if (!validationResult.success) {
        errors.push({
          line: lineNumber,
          field: "validation",
          error: `Invalid sample structure: ${validationResult.error.message}`,
          value: raw,
        });
        continue;
      }

      // Normalize
      const normalizedSample = normalizeSample(validationResult.data, options);

      // Validate normalized
      const validationErrors = validateSample(normalizedSample);

      if (validationErrors.length > 0) {
        errors.push(...validationErrors.map((e) => ({ ...e, line: lineNumber })));
        continue;
      }

      normalized.push(normalizedSample);
    } catch (error) {
      errors.push({
        line: lineNumber,
        field: "unknown",
        error: error instanceof Error ? error.message : "Unknown error during processing",
        value: raw,
      });
    }
  }

  return { normalized, errors };
}
