<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold mb-2">Sample #{{ route.params.id }}</h1>
        <p class="text-secondary">View full details and model parameters.</p>
      </div>
      <div class="flex gap-3">
        <NuxtLink
          v-if="prevId"
          :to="{ path: `/samples/${prevId}`, query: route.query }"
          class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Previous
        </NuxtLink>
        <NuxtLink
          v-if="nextId"
          :to="{ path: `/samples/${nextId}`, query: route.query }"
          class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          Next
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </NuxtLink>
        <NuxtLink
          :to="{ path: `/samples/${route.params.id}/edit`, query: route.query }"
          class="btn-primary flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          Edit
        </NuxtLink>
        <NuxtLink :to="backUrl" class="btn-secondary"> ← Back to Dataset </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      <p class="mt-2 text-secondary">Loading sample...</p>
    </div>

    <div v-else-if="error" class="card text-center py-12">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      <NuxtLink :to="backUrl" class="btn-primary mt-4 inline-block"> Back to Dataset </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content - Conversation -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Status Header -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full text-sm font-medium" :class="statusClass">
                {{ formatStatus(sample.status) }}
              </span>
              <span class="px-3 py-1 rounded-full text-sm font-medium" :class="sourceClass">
                {{ formatSource(sample.source) }}
              </span>
              <span class="flex items-center gap-1">
                <span v-for="i in sample.qualityRating" :key="i" class="text-yellow-400">⭐</span>
              </span>
            </div>
            <span class="text-sm text-secondary">
              {{ formatDate(sample.createdAt) }}
            </span>
          </div>

          <!-- Model Badge -->
          <div v-if="sample.model" class="mb-4">
            <span
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
              </svg>
              {{ sample.model }}
            </span>
          </div>
        </div>

        <!-- Conversation -->
        <div class="card space-y-4">
          <h2 class="text-lg font-bold">Conversation</h2>

          <!-- System Prompt -->
          <div
            v-if="sample.systemPrompt"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-2 text-sm text-tertiary mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              System Prompt
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 font-mono">
              {{ sample.systemPrompt }}
            </p>
          </div>

          <!-- User Message -->
          <div
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              User
            </div>
            <p class="text-gray-900 dark:text-gray-100">{{ sample.instruction }}</p>
          </div>

          <!-- Assistant Response -->
          <div
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              Assistant
            </div>
            <p class="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {{ sample.output }}
            </p>
          </div>
        </div>

        <!-- Metadata -->
        <div class="card">
          <h2 class="text-lg font-bold mb-4">Metadata</h2>
          <div
            class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-900 dark:text-gray-100"
          >
            <div>
              <span class="text-tertiary">Category:</span>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatCategory(sample.category) }}
              </p>
            </div>
            <div>
              <span class="text-tertiary">Difficulty:</span>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatDifficulty(sample.difficulty) }}
              </p>
            </div>
            <div>
              <span class="text-tertiary">Source:</span>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatSource(sample.source) }}
              </p>
            </div>
            <div v-if="sample.sessionId">
              <span class="text-tertiary">Session ID:</span>
              <p class="font-mono text-xs truncate text-gray-700 dark:text-gray-300">
                {{ sample.sessionId }}
              </p>
            </div>
            <div>
              <span class="text-tertiary">Created:</span>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatDateTime(sample.createdAt) }}
              </p>
            </div>
            <div>
              <span class="text-tertiary">Updated:</span>
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatDateTime(sample.updatedAt) }}
              </p>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="sample.tags" class="mt-4">
            <span class="text-tertiary text-sm">Tags:</span>
            <div class="flex flex-wrap gap-2 mt-1">
              <span
                v-for="tag in parsedTags"
                :key="tag"
                class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm border border-gray-200 dark:border-gray-700"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="sample.notes" class="mt-4">
            <span class="text-tertiary text-sm">Notes:</span>
            <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">{{ sample.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Sidebar - Model Parameters -->
      <div class="space-y-6">
        <!-- Model Parameters Card -->
        <div
          class="card bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-700"
        >
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Model Parameters
          </h2>

          <div v-if="hasModelParams" class="space-y-3">
            <!-- Temperature -->
            <div v-if="sample.temperature !== null" class="flex justify-between items-center">
              <span class="text-sm text-secondary">Temperature</span>
              <span class="font-mono font-medium">{{ sample.temperature }}</span>
            </div>
            <div
              v-if="sample.temperature !== null"
              class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
            >
              <div
                class="bg-gray-600 h-2 rounded-full"
                :style="{ width: (sample.temperature / 2) * 100 + '%' }"
              ></div>
            </div>

            <!-- Top P -->
            <div
              v-if="sample.topP !== null"
              class="flex justify-between items-center pt-2 border-t dark:border-gray-700"
            >
              <span class="text-sm text-secondary">Top P</span>
              <span class="font-mono font-medium">{{ sample.topP }}</span>
            </div>

            <!-- Top K -->
            <div
              v-if="sample.topK !== null"
              class="flex justify-between items-center pt-2 border-t dark:border-gray-700"
            >
              <span class="text-sm text-secondary">Top K</span>
              <span class="font-mono font-medium">{{ sample.topK }}</span>
            </div>

            <!-- Max Tokens -->
            <div
              v-if="sample.maxTokens !== null"
              class="flex justify-between items-center pt-2 border-t dark:border-gray-700"
            >
              <span class="text-sm text-secondary">Max Tokens</span>
              <span class="font-mono font-medium">{{ sample.maxTokens }}</span>
            </div>

            <!-- Frequency Penalty -->
            <div
              v-if="sample.frequencyPenalty !== null"
              class="flex justify-between items-center pt-2 border-t dark:border-gray-700"
            >
              <span class="text-sm text-secondary">Frequency Penalty</span>
              <span class="font-mono font-medium">{{ sample.frequencyPenalty }}</span>
            </div>

            <!-- Presence Penalty -->
            <div
              v-if="sample.presencePenalty !== null"
              class="flex justify-between items-center pt-2 border-t dark:border-gray-700"
            >
              <span class="text-sm text-secondary">Presence Penalty</span>
              <span class="font-mono font-medium">{{ sample.presencePenalty }}</span>
            </div>

            <!-- Seed -->
            <div
              v-if="sample.seed !== null"
              class="flex justify-between items-center pt-2 border-t dark:border-gray-700"
            >
              <span class="text-sm text-secondary">Seed</span>
              <span class="font-mono font-medium">{{ sample.seed }}</span>
            </div>

            <!-- Stop Sequences -->
            <div v-if="sample.stopSequences" class="pt-2 border-t dark:border-gray-700">
              <span class="text-sm text-secondary block mb-1">Stop Sequences</span>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="seq in parsedStopSequences"
                  :key="seq"
                  class="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs font-mono"
                >
                  {{ seq }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-4 text-secondary">
            <p class="text-sm">No model parameters captured</p>
            <p class="text-xs mt-1">Parameters are captured from Open WebUI or API calls</p>
          </div>
        </div>

        <!-- Token Info -->
        <div v-if="sample.tokensIn || sample.tokensOut" class="card">
          <h2 class="text-lg font-bold mb-4">Token Usage</h2>
          <div class="space-y-3">
            <div v-if="sample.tokensIn" class="flex justify-between">
              <span class="text-sm text-secondary">Input Tokens</span>
              <span class="font-medium">{{ sample.tokensIn }}</span>
            </div>
            <div v-if="sample.tokensOut" class="flex justify-between">
              <span class="text-sm text-secondary">Output Tokens</span>
              <span class="font-medium">{{ sample.tokensOut }}</span>
            </div>
            <div
              v-if="sample.tokensIn && sample.tokensOut"
              class="pt-2 border-t dark:border-gray-700"
            >
              <div class="flex justify-between text-sm">
                <span class="text-secondary">Total</span>
                <span class="font-medium">{{ sample.tokensIn + sample.tokensOut }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cost -->
        <div v-if="sample.cost" class="card">
          <h2 class="text-lg font-bold mb-2">Cost</h2>
          <p class="text-2xl font-bold text-gray-700 dark:text-gray-400">
            ${{ sample.cost.toFixed(4) }}
          </p>
        </div>

        <!-- Tools Used -->
        <div v-if="sample.toolsUsed" class="card">
          <h2 class="text-lg font-bold mb-3">Tools Used</h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tool in parsedTools"
              :key="tool"
              class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
            >
              {{ tool }}
            </span>
          </div>
        </div>

        <!-- Metadata JSON -->
        <div v-if="sample.metadata" class="card">
          <h2 class="text-lg font-bold mb-3">Additional Metadata</h2>
          <pre
            class="text-xs bg-gray-800 text-gray-200 dark:bg-gray-700 dark:text-gray-300 p-3 rounded overflow-x-auto"
            >{{ parsedMetadata }}</pre
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { watch } from "vue";

  const route = useRoute();

  // Helper to generate back URL with dataset parameter preserved
  const backUrl = computed(() => {
    const datasetId = route.query.dataset;
    if (datasetId) {
      return { path: "/samples", query: { dataset: datasetId } };
    }
    return "/samples";
  });

  const loading = ref(true);
  const error = ref(null);
  const sample = ref<any>(null);
  const prevId = ref<number | null>(null);
  const nextId = ref<number | null>(null);

  const loadSample = async () => {
    try {
      loading.value = true;
      const response = (await $fetch(`/api/samples/${route.params.id}`)) as any;
      sample.value = response.sample;
      prevId.value = response.prevId;
      nextId.value = response.nextId;
    } catch (err) {
      error.value = "Failed to load sample. It may have been deleted.";
      console.error("Error loading sample:", err);
    } finally {
      loading.value = false;
    }
  };

  const parsedTags = computed(() => {
    if (!sample.value?.tags) return [];
    try {
      return JSON.parse(sample.value.tags);
    } catch {
      return [];
    }
  });

  const parsedStopSequences = computed(() => {
    if (!sample.value?.stopSequences) return [];
    try {
      return JSON.parse(sample.value.stopSequences);
    } catch {
      return [];
    }
  });

  const parsedTools = computed(() => {
    if (!sample.value?.toolsUsed) return [];
    try {
      return JSON.parse(sample.value.toolsUsed);
    } catch {
      return [];
    }
  });

  const parsedMetadata = computed(() => {
    if (!sample.value?.metadata) return null;
    try {
      return JSON.parse(sample.value.metadata);
    } catch {
      return sample.value.metadata;
    }
  });

  const hasModelParams = computed(() => {
    if (!sample.value) return false;
    return (
      sample.value.temperature !== null ||
      sample.value.topP !== null ||
      sample.value.topK !== null ||
      sample.value.maxTokens !== null ||
      sample.value.frequencyPenalty !== null ||
      sample.value.presencePenalty !== null ||
      sample.value.seed !== null ||
      sample.value.stopSequences !== null
    );
  });

  const statusClass = computed(() => {
    const classes: Record<string, string> = {
      draft: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      review: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      approved: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      rejected: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    };
    return (
      classes[sample.value?.status] ||
      "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
    );
  });

  const sourceClass = computed(() => {
    const classes: Record<string, string> = {
      manual:
        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
      json: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
    };
    return (
      classes[sample.value?.source] ||
      "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
    );
  });

  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      draft: "Draft",
      review: "In Review",
      approved: "Approved",
      rejected: "Rejected",
    };
    return statuses[status] || status;
  };

  const formatSource = (source: string) => {
    const sources: Record<string, string> = {
      manual: "Manual",
      json: "JSON Import",
    };
    return sources[source] || source;
  };

  const formatCategory = (category: string) => {
    const categories: Record<string, string> = {
      general: "General",
      coding: "Coding",
      analysis: "Analysis",
      explanation: "Explanation",
      writing: "Writing",
      math: "Math",
      science: "Science",
    };
    return categories[category] || category;
  };

  const formatDifficulty = (difficulty: string) => {
    const difficulties: Record<string, string> = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
    };
    return difficulties[difficulty] || difficulty;
  };

  const formatDate = (date: string | number | Date | null | undefined) => {
    if (!date) return "N/A";

    // Handle different input types and convert to timestamp
    let timestamp: number;

    if (date instanceof Date) {
      timestamp = date.getTime();
    } else if (typeof date === "number") {
      // If the number is very small (less than 10 billion), it's probably seconds
      // Otherwise assume it's milliseconds
      timestamp = date < 10000000000 ? date * 1000 : date;
    } else if (typeof date === "string") {
      // Try to parse as ISO string first
      const parsed = Date.parse(date);
      if (!isNaN(parsed)) {
        timestamp = parsed;
      } else {
        // Try to parse as a number string
        const num = parseInt(date, 10);
        if (!isNaN(num)) {
          timestamp = num < 10000000000 ? num * 1000 : num;
        } else {
          return "Invalid date";
        }
      }
    } else {
      return "Invalid date";
    }

    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string | number | Date | null | undefined) => {
    if (!date) return "N/A";

    // Handle different input types and convert to timestamp
    let timestamp: number;

    if (date instanceof Date) {
      timestamp = date.getTime();
    } else if (typeof date === "number") {
      // If the number is very small (less than 10 billion), it's probably seconds
      // Otherwise assume it's milliseconds
      timestamp = date < 10000000000 ? date * 1000 : date;
    } else if (typeof date === "string") {
      // Try to parse as ISO string first
      const parsed = Date.parse(date);
      if (!isNaN(parsed)) {
        timestamp = parsed;
      } else {
        // Try to parse as a number string
        const num = parseInt(date, 10);
        if (!isNaN(num)) {
          timestamp = num < 10000000000 ? num * 1000 : num;
        } else {
          return "Invalid date";
        }
      }
    } else {
      return "Invalid date";
    }

    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  onMounted(() => {
    loadSample();
  });

  // Watch for route changes and reload sample
  watch(
    () => route.params.id,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        console.log("Route changed, loading sample:", newId);
        loadSample();
      }
    }
  );

  definePageMeta({
    layout: "default",
  });
</script>
