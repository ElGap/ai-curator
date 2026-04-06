<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Import Data</h1>
      <p class="text-secondary">Import training examples to build your dataset.</p>
    </div>

    <!-- Dataset Selector -->
    <div class="card mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
        Select Dataset to Import To
      </label>
      <div v-if="loadingDatasets" class="text-sm text-secondary py-2">Loading datasets...</div>
      <div v-else-if="datasets.length === 0" class="text-sm text-secondary py-2">
        No datasets available. Create a dataset first.
      </div>
      <select
        v-else
        v-model="selectedDataset"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
      >
        <option v-for="dataset in datasets" :key="dataset.id" :value="dataset.id">
          {{ dataset.name }} - {{ dataset.sampleCount }} samples
        </option>
      </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Upload JSON -->
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
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
              class="text-gray-700 dark:text-gray-300"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-lg">Upload JSON File</h3>
            <p class="text-sm text-secondary">Import your own training data</p>
          </div>
        </div>
        <p class="text-secondary text-sm mb-4">
          Upload a JSON file with training examples in Alpaca or ShareGPT format. Preview and import
          into your active dataset.
        </p>
        <NuxtLink
          :to="{ path: '/import/json', query: { dataset: selectedDataset } }"
          class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors no-underline"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          Upload JSON File
        </NuxtLink>
      </div>

      <!-- Live Capture -->
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
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
              class="text-gray-600 dark:text-gray-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" x2="22" y1="12" y2="12" />
              <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
              />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-lg">Live Capture</h3>
            <p class="text-sm text-secondary">Real-time conversation capture</p>
          </div>
        </div>
        <p class="text-secondary text-sm mb-4">
          Configure the default dataset for live capture from OpenCode, OpenWebUI, and other tools.
          Plugins can override this setting.
        </p>
        <div class="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Active Dataset for Live Capture
              </p>
              <p class="text-2xl font-bold text-gray-700 dark:text-gray-300 truncate">
                {{ captureDefault?.datasetName || "Loading..." }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
                <span v-if="captureDefault?.datasetSampleCount !== undefined"
                  >{{ captureDefault.datasetSampleCount }} samples captured</span
                >
              </p>
            </div>
            <button
              class="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ml-3 flex-shrink-0"
              @click="openCaptureModal"
            >
              Configure
            </button>
          </div>
          <div
            class="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3"
          >
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium"
              title="Use this ID for CLI commands: curator --dataset {{ captureDefault?.datasetId }}"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              ID: {{ captureDefault?.datasetId || "-" }}
            </span>
            <span class="flex items-center gap-1">
              <span
                class="w-2 h-2 rounded-full"
                :class="captureDefault?.isEnabled === false ? 'bg-gray-400' : 'bg-gray-600'"
              ></span>
              {{ captureDefault?.isEnabled === false ? "Disabled" : "Enabled" }}
            </span>
            <span class="flex items-center gap-1">
              <span
                class="w-2 h-2 rounded-full"
                :class="
                  captureDefault?.defaultStatus === 'approved' ? 'bg-gray-600' : 'bg-gray-400'
                "
              ></span>
              Status: {{ captureDefault?.defaultStatus || "draft" }}
            </span>
            <span class="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="text-yellow-400"
              >
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                />
              </svg>
              Quality: {{ captureDefault?.defaultQuality || 3 }}/5
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- CLI Import Section -->
    <div class="card mt-6">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
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
            class="text-gray-700 dark:text-gray-300"
          >
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-lg text-gray-900 dark:text-white">CLI Import</h3>
          <p class="text-sm text-secondary">Import from command line</p>
        </div>
      </div>
      <p class="text-secondary text-sm mb-4">
        Use the CLI to import large files, search and download from Kaggle and Hugging Face, or
        automate imports.
      </p>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
        <div class="text-gray-400"># Import local file</div>
        <div class="text-green-400">
          curator import data.json --dataset {{ selectedDataset || 1 }}
        </div>
        <div class="text-gray-400 mt-2"># Search and download from Kaggle</div>
        <div class="text-green-400">curator search "python" --source kaggle</div>
        <div class="text-green-400">
          curator download kaggle:owner/dataset --dataset {{ selectedDataset || 1 }}
        </div>
        <div class="text-gray-400 mt-2"># Import large files with workers</div>
        <div class="text-green-400">curator import large-dataset.jsonl --workers 8</div>
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
        View full CLI documentation
      </NuxtLink>
    </div>

    <!-- Success Modal -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showSuccessModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        <div class="text-center">
          <div
            class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"
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
              class="text-gray-700 dark:text-gray-400"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ successTitle }}</h3>
          <p class="text-secondary mb-6">{{ successMessage }}</p>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="showSuccessModal = false"
            >
              Stay Here
            </button>
            <NuxtLink
              to="/samples"
              class="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center no-underline"
            >
              View Samples
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <div
      v-if="showErrorModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showErrorModal = false"
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
          <h3 class="text-xl font-semibold mb-2">Error</h3>
          <p class="text-secondary mb-6">{{ errorModalMessage }}</p>
          <button
            class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            @click="showErrorModal = false"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Live Capture Configuration Modal -->
    <div
      v-if="showCaptureModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCaptureModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl w-full">
        <div class="text-center">
          <div
            class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
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
              class="text-blue-600 dark:text-blue-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" x2="22" y1="12" y2="12" />
              <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Live Capture Settings</h3>
          <p class="text-secondary mb-6">
            Select the default dataset where live captures will be stored.
          </p>

          <!-- Enable/Disable Toggle -->
          <div class="text-left mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Live Capture Status
            </label>
            <div class="flex items-center gap-3">
              <button
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedCaptureEnabled
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600',
                ]"
                @click="selectedCaptureEnabled = true"
              >
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Enabled
                </span>
              </button>
              <button
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  !selectedCaptureEnabled
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600',
                ]"
                @click="selectedCaptureEnabled = false"
              >
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Disabled
                </span>
              </button>
            </div>
            <p v-if="!selectedCaptureEnabled" class="text-xs text-red-600 dark:text-red-400 mt-2">
              When disabled, all capture requests will be rejected with a 503 error.
            </p>
            <p v-else class="text-xs text-green-600 dark:text-green-400 mt-2">
              Live capture is active and accepting requests.
            </p>
          </div>

          <!-- Current Setting -->
          <div class="text-left mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Dataset for Capture
            </label>
            <div v-if="loadingCaptureDefault" class="text-sm text-secondary py-2">Loading...</div>
            <select
              v-else
              v-model="selectedCaptureDataset"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option v-for="dataset in datasets" :key="dataset.id" :value="dataset.id">
                {{ dataset.name }} ({{ dataset.sampleCount || 0 }} samples)
              </option>
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Plugins can override this setting. Captures without a specific dataset will use this
              default.
            </p>
          </div>

          <!-- Default Status -->
          <div class="text-left mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Status
            </label>
            <div class="flex gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="selectedCaptureStatus"
                  type="radio"
                  value="draft"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Draft (manual review)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="selectedCaptureStatus"
                  type="radio"
                  value="approved"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Approved (auto)</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Draft captures require manual review. Approved captures are ready for export.
            </p>
          </div>

          <!-- Default Quality -->
          <div class="text-left mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Quality Rating
            </label>
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                class="p-1 hover:scale-110 transition-transform"
                @click="selectedCaptureQuality = star"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  :class="
                    star <= selectedCaptureQuality
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  "
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  />
                </svg>
              </button>
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {{ selectedCaptureQuality }} star{{ selectedCaptureQuality !== 1 ? "s" : "" }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Default quality rating for captured samples. Plugins can override.
            </p>
          </div>

          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              @click="showCaptureModal = false"
            >
              Cancel
            </button>
            <button
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              :disabled="savingCaptureDefault || loadingCaptureDefault"
              @click="saveCaptureDefault"
            >
              {{ savingCaptureDefault ? "Saving..." : "Save" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from "vue";
  import { useRoute } from "vue-router";

  const route = useRoute();

  // Modal states
  const showSuccessModal = ref(false);
  const showErrorModal = ref(false);
  const successTitle = ref("");
  const successMessage = ref("");
  const errorModalMessage = ref("");

  // Dataset selection
  const selectedDataset = ref(null);
  const datasets = ref([]);
  const loadingDatasets = ref(true);

  const loadDatasets = async () => {
    try {
      loadingDatasets.value = true;
      const response = await $fetch("/api/datasets");
      datasets.value = response.datasets || [];

      // Check if URL has a dataset parameter
      const urlDatasetId = route.query.dataset;
      if (urlDatasetId) {
        const id = parseInt(urlDatasetId);
        // Verify the dataset exists in our list
        const found = datasets.value.find((d) => d.id === id);
        if (found) {
          selectedDataset.value = id;
        } else {
          // Fall back to active dataset
          const activeDataset = datasets.value.find((d) => d.isActive === 1);
          if (activeDataset) {
            selectedDataset.value = activeDataset.id;
          } else if (datasets.value.length > 0) {
            selectedDataset.value = datasets.value[0].id;
          }
        }
      } else {
        // Preselect the active dataset or the first one
        const activeDataset = datasets.value.find((d) => d.isActive === 1);
        if (activeDataset) {
          selectedDataset.value = activeDataset.id;
        } else if (datasets.value.length > 0) {
          selectedDataset.value = datasets.value[0].id;
        }
      }
    } catch (error) {
      console.error("Error loading datasets:", error);
    } finally {
      loadingDatasets.value = false;
    }
  };

  // Watch for URL dataset changes
  watch(
    () => route.query.dataset,
    (newDatasetId) => {
      if (newDatasetId && datasets.value.length > 0) {
        const id = parseInt(newDatasetId);
        const found = datasets.value.find((d) => d.id === id);
        if (found) {
          selectedDataset.value = id;
        }
      }
    }
  );

  // Live Capture configuration
  const showCaptureModal = ref(false);
  const captureDefault = ref(null);
  const selectedCaptureDataset = ref(null);
  const selectedCaptureStatus = ref("draft");
  const selectedCaptureQuality = ref(3);
  const selectedCaptureEnabled = ref(true);
  const loadingCaptureDefault = ref(false);
  const savingCaptureDefault = ref(false);

  const loadCaptureDefault = async () => {
    try {
      loadingCaptureDefault.value = true;
      const response = await $fetch("/api/settings/capture-default");
      if (response.success) {
        captureDefault.value = response;
        selectedCaptureDataset.value = response.datasetId;
        selectedCaptureStatus.value = response.defaultStatus || "draft";
        selectedCaptureQuality.value = response.defaultQuality || 3;
        selectedCaptureEnabled.value = response.isEnabled ?? true;
      }
    } catch (error) {
      console.error("Error loading capture default:", error);
    } finally {
      loadingCaptureDefault.value = false;
    }
  };

  const openCaptureModal = () => {
    showCaptureModal.value = true;
    loadCaptureDefault();
  };

  const saveCaptureDefault = async () => {
    if (!selectedCaptureDataset.value) return;

    try {
      savingCaptureDefault.value = true;
      const response = await $fetch("/api/settings/capture-default", {
        method: "PUT",
        body: {
          datasetId: selectedCaptureDataset.value,
          defaultStatus: selectedCaptureStatus.value,
          defaultQuality: selectedCaptureQuality.value,
          isEnabled: selectedCaptureEnabled.value,
        },
      });

      if (response.success) {
        captureDefault.value = {
          datasetId: response.datasetId,
          datasetName: response.datasetName,
          datasetSampleCount: captureDefault.value?.datasetSampleCount || 0,
          defaultStatus: response.defaultStatus,
          defaultQuality: response.defaultQuality,
          isEnabled: response.isEnabled,
        };
        showCaptureModal.value = false;

        // Reload to ensure data is fresh
        await loadCaptureDefault();
      }
    } catch (error) {
      console.error("Error saving capture default:", error);
      errorModalMessage.value = error.message || "Failed to save settings. Please try again.";
      showErrorModal.value = true;
    } finally {
      savingCaptureDefault.value = false;
    }
  };

  onMounted(() => {
    loadDatasets();
    loadCaptureDefault();

    // Close modals on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        showSuccessModal.value = false;
        showErrorModal.value = false;
        showCaptureModal.value = false;
      }
    });
  });

  definePageMeta({
    layout: "default",
  });
</script>
