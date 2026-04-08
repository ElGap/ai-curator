<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Export Your Dataset</h1>
      <p class="text-secondary">
        Export your training samples in various formats compatible with popular fine-tuning tools.
      </p>
    </div>

    <!-- Dataset Selector & Stats -->
    <div class="card mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Dataset Selection -->
        <div>
          <label class="form-label">Dataset</label>
          <div v-if="loadingDatasets" class="text-sm text-secondary py-2">Loading...</div>
          <div v-else-if="datasets.length === 0" class="text-sm text-secondary py-2">
            No datasets available.
          </div>
          <select v-else v-model="selectedDataset" class="form-input w-full">
            <option v-for="dataset in datasets" :key="dataset.id" :value="dataset.id">
              {{ dataset.name }} ({{ dataset.sampleCount }} samples)
            </option>
          </select>
        </div>

        <!-- Quick Stats -->
        <div class="flex items-center gap-4">
          <div
            class="flex-1 text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div class="text-xl font-semibold text-gray-700 dark:text-gray-300">
              <span v-if="loadingStats">-</span>
              <span v-else>{{ stats.approved }}</span>
            </div>
            <div class="text-xs text-secondary">Approved</div>
          </div>
          <div
            class="flex-1 text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div class="text-xl font-semibold text-gray-700 dark:text-gray-300">
              <span v-if="loadingStats">-</span>
              <span v-else>{{ stats.total }}</span>
            </div>
            <div class="text-xs text-secondary">Total</div>
          </div>
          <div
            class="flex-1 text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div class="text-xl font-semibold text-gray-700 dark:text-gray-300">
              <span v-if="loadingStats">-</span>
              <span v-else>{{ stats.avgQuality.toFixed(1) }}</span>
            </div>
            <div class="text-xs text-secondary">Avg Quality</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Format Selection -->
    <div class="card mb-6">
      <label class="form-label mb-4">Select Export Format</label>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          v-for="fmt in formats"
          :key="fmt.id"
          class="p-4 border rounded-lg text-left transition-all text-left w-full"
          :class="[
            selectedFormat === fmt.id
              ? 'border-gray-400 bg-gray-50 dark:bg-gray-700/50'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
          ]"
          @click="selectedFormat = fmt.id"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">{{ fmt.icon }}</span>
            <span class="font-semibold">{{ fmt.name }}</span>
          </div>
          <p class="text-sm text-secondary">{{ fmt.description }}</p>
          <p class="text-xs text-tertiary mt-2">{{ fmt.compatibility }}</p>
          <div
            v-if="selectedFormat === fmt.id"
            class="mt-3 flex items-center gap-1 text-gray-600 dark:text-gray-300 text-sm font-medium"
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Selected
          </div>
        </button>
      </div>
    </div>

    <!-- Quick Export Actions -->
    <div class="card">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-lg font-semibold">Ready to Export</h2>
          <p class="text-sm text-secondary">
            {{ formats.find((f) => f.id === selectedFormat)?.name }} format selected
          </p>
        </div>
        <button
          :disabled="exporting || loadingDatasets || loadingStats || stats.total === 0"
          class="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-black transition-colors"
          :class="{
            'opacity-50 cursor-not-allowed':
              exporting || loadingDatasets || loadingStats || stats.total === 0,
          }"
          @click="exportDataset"
        >
          <span v-if="exporting">Exporting...</span>
          <span v-else-if="loadingDatasets || loadingStats">Loading...</span>
          <span v-else>📤 Export {{ formats.find((f) => f.id === selectedFormat)?.name }}</span>
        </button>
      </div>

      <!-- Success Message -->
      <div
        v-if="lastExport"
        class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">
              ✓ Exported {{ lastExport.count }} samples ({{ lastExport.format }} format)
            </span>
            <span v-if="lastExport.splits" class="text-sm text-secondary ml-2">
              ({{ lastExport.splits.train.count }} train /
              {{ lastExport.splits.validation.count }} val)
            </span>
          </div>
        </div>
        <div v-if="!lastExport.splits">
          <button
            class="w-full inline-flex items-center justify-center px-4 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-black transition-colors"
            @click="downloadFile(lastExport.data, lastExport.filename)"
          >
            <span class="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download {{ lastExport.filename }}
            </span>
          </button>
        </div>
        <div v-else class="flex gap-3">
          <button
            class="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-black transition-colors"
            @click="downloadFile(lastExport.splits.train.data, lastExport.splits.train.filename)"
          >
            <span class="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download {{ lastExport.splits.train.filename }}
            </span>
          </button>
          <button
            class="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            @click="
              downloadFile(lastExport.splits.validation.data, lastExport.splits.validation.filename)
            "
          >
            <span class="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download {{ lastExport.splits.validation.filename }}
            </span>
          </button>
        </div>
      </div>

      <!-- Advanced Options Toggle -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          class="flex items-center gap-2 text-sm text-secondary hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          @click="showAdvanced = !showAdvanced"
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
            :class="{ 'rotate-180': showAdvanced }"
            class="transition-transform"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          {{ showAdvanced ? "Hide" : "Show" }} Advanced Options
        </button>

        <!-- Advanced Filters -->
        <div v-if="showAdvanced" class="mt-4 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="form-label text-sm">Status</label>
              <select v-model="filters.status" class="form-input text-sm">
                <option value="all">All Samples</option>
                <option value="approved">Approved Only</option>
                <option value="draft">Drafts</option>
                <option value="review">In Review</option>
              </select>
            </div>

            <div>
              <label class="form-label text-sm">Min Quality</label>
              <select v-model="filters.minQuality" class="form-input text-sm">
                <option :value="undefined">Any</option>
                <option :value="3">⭐⭐⭐ 3+</option>
                <option :value="4">⭐⭐⭐⭐ 4+</option>
                <option :value="5">⭐⭐⭐⭐⭐ 5 only</option>
              </select>
            </div>

            <div>
              <label class="form-label text-sm">Train/Val Split</label>
              <select v-model="filters.split" class="form-input text-sm">
                <option v-for="split in splits" :key="split.value" :value="split.value">
                  {{ split.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="filters.includeMetadata"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300"
              />
              Include metadata
            </label>
            <button class="text-sm text-secondary hover:text-gray-800" @click="resetFilters">
              Reset to defaults
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CLI Export Section -->
    <div class="card mt-6">
      <div class="flex items-center gap-4 mb-4">
        <div
          class="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center"
        >
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
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-lg text-gray-900 dark:text-white">CLI Export</h3>
          <p class="text-sm text-secondary">Export from command line for automation</p>
        </div>
      </div>

      <p class="text-secondary text-sm mb-4">
        Use the CLI to export datasets with filters, train/val splits, and multiple formats. Perfect
        for CI/CD pipelines and automated workflows.
      </p>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
        <div class="text-gray-400"># Export approved samples (Alpaca format)</div>
        <div class="text-green-400">
          curator export --format alpaca --filter "status=approved" --output train.json --dataset
          {{ selectedDataset || 1 }}
        </div>
        <div class="text-gray-400 mt-2"># Export with train/val split for MLX-LM</div>
        <div class="text-green-400">
          curator export --format mlx --split "80-20" --output dataset.jsonl --dataset
          {{ selectedDataset || 1 }}
        </div>
        <div class="text-gray-400 mt-2"># Export high quality samples only</div>
        <div class="text-green-400">
          curator export --filter "quality>=4" --output premium.json --dataset
          {{ selectedDataset || 1 }}
        </div>
        <div class="text-gray-400 mt-2"># Export as JSON Lines for streaming</div>
        <div class="text-green-400">
          curator export --format jsonl --output train.jsonl --dataset {{ selectedDataset || 1 }}
        </div>
      </div>

      <NuxtLink
        to="/docs/cli"
        class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
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
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
        View CLI documentation →
      </NuxtLink>
    </div>

    <!-- Error Modal -->
    <div
      v-if="showErrorModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeErrorModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        <div class="text-center">
          <div
            class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-red-600 dark:text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" x2="9" y1="9" y2="15" />
              <line x1="9" x2="15" y1="9" y2="15" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Export Error</h3>
          <p class="text-secondary mb-6">{{ errorMessage }}</p>
          <button
            class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            @click="closeErrorModal"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from "vue";
  import { useRoute } from "vue-router";

  const route = useRoute();

  const formats = [
    {
      id: "alpaca",
      name: "Alpaca",
      icon: "🦙",
      description: "Standard format for instruction tuning",
      compatibility: "LLaMA-Factory, Axolotl, HuggingFace",
    },
    {
      id: "mlx",
      name: "MLX-LM",
      icon: "🍎",
      description: "Chat format for Apple MLX-LM",
      compatibility: "Apple Silicon - ready to use",
    },
    {
      id: "jsonl",
      name: "JSON Lines",
      icon: "📝",
      description: "One JSON per line, streaming-friendly",
      compatibility: "General purpose, large datasets",
    },
    {
      id: "json",
      name: "Extended JSON",
      icon: "📄",
      description: "Single file with full metadata and stats",
      compatibility: "Complete export with quality metrics",
    },
  ];

  const splits = [
    { value: "none", label: "No Split" },
    { value: "90-10", label: "90% Train / 10% Val" },
    { value: "80-20", label: "80% Train / 20% Val" },
    { value: "70-30", label: "70% Train / 30% Val" },
  ];

  // UI state
  const showAdvanced = ref(false);
  const showErrorModal = ref(false);
  const errorMessage = ref("");

  // Data
  const selectedFormat = ref("alpaca");
  const exporting = ref(false);
  const lastExport = ref<any>(null);
  const selectedDataset = ref<number | null>(null);
  const datasets = ref<any[]>([]);
  const loadingDatasets = ref(true);
  const loadingStats = ref(false);

  const filters = ref({
    status: "approved",
    minQuality: undefined as number | undefined,
    split: "none",
    includeMetadata: true,
  });

  const stats = ref({
    total: 0,
    approved: 0,
    draft: 0,
    review: 0,
    avgQuality: 0,
  });

  const loadDatasets = async () => {
    try {
      loadingDatasets.value = true;
      const response = await $fetch("/api/datasets");
      datasets.value = response.datasets || [];

      // Check if URL has a dataset parameter
      const urlDatasetId = route.query.dataset;
      if (urlDatasetId) {
        const id = parseInt(urlDatasetId as string);
        const found = datasets.value.find((d) => d.id === id);
        if (found) {
          selectedDataset.value = id;
        } else {
          selectFirstDataset();
        }
      } else {
        selectFirstDataset();
      }

      await loadStats();
    } catch (error) {
      console.error("Error loading datasets:", error);
    } finally {
      loadingDatasets.value = false;
    }
  };

  const selectFirstDataset = () => {
    const activeDataset = datasets.value.find((d) => d.isActive === 1);
    if (activeDataset) {
      selectedDataset.value = activeDataset.id;
    } else if (datasets.value.length > 0) {
      selectedDataset.value = datasets.value[0].id;
    }
  };

  // Watch for URL dataset changes
  watch(
    () => route.query.dataset,
    async (newDatasetId) => {
      if (newDatasetId && datasets.value.length > 0) {
        const id = parseInt(newDatasetId as string);
        const found = datasets.value.find((d) => d.id === id);
        if (found && selectedDataset.value !== id) {
          selectedDataset.value = id;
          lastExport.value = null;
          await loadStats();
        }
      }
    }
  );

  const loadStats = async () => {
    if (!selectedDataset.value) return;

    loadingStats.value = true;
    try {
      const response: any = await $fetch(`/api/datasets/${selectedDataset.value}/stats`);
      stats.value = {
        total: response?.total || 0,
        approved: response?.approved || 0,
        draft: response?.draft || 0,
        review: response?.review || 0,
        avgQuality: response?.avgQuality || 0,
      };
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      loadingStats.value = false;
    }
  };

  // Watch for dataset changes and reload stats
  watch(selectedDataset, async () => {
    if (selectedDataset.value) {
      lastExport.value = null;
      await loadStats();
    }
  });

  // Watch for format changes and clear export
  watch(selectedFormat, () => {
    lastExport.value = null;
  });

  const exportDataset = async () => {
    if (!selectedDataset.value) {
      errorMessage.value = "Please select a dataset";
      showErrorModal.value = true;
      return;
    }

    exporting.value = true;

    try {
      const body: any = {
        format: selectedFormat.value,
        status: filters.value.status,
        split: filters.value.split,
        minQuality: filters.value.minQuality,
        includeMetadata: filters.value.includeMetadata,
        datasetId: selectedDataset.value,
      };

      const response = await $fetch("/api/export", {
        method: "POST",
        body,
      });

      lastExport.value = response;
    } catch (error) {
      console.error("Error exporting:", error);
      errorMessage.value = "Export failed. Please try again.";
      showErrorModal.value = true;
    } finally {
      exporting.value = false;
    }
  };

  const downloadFile = (data: any, filename: string) => {
    let content: string;
    let mimeType: string;

    if (typeof data === "string") {
      content = data;
      mimeType = "application/jsonl";
    } else {
      content = JSON.stringify(data, null, 2);
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    filters.value = {
      status: "approved",
      minQuality: undefined,
      split: "none",
      includeMetadata: true,
    };
  };

  const closeErrorModal = () => {
    showErrorModal.value = false;
    errorMessage.value = "";
  };

  onMounted(() => {
    loadDatasets();
  });

  definePageMeta({
    layout: "default",
  });
</script>
