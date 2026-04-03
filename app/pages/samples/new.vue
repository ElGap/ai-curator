<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Create New Training Sample</h1>
      <p class="text-secondary">
        Add a new sample to your dataset. All fields help you build a better training dataset.
      </p>
    </div>

    <SampleForm @submit="handleSubmit" @cancel="handleCancel" />

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
          <h3 class="text-xl font-semibold mb-2">{{ successTitle }}</h3>
          <p class="text-secondary mb-6">{{ successMessage }}</p>
          <button
            class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            @click="closeSuccessModalAndRedirect"
          >
            Back to Dataset
          </button>
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

    <!-- Cancel Confirmation Modal -->
    <div
      v-if="showCancelModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeCancelModal"
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
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" x2="12" y1="9" y2="13" />
              <line x1="12" x2="12.01" y1="17" y2="17" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Discard Changes?</h3>
          <p class="text-secondary mb-6">
            Are you sure you want to cancel? Any unsaved changes will be lost.
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="closeCancelModal"
            >
              Keep Editing
            </button>
            <button
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              @click="confirmCancel"
            >
              Discard
            </button>
          </div>
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

  // Modal states
  const showSuccessModal = ref(false);
  const showErrorModal = ref(false);
  const showCancelModal = ref(false);
  const successTitle = ref("");
  const successMessage = ref("");
  const errorModalMessage = ref("");

  const handleSubmit = async (formData) => {
    try {
      const response = await $fetch("/api/samples", {
        method: "POST",
        body: {
          ...formData,
          status: "approved",
          datasetId: route.query.dataset ? parseInt(route.query.dataset) : undefined,
        },
      });

      if (response.success) {
        successTitle.value = "Success!";
        successMessage.value = "Sample created and approved successfully!";
        showSuccessModal.value = true;
      }
    } catch (error) {
      console.error("Error creating sample:", error);
      errorModalMessage.value = error.message || "Failed to create sample. Please try again.";
      showErrorModal.value = true;
    }
  };

  const handleCancel = () => {
    showCancelModal.value = true;
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

  const closeCancelModal = () => {
    showCancelModal.value = false;
  };

  const confirmCancel = () => {
    showCancelModal.value = false;
    router.push(backUrl.value);
  };

  // Close modals on Escape key
  onMounted(() => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        showSuccessModal.value = false;
        showErrorModal.value = false;
        showCancelModal.value = false;
      }
    });
  });

  definePageMeta({
    layout: "default",
  });
</script>
