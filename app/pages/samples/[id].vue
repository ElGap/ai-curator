<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold mb-2">Edit Sample #{{ route.params.id }}</h1>
        <p class="text-secondary">Update your training sample details.</p>
      </div>
      <NuxtLink :to="backUrl" class="btn-secondary"> ← Back to Dataset </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      <p class="mt-2 text-secondary">Loading sample...</p>
    </div>

    <div v-else-if="error" class="card text-center py-12">
      <p class="text-red-600">{{ error }}</p>
      <NuxtLink :to="backUrl" class="btn-primary mt-4 inline-block"> Back to Dataset </NuxtLink>
    </div>

    <SampleForm v-else :initial-data="sample" @submit="handleUpdate" @cancel="handleCancel" />

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
          <h3 class="text-xl font-semibold mb-2">Success!</h3>
          <p class="text-secondary mb-6">Sample updated successfully!</p>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-center"
              @click="closeSuccessModalAndRedirect"
            >
              Back to Dataset
            </button>
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

  // Modal states
  const showSuccessModal = ref(false);
  const showErrorModal = ref(false);
  const errorModalMessage = ref("");

  const loadSample = async () => {
    try {
      loading.value = true;
      const response = await $fetch(`/api/samples/${route.params.id}`);
      sample.value = response.sample;
    } catch (err) {
      error.value = "Failed to load sample. It may have been deleted.";
      console.error("Error loading sample:", err);
    } finally {
      loading.value = false;
    }
  };

  const handleUpdate = async (formData) => {
    try {
      const response = await $fetch(`/api/samples/${route.params.id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.success) {
        showSuccessModal.value = true;
      }
    } catch (err) {
      console.error("Error updating sample:", err);
      errorModalMessage.value = err.message || "Failed to update sample. Please try again.";
      showErrorModal.value = true;
    }
  };

  const closeSuccessModal = () => {
    showSuccessModal.value = false;
  };

  const closeSuccessModalAndRedirect = () => {
    showSuccessModal.value = false;
    router.push(backUrl.value);
  };

  const closeErrorModal = () => {
    showErrorModal.value = false;
  };

  const handleCancel = () => {
    router.push(backUrl.value);
  };

  onMounted(() => {
    loadSample();
  });

  definePageMeta({
    layout: "default",
  });
</script>
