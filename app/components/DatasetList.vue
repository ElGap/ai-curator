<template>
  <div class="space-y-6">
    <!-- Header with Dataset Info - Dashboard Style -->
    <div class="card">
      <!-- Dataset Header with Goal -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex-1">
          <!-- Dataset Name - Main Heading -->
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ currentDataset?.name || "General" }}
              </h1>
            </div>
          </div>

          <!-- Goal - Subtitle with visual flair -->
          <div class="flex items-center gap-2 ml-12">
            <span
              class="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full"
            >
              🎯 Goal
            </span>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ goalName }} — building {{ targetGoal }} samples
            </span>
          </div>
        </div>

        <!-- Progress Counter -->
        <div class="text-right bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 min-w-[120px]">
          <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
            / {{ targetGoal }} target
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mb-6">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
          <div
            class="bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 h-6 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
            :style="{ width: `${Math.min(progressPercentage, 100)}%` }"
          >
            <span v-if="progressPercentage > 10" class="text-white text-sm font-medium"
              >{{ progressPercentage }}%</span
            >
          </div>
        </div>
      </div>

      <!-- Stats Counters -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="card card border-blue-200 dark:border-blue-400 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:dark:text-blue-400 font-medium">Total</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-blue-400">{{ stats.total }}</p>
            </div>
            <div
              class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-700 dark:text-blue-400"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          </div>
        </div>

        <div class="card card border-green-200 dark:border-green-500 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-green-500 font-medium">Approved</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-green-500">
                {{ stats.approved }}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-700 dark:text-green-500"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>

        <div class="card card border-orange-700 dark:border-orange-400 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-orange-400 font-medium">In Review</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-orange-400">
                {{ stats.review || 0 }}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-700 dark:text-orange-400"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
        </div>

        <div class="card card border-yellow-200 dark:border-yellow-100 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-yellow-100 font-medium">Drafts</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-yellow-100">
                {{ stats.draft }}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-700 dark:text-yellow-100"
              >
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="card card border-red-200 dark:border-red-400 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-red-400 font-medium">Rejected</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-red-400">
                {{ stats.rejected || 0 }}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-700 dark:text-red-400"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Sample Button -->
      <div class="mt-6 flex justify-end">
        <NuxtLink :to="newSampleUrl" class="btn-primary border dark:border-gray-400">
          + New Sample
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="card py-4">
      <div class="flex flex-wrap gap-4 items-center">
        <!-- Dataset Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-secondary">Search:</label>
          <input
            v-model="filters.search"
            type="text"
            class="form-input w-64"
            placeholder="Search instruction or output..."
            @input="debouncedSearch"
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-secondary">Status:</label>
          <select v-model="filters.status" class="form-input" @change="loadSamples">
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-secondary">Source:</label>
          <select v-model="filters.source" class="form-input" @change="loadSamples">
            <option value="">All</option>
            <option v-for="source in availableSources" :key="source" :value="source">
              {{ formatSource(source) }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-secondary">Category:</label>
          <select v-model="filters.category" class="form-input" @change="loadSamples">
            <option value="">All</option>
            <option v-for="category in availableCategories" :key="category" :value="category">
              {{ formatCategory(category) }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-secondary">Sort:</label>
          <select v-model="filters.sort" class="form-input" @change="loadSamples">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="quality">Quality (High to Low)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      <p class="mt-2 text-secondary">Loading samples...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="samples.length === 0" class="card text-center py-12">
      <div class="text-6xl mb-4">📝</div>
      <h3 class="text-xl font-semibold mb-2">No samples yet</h3>
      <p class="text-secondary mb-4">
        Start building your dataset by creating your first training sample.
      </p>
      <NuxtLink :to="newSampleUrl" class="btn-primary"> Create First Sample </NuxtLink>
    </div>

    <!-- Samples Grid with Bulk Selection -->
    <div v-else class="space-y-4">
      <!-- Bulk Action Toolbar -->
      <div
        v-if="selectedIds.length > 0"
        class="card card border-gray-200 dark:border-gray-700 border-gray-300 dark:border-gray-700 sticky top-4 z-20"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              :checked="selectedIds.length === samples.length"
              class="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-gray-700 focus:ring-blue-500"
              @change="toggleSelectAll"
            />
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ selectedIds.length }} selected
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-gray-700 dark:text-gray-300">Bulk actions:</span>

            <select
              v-model="bulkAction.category"
              class="form-input text-sm py-1"
              @change="applyBulkCategory"
            >
              <option value="">Change Category...</option>
              <option v-for="category in availableCategories" :key="category" :value="category">
                {{ formatCategory(category) }}
              </option>
            </select>

            <select
              v-model="bulkAction.status"
              class="form-input text-sm py-1"
              @change="applyBulkStatus"
            >
              <option value="">Change Status...</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              class="btn-primary text-sm py-1 px-3"
              :disabled="applyingBulk"
              @click="applyBulkApprove"
            >
              ✅ Approve All
            </button>

            <button class="btn-secondary text-sm py-1 px-3" @click="clearSelection">Clear</button>
          </div>
        </div>
      </div>

      <div class="grid gap-4">
        <SampleCard
          v-for="sample in samples"
          :key="sample.id"
          :sample="sample"
          :is-selected="selectedIds.includes(sample.id)"
          @toggle-select="toggleSelect(sample.id)"
          @refresh="loadSamples"
        />
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="samples.length > 0" class="flex justify-between items-center card">
      <span class="text-sm text-secondary">
        Showing {{ samples.length }} of {{ pagination.total }} samples
      </span>
      <div class="flex gap-2">
        <button
          :disabled="pagination.offset === 0"
          class="btn-secondary"
          :class="{ 'opacity-50 cursor-not-allowed': pagination.offset === 0 }"
          @click="prevPage"
        >
          Previous
        </button>
        <button
          :disabled="!pagination.hasMore"
          class="btn-secondary"
          :class="{ 'opacity-50 cursor-not-allowed': !pagination.hasMore }"
          @click="nextPage"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, watch } from "vue";
  import { useRoute } from "vue-router";

  const route = useRoute();

  interface Sample {
    id: number;
    instruction: string;
    output: string;
    category: string;
    difficulty: string;
    qualityRating: number;
    status: "draft" | "review" | "approved" | "rejected";
    source: string;
    createdAt: string;
    updatedAt: string;
  }

  interface Stats {
    total: number;
    approved: number;
    draft: number;
    review?: number;
    rejected?: number;
    datasetGoalName?: string;
    datasetId?: number;
    datasetName?: string;
    globalDefaultGoal?: number;
    activeDatasetGoal?: number;
    activeDatasetName?: string;
    sources?: Record<string, number>;
    categories?: Record<string, number>;
    difficulties?: Record<string, number>;
    progress?: { current: number; target: number; percentage: number };
    avgQuality?: number;
    isActiveDataset?: boolean;
  }

  interface Pagination {
    total?: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }

  const loading = ref(true);
  const samples = ref<Sample[]>([]);
  const datasets = ref<any[]>([]);
  const stats = ref<Stats>({ total: 0, approved: 0, draft: 0, review: 0, rejected: 0 });
  const pagination = ref<Pagination>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  // Get current dataset ID from URL only (no active dataset fallback)
  const currentDatasetId = computed(() => {
    const urlDatasetId = route.query.dataset;
    if (urlDatasetId) {
      const id = parseInt(urlDatasetId as string);
      if (!isNaN(id)) return id;
    }
    return null;
  });

  // Get current dataset object from URL
  const currentDataset = computed(() => {
    const id = currentDatasetId.value;
    if (id) {
      return datasets.value.find((d) => d.id === id) || null;
    }
    return null;
  });

  // Generate New Sample URL with dataset parameter
  const newSampleUrl = computed(() => {
    const datasetId = currentDatasetId.value;
    if (datasetId) {
      return { path: "/samples/new", query: { dataset: datasetId.toString() } };
    }
    return "/samples/new";
  });

  // Get target goal from current dataset or default to 100
  const targetGoal = computed(() => {
    return currentDataset.value?.goalSamples || 100;
  });

  // Get goal name from current dataset or stats
  const goalName = computed(() => {
    return stats.value?.datasetGoalName || currentDataset.value?.goalName || "First Fine-Tuning";
  });

  const filters = reactive({
    search: "",
    status: "",
    source: "",
    category: "",
    sort: "newest",
  });

  // Available filter options from API
  const availableCategories = ref<string[]>([]);
  const availableSources = ref<string[]>([]);

  // Bulk operations state
  const selectedIds = ref<number[]>([]);
  const applyingBulk = ref(false);
  const bulkAction = reactive({
    category: "",
    status: "",
  });

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const progressPercentage = computed(() => {
    if (targetGoal.value === 0) return 0;
    return Math.round((stats.value.total / targetGoal.value) * 100);
  });

  // Bulk selection methods
  const toggleSelect = (id: number) => {
    const index = selectedIds.value.indexOf(id);
    if (index > -1) {
      selectedIds.value.splice(index, 1);
    } else {
      selectedIds.value.push(id);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.value.length === samples.value.length) {
      selectedIds.value = [];
    } else {
      selectedIds.value = samples.value.map((s) => s.id);
    }
  };

  const clearSelection = () => {
    selectedIds.value = [];
    bulkAction.category = "";
    bulkAction.status = "";
  };

  // Bulk operations
  const applyBulkCategory = async () => {
    if (!bulkAction.category || selectedIds.value.length === 0) return;

    applyingBulk.value = true;
    try {
      await $fetch("/api/samples/bulk-update", {
        method: "POST",
        body: {
          ids: selectedIds.value,
          category: bulkAction.category,
        },
      });

      // Update local state
      samples.value.forEach((sample) => {
        if (selectedIds.value.includes(sample.id)) {
          sample.category = bulkAction.category;
        }
      });

      bulkAction.category = "";
    } catch (error) {
      console.error("Failed to bulk update category:", error);
      alert("Failed to update category. Please try again.");
    } finally {
      applyingBulk.value = false;
    }
  };

  const applyBulkStatus = async () => {
    if (!bulkAction.status || selectedIds.value.length === 0) return;

    applyingBulk.value = true;
    try {
      await $fetch("/api/samples/bulk-update", {
        method: "POST",
        body: {
          ids: selectedIds.value,
          status: bulkAction.status,
        },
      });

      // Update local state
      samples.value.forEach((sample) => {
        if (selectedIds.value.includes(sample.id)) {
          sample.status = bulkAction.status as Sample["status"];
        }
      });

      bulkAction.status = "";
      loadSamples(); // Refresh to update stats
    } catch (error) {
      console.error("Failed to bulk update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      applyingBulk.value = false;
    }
  };

  const applyBulkApprove = async () => {
    if (selectedIds.value.length === 0) return;

    applyingBulk.value = true;
    try {
      await $fetch("/api/samples/bulk-update", {
        method: "POST",
        body: {
          ids: selectedIds.value,
          status: "approved",
        },
      });

      // Update local state
      samples.value.forEach((sample) => {
        if (selectedIds.value.includes(sample.id)) {
          sample.status = "approved";
        }
      });

      clearSelection();
      loadSamples(); // Refresh to update stats
    } catch (error) {
      console.error("Failed to bulk approve:", error);
      alert("Failed to approve samples. Please try again.");
    } finally {
      applyingBulk.value = false;
    }
  };

  const loadSamples = async () => {
    loading.value = true;

    try {
      const query: Record<string, string> = {
        limit: String(pagination.value.limit),
        offset: String(pagination.value.offset),
        sort: filters.sort,
      };

      // Use URL dataset parameter or fall back to active dataset
      const datasetId = currentDatasetId.value;
      if (datasetId) {
        query.datasetId = String(datasetId);
      }

      if (filters.status) query.status = filters.status;
      if (filters.source) query.source = filters.source;
      if (filters.category) query.category = filters.category;
      if (filters.search) query.search = filters.search;

      const response = (await $fetch("/api/samples", { query })) as any;
      samples.value = response.samples;
      pagination.value = response.pagination;

      // Update available filter options
      if (response.filters) {
        availableCategories.value = response.filters.categories || [];
        availableSources.value = response.filters.sources || [];
      }

      // Load stats for the current dataset
      await loadStats();
    } catch (error) {
      console.error("Error loading samples:", error);
    } finally {
      loading.value = false;
    }
  };

  const loadDatasets = async () => {
    try {
      const response = await $fetch("/api/datasets");
      datasets.value = response.datasets || [];
    } catch (error) {
      console.error("Error loading datasets:", error);
    }
  };

  const loadStats = async () => {
    try {
      const datasetId = currentDatasetId.value;
      const query = datasetId ? { datasetId: String(datasetId) } : {};
      const response = (await $fetch("/api/stats/overview", { query })) as any;
      stats.value = response;
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const debouncedSearch = () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      pagination.value.offset = 0;
      loadSamples();
    }, 300);
  };

  const prevPage = () => {
    if (pagination.value.offset > 0) {
      pagination.value.offset -= pagination.value.limit;
      loadSamples();
    }
  };

  const nextPage = () => {
    if (pagination.value.hasMore) {
      pagination.value.offset += pagination.value.limit;
      loadSamples();
    }
  };

  // Helper functions to format source and category display names
  const formatSource = (source: string) => {
    const sources: Record<string, string> = {
      manual: "Manual",
      import: "Import",
      json: "JSON",
      openwebui: "OpenWebUI",
      opencode: "OpenCode",
      capture: "Capture",
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
      factual: "Factual",
      tactical: "Tactical",
      character: "Character",
      emotional: "Emotional",
      summarization: "Summarization",
      roleplay: "Roleplay",
      technical: "Technical",
      commentary: "Commentary",
      creative_extension: "Creative Extension",
      tactical_advanced: "Tactical Advanced",
      relationships: "Relationships",
      fan_perspective: "Fan Perspective",
      database: "Database",
      testing: "Testing",
      devops: "DevOps",
      architecture: "Architecture",
    };
    return categories[category] || category;
  };

  onMounted(async () => {
    await loadDatasets();
    await loadSamples();
  });

  // Watch for dataset changes via URL parameter and reload data
  watch(
    () => route.query.dataset,
    async () => {
      await loadDatasets();
      await loadSamples();
    }
  );
</script>
