<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold mb-2">Edit Sample #{{ route.params.id }}</h1>
        <p class="text-secondary">Update your training sample details.</p>
      </div>
      <NuxtLink
        :to="{ path: `/samples/${route.params.id}`, query: route.query }"
        class="btn-secondary"
      >
        ← Cancel
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      <p class="mt-2 text-secondary">Loading sample...</p>
    </div>

    <div v-else-if="error" class="card text-center py-12">
      <p class="text-red-600">{{ error }}</p>
      <NuxtLink :to="backUrl" class="btn-primary mt-4 inline-block"> Back to Dataset </NuxtLink>
    </div>

    <SampleForm
      v-if="!loading && !error"
      :key="sample?.id"
      :initial-data="sample"
      :prev-id="prevId"
      :next-id="nextId"
      :loading="navLoading"
      :available-categories="availableCategories"
      @submit="handleUpdate"
      @cancel="handleCancel"
      @navigate="loadSampleById"
    />

    <!-- Success Modal -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeSuccessModal"
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ successTitle || "Success!" }}</h3>
          <p class="text-secondary mb-6">{{ successMessage || "Sample updated successfully!" }}</p>
          <div class="flex flex-col gap-2">
            <div class="flex gap-3">
              <NuxtLink
                :to="{ path: `/samples/${route.params.id}`, query: route.query }"
                class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-center"
              >
                View Sample
              </NuxtLink>
              <NuxtLink
                :to="backUrl"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-center"
              >
                Back to Dataset
              </NuxtLink>
            </div>
            <NuxtLink
              :to="{ path: '/samples/new', query: route.query }"
              class="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-center flex items-center justify-center gap-2"
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
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create New Sample
            </NuxtLink>
          </div>
        </div>
      </div>
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
          <h3 class="text-xl font-semibold mb-2">Error</h3>
          <p class="text-secondary mb-6">{{ errorModalMessage }}</p>
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

<script setup>
  const route = useRoute();
  const router = useRouter();

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
  const sample = ref(null);
  const navLoading = ref(false);
  const availableCategories = ref([]);

  // Navigation state
  const prevId = ref(null);
  const nextId = ref(null);

  // Modal states
  const showSuccessModal = ref(false);
  const showErrorModal = ref(false);
  const errorModalMessage = ref("");
  const successTitle = ref("");
  const successMessage = ref("");

  const loadSample = async () => {
    const id = route.params.id;
    await loadSampleById(id);
  };

  const loadSampleById = async (id) => {
    if (!id) {
      return;
    }

    try {
      navLoading.value = true;
      loading.value = true;
      sample.value = null;

      // Load the sample - API now returns prevId and nextId
      const response = await $fetch(`/api/samples/${id}`);

      sample.value = response.sample;
      prevId.value = response.prevId;
      nextId.value = response.nextId;

      // Fetch available categories for this dataset
      if (sample.value?.datasetId) {
        try {
          const statsResponse = await $fetch(`/api/datasets/${sample.value.datasetId}/stats`);
          if (statsResponse.categories) {
            availableCategories.value = Object.keys(statsResponse.categories);
          }
        } catch (err) {
          console.error("Error loading categories:", err);
        }
      }

      // Update URL if navigating to different sample
      const currentRouteId = parseInt(route.params.id);
      const newId = parseInt(id);

      if (newId !== currentRouteId) {
        router.replace({ path: `/samples/${id}/edit`, query: route.query });
      }
    } catch (err) {
      error.value = "Failed to load sample. It may have been deleted.";
      console.error("Error loading sample:", err);
    } finally {
      loading.value = false;
      navLoading.value = false;
    }
  };

  const handleUpdate = async (formData) => {
    // Create a clean copy of the data
    const dataToSend = JSON.parse(JSON.stringify(formData));

    // Ensure tags is always an array
    if (typeof dataToSend.tags === "string") {
      try {
        dataToSend.tags = JSON.parse(dataToSend.tags);
      } catch (_e) {
        dataToSend.tags = [];
      }
    } else if (!Array.isArray(dataToSend.tags)) {
      dataToSend.tags = [];
    }

    try {
      const response = await $fetch(`/api/samples/${route.params.id}`, {
        method: "PUT",
        body: dataToSend,
      });

      if (response.success) {
        showSuccessModal.value = true;
      }
    } catch (error) {
      console.error("Error updating sample:", error);
      errorModalMessage.value = error.message || "Failed to update sample. Please try again.";
      showErrorModal.value = true;
    }
  };

  const closeSuccessModal = () => {
    showSuccessModal.value = false;
    successTitle.value = "";
    successMessage.value = "";
  };

  const closeErrorModal = () => {
    showErrorModal.value = false;
  };

  const handleCancel = () => {
    router.push(backUrl.value);
  };

  onMounted(() => {
    loadSample();

    // Close modals on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        showSuccessModal.value = false;
        showErrorModal.value = false;
      }
    });
  });

  // Watch for route changes and reload sample
  watch(
    () => route.params.id,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        loadSampleById(newId);
      }
    }
  );

  definePageMeta({
    layout: "default",
  });
</script>
