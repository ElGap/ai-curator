// server/services/capture/enricher.ts
// Metadata enrichment for capture records

import type { AICuratorRecord, EnrichedRecord, SourceConfig } from "../../types/capture";

/**
 * Enrich a record with auto-detected metadata
 */
export function enrichRecord(record: AICuratorRecord, _source: SourceConfig): EnrichedRecord {
  const enriched: EnrichedRecord = { ...record };

  // Auto-detect category if not provided
  if (!enriched.category && !enriched.suggestedCategory) {
    enriched.suggestedCategory = detectCategory(enriched.instruction, enriched.output);
  }

  // Auto-detect difficulty if not provided
  if (!enriched.difficulty && !enriched.suggestedDifficulty) {
    enriched.suggestedDifficulty = detectDifficulty(
      enriched.instruction,
      enriched.output,
      enriched.context
    );
  }

  // Calculate quality score if not provided
  if (!enriched.qualityRating && !enriched.suggestedQuality) {
    enriched.suggestedQuality = calculateQualityScore(enriched);
  }

  return enriched;
}

/**
 * Auto-detect category based on content
 */
function detectCategory(instruction: string, output: string): string {
  const text = `${instruction} ${output}`.toLowerCase();

  // Category keywords
  const categories: Record<string, string[]> = {
    coding: [
      "code",
      "function",
      "class",
      "api",
      "programming",
      "python",
      "javascript",
      "typescript",
      "implementation",
      "bug",
      "error",
      "fix",
      "debug",
    ],
    debugging: ["error", "exception", "bug", "debug", "traceback", "stack trace", "fix", "broken"],
    explanation: [
      "explain",
      "what is",
      "how does",
      "why",
      "concept",
      "understand",
      "meaning",
      "difference between",
    ],
    architecture: [
      "architecture",
      "design",
      "pattern",
      "structure",
      "system",
      "framework",
      "infrastructure",
    ],
    testing: [
      "test",
      "testing",
      "unit test",
      "integration",
      "mock",
      "assert",
      "jest",
      "pytest",
      "spec",
    ],
    database: [
      "sql",
      "database",
      "query",
      "schema",
      "table",
      "migration",
      "orm",
      "prisma",
      "drizzle",
    ],
    devops: [
      "docker",
      "kubernetes",
      "ci/cd",
      "pipeline",
      "deployment",
      "server",
      "aws",
      "azure",
      "gcp",
    ],
  };

  // Score each category
  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(categories)) {
    scores[category] = keywords.filter((keyword) => text.includes(keyword)).length;
  }

  // Return highest scoring category, or "general"
  const bestCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return bestCategory && bestCategory[1] > 0 ? bestCategory[0] : "general";
}

/**
 * Auto-detect difficulty based on content
 */
function detectDifficulty(
  instruction: string,
  output: string,
  context?: AICuratorRecord["context"]
): "beginner" | "intermediate" | "advanced" {
  const text = `${instruction} ${output}`;
  const instructionLength = instruction.length;
  const outputLength = output.length;

  // Beginner indicators
  if (
    instructionLength < 50 &&
    outputLength < 200 &&
    !text.includes("advanced") &&
    !text.includes("complex") &&
    !text.includes("architecture")
  ) {
    return "beginner";
  }

  // Advanced indicators
  if (
    text.includes("advanced") ||
    text.includes("complex") ||
    text.includes("architecture") ||
    text.includes("distributed") ||
    text.includes("microservice") ||
    text.includes("optimization") ||
    instructionLength > 200 ||
    outputLength > 1000 ||
    (context?.files && context.files.length > 3)
  ) {
    return "advanced";
  }

  // Default to intermediate
  return "intermediate";
}

/**
 * Calculate quality score based on content
 */
function calculateQualityScore(record: AICuratorRecord): number {
  let score = 3; // Start with neutral (middle)

  // Has code blocks
  if (record.output.includes("```")) {
    score += 0.5;
  }

  // Reasonable length
  const outputLength = record.output.length;
  if (outputLength >= 100 && outputLength <= 1000) {
    score += 0.5;
  } else if (outputLength > 1000) {
    score += 0.3;
  }

  // Has context
  if (record.context?.files && record.context.files.length > 0) {
    score += 0.3;
  }

  // Has specific technical terms
  const technicalTerms = ["function", "class", "api", "database", "async", "promise"];
  const hasTechnicalTerms = technicalTerms.some((term) =>
    record.instruction.toLowerCase().includes(term)
  );
  if (hasTechnicalTerms) {
    score += 0.2;
  }

  // Cap at 1-5 range
  return Math.min(5, Math.max(1, Math.round(score)));
}
