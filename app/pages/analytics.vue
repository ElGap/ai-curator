<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold mb-2">
            Dataset Analytics:
            {{
              analytics?.dataset?.name ||
              datasets.find((d) => d.id === selectedDataset)?.name ||
              "General"
            }}
          </h1>
          <p class="text-secondary">Insights and metrics for your training data</p>
        </div>
        <div class="flex gap-2">
          <select v-model="selectedDataset" class="form-input" @change="loadAnalytics">
            <option v-for="ds in datasets" :key="ds.id" :value="ds.id">
              {{ ds.name }}
            </option>
          </select>
          <button class="btn-secondary" @click="loadAnalytics">
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
              <path d="M21.5 2v6h-6M21.34 5.5A10 10 0 1 1 11.26 2.75" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card p-8 text-center">
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
      </div>
      <p class="text-secondary mt-4">Computing analytics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card p-6 border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Analytics Dashboard (only when samples exist) -->
    <div v-else-if="analytics?.overview?.totalSamples > 0" class="space-y-6">
      <!-- Readiness Score Card -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>📊</span>
            Training Readiness Score
          </h2>
          <span class="text-3xl font-bold text-gray-700 dark:text-gray-300">
            {{ analytics.readiness.score }}/{{ analytics.readiness.maxScore }}
          </span>
        </div>

        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1">
            <div
              class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600"
            >
              <div
                class="h-full bg-gray-600 dark:bg-gray-400 rounded-full transition-all duration-500"
                :style="{ width: `${analytics.readiness.score}%` }"
              ></div>
            </div>
          </div>
          <span class="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Grade: {{ analytics.readiness.grade }}
          </span>
        </div>

        <p class="text-secondary">
          {{ analytics.readiness.status }}
        </p>
      </div>

      <!-- Overview Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Total Samples -->
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-secondary">Total Samples</span>
            <span class="text-2xl">📦</span>
          </div>
          <div class="text-2xl font-bold">
            {{ formatNumber(analytics.overview.totalSamples) }}
          </div>
          <div class="text-xs text-secondary mt-1">
            {{ analytics.overview.recentSamplesLabel }}
          </div>
        </div>

        <!-- Approved Rate -->
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-secondary">Approved</span>
            <span class="text-2xl">✅</span>
          </div>
          <div class="text-2xl font-bold text-gray-700 dark:text-gray-300">
            {{ analytics.overview.approvalRate }}%
          </div>
          <div class="text-xs text-secondary mt-1">
            {{ formatNumber(analytics.overview.approvedCount) }} samples
          </div>
        </div>

        <!-- Average Quality -->
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-secondary">Avg Quality</span>
            <span class="text-2xl">⭐</span>
          </div>
          <div class="text-2xl font-bold">{{ analytics.quality.average }}/5</div>
          <div class="text-xs text-secondary mt-1">Median: {{ analytics.quality.median }}⭐</div>
        </div>

        <!-- Content Size -->
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-secondary">Avg Length</span>
            <span class="text-2xl">📝</span>
          </div>
          <div class="text-2xl font-bold">
            {{ analytics.content.instruction.averageLength }}
          </div>
          <div class="text-xs text-secondary mt-1">chars per instruction</div>
        </div>
      </div>

      <!-- Category Distribution & Distribution & Metrics - Side by Side -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Category Distribution -->
        <div
          v-if="Object.keys(analytics.distribution.categories).length > 1"
          class="card flex flex-col"
        >
          <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🏷️</span>
            Category Distribution
          </h3>
          <div class="flex-1 space-y-2 overflow-hidden">
            <div
              v-for="[category, count] in sortedCategories"
              :key="category"
              class="flex items-center gap-2"
            >
              <div class="w-32 text-sm capitalize truncate" :title="category">{{ category }}</div>
              <div class="flex-1 min-w-0">
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    class="h-full bg-gray-500 dark:bg-gray-400 rounded"
                    :style="{
                      width: `${Math.max(5, ((count as number) / (analytics?.overview?.totalSamples || 1)) * 100)}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div class="w-16 text-sm text-secondary text-right flex-shrink-0">
                {{
                  Math.round(((count as number) / (analytics?.overview?.totalSamples || 1)) * 100)
                }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Distribution & Metrics -->
        <div class="card flex flex-col">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📊</span>
            Distribution & Metrics
          </h3>
          <div class="space-y-6">
            <!-- Status Distribution -->
            <div class="pb-2">
              <h4 class="font-medium mb-3 text-secondary text-base flex items-center gap-2">
                <span>📋</span>
                Status
              </h4>
              <div class="space-y-2">
                <!-- Approved -->
                <div v-if="analytics.overview.approvedCount > 0" class="flex items-center gap-2">
                  <div class="w-24 text-sm">Approved</div>
                  <div class="flex-1">
                    <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <div
                        class="h-full bg-gray-500 dark:bg-gray-400 rounded"
                        :style="{
                          width: `${(analytics.overview.approvedCount / analytics.overview.totalSamples) * 100}%`,
                        }"
                      ></div>
                    </div>
                  </div>
                  <div class="w-14 text-sm text-secondary text-right">
                    {{
                      Math.round(
                        (analytics.overview.approvedCount / analytics.overview.totalSamples) * 100
                      )
                    }}%
                  </div>
                </div>

                <!-- Draft -->
                <div v-if="analytics.overview.draftCount > 0" class="flex items-center gap-2">
                  <div class="w-24 text-sm">Draft</div>
                  <div class="flex-1">
                    <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <div
                        class="h-full bg-gray-500 dark:bg-gray-400 rounded"
                        :style="{
                          width: `${(analytics.overview.draftCount / analytics.overview.totalSamples) * 100}%`,
                        }"
                      ></div>
                    </div>
                  </div>
                  <div class="w-14 text-sm text-secondary text-right">
                    {{
                      Math.round(
                        (analytics.overview.draftCount / analytics.overview.totalSamples) * 100
                      )
                    }}%
                  </div>
                </div>

                <!-- Review -->
                <div v-if="analytics.overview.reviewCount > 0" class="flex items-center gap-2">
                  <div class="w-24 text-sm">Review</div>
                  <div class="flex-1">
                    <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <div
                        class="h-full bg-gray-500 dark:bg-gray-400 rounded"
                        :style="{
                          width: `${(analytics.overview.reviewCount / analytics.overview.totalSamples) * 100}%`,
                        }"
                      ></div>
                    </div>
                  </div>
                  <div class="w-14 text-sm text-secondary text-right">
                    {{
                      Math.round(
                        (analytics.overview.reviewCount / analytics.overview.totalSamples) * 100
                      )
                    }}%
                  </div>
                </div>

                <!-- Rejected -->
                <div v-if="analytics.overview.rejectedCount > 0" class="flex items-center gap-2">
                  <div class="w-24 text-sm">Rejected</div>
                  <div class="flex-1">
                    <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <div
                        class="h-full bg-gray-500 dark:bg-gray-400 rounded"
                        :style="{
                          width: `${(analytics.overview.rejectedCount / analytics.overview.totalSamples) * 100}%`,
                        }"
                      ></div>
                    </div>
                  </div>
                  <div class="w-14 text-sm text-secondary text-right">
                    {{
                      Math.round(
                        (analytics.overview.rejectedCount / analytics.overview.totalSamples) * 100
                      )
                    }}%
                  </div>
                </div>
              </div>
            </div>

            <!-- Quality Distribution -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 class="font-medium mb-3 text-secondary text-base flex items-center gap-2">
                <span>⭐</span>
                Quality
              </h4>
              <div class="space-y-2">
                <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2">
                  <div class="w-24 text-sm">{{ "⭐".repeat(star) }}</div>
                  <div class="flex-1">
                    <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      <div
                        class="h-full bg-gray-500 dark:bg-gray-400 rounded"
                        :style="{
                          width: `${((analytics.quality.distribution[star] || 0) / analytics.overview.totalSamples) * 100}%`,
                        }"
                      ></div>
                    </div>
                  </div>
                  <div class="w-14 text-sm text-secondary text-right">
                    {{
                      Math.round(
                        ((analytics.quality.distribution[star] || 0) /
                          analytics.overview.totalSamples) *
                          100
                      )
                    }}%
                  </div>
                </div>
              </div>
            </div>

            <!-- Length Metrics -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 class="font-medium mb-3 text-secondary text-base flex items-center gap-2">
                <span>📏</span>
                Length
              </h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <div class="text-secondary text-sm mb-1">Instructions</div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Avg:</span>
                    <span class="font-semibold">{{
                      analytics.content.instruction.averageLength
                    }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Max:</span>
                    <span class="font-semibold">{{
                      formatNumber(analytics.content.instruction.maxLength)
                    }}</span>
                  </div>
                </div>
                <div>
                  <div class="text-secondary text-sm mb-1">Outputs</div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Avg:</span>
                    <span class="font-semibold">{{ analytics.content.output.averageLength }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Max:</span>
                    <span class="font-semibold">{{
                      formatNumber(analytics.content.output.maxLength)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Computed At -->
      <div class="text-center text-sm text-secondary">
        Computed at: {{ formatComputedAt(analytics.computedAt) }}
      </div>
    </div>

    <!-- Empty State (no samples) -->
    <div v-else class="card p-8 text-center">
      <div class="text-6xl mb-4">📊</div>
      <h3 class="text-xl font-semibold mb-2">No Data Available</h3>
      <p class="text-secondary mb-4">This dataset doesn't have any samples yet.</p>
      <NuxtLink to="/import" class="btn-primary inline-block"> Import Samples </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    layout: "default",
  });

  const route = useRoute();
  const datasets = ref([]);
  const selectedDataset = ref(null);
  const analytics = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Load available datasets
  const loadDatasets = async () => {
    try {
      const response = await $fetch("/api/datasets");
      datasets.value = response.datasets || [];

      // Set initial dataset
      const urlDatasetId = route.query.dataset;
      if (urlDatasetId) {
        selectedDataset.value = parseInt(urlDatasetId as string);
      } else {
        // Find active dataset or use first one
        const active = datasets.value.find((d: { isActive: boolean }) => d.isActive);
        selectedDataset.value = active?.id || datasets.value[0]?.id;
      }
    } catch (err) {
      console.error("Failed to load datasets:", err);
    }
  };

  // Load analytics for selected dataset
  const loadAnalytics = async () => {
    if (!selectedDataset.value) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch(`/api/analytics/overview?datasetId=${selectedDataset.value}`);
      analytics.value = response;
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      error.value = err.message || "Failed to load analytics";
    } finally {
      loading.value = false;
    }
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Format computed at timestamp
  const formatComputedAt = (date: string | number | Date | null | undefined) => {
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
    return d.toLocaleString();
  };

  // Sorted categories
  const sortedCategories = computed<[string, number][]>(() => {
    if (!analytics.value?.distribution?.categories) return [];
    return Object.entries(analytics.value.distribution.categories).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    ) as [string, number][];
  });

  // Initialize
  onMounted(async () => {
    await loadDatasets();
    await loadAnalytics();
  });
</script>
