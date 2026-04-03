<template>
  <div
    class="card hover:shadow-md transition-shadow"
    :class="{ 'ring-2 ring-blue-400': isSelected }"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <!-- Bulk Selection Checkbox -->
        <input
          v-if="isSelected !== undefined"
          type="checkbox"
          :checked="isSelected"
          class="w-5 h-5 rounded border-gray-300 text-gray-700 focus:ring-blue-500"
          @change="$emit('toggleSelect')"
        />
        <span class="text-lg font-bold text-gray-400 dark:text-gray-500">#{{ sample.id }}</span>
        <span class="px-2 py-1 text-xs rounded-full font-medium" :class="sourceClass">
          {{ formatSource(sample.source) }}
        </span>
        <div class="flex items-center gap-1">
          <span v-for="i in sample.qualityRating" :key="i" class="text-yellow-400">⭐</span>
        </div>
        <span class="px-2 py-1 text-xs rounded-full font-medium" :class="statusClass">
          {{ formatStatus(sample.status) }}
        </span>
      </div>

      <div class="flex gap-2">
        <button
          v-if="sample.status !== 'approved'"
          :disabled="actionLoading"
          class="text-gray-700 hover:text-gray-800 p-1 dark:text-gray-400 dark:hover:text-gray-100"
          title="Approve"
          @click="showApproveModal = true"
        >
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
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <NuxtLink
          :to="viewUrl"
          class="text-gray-700 hover:text-gray-800 p-1 dark:text-gray-400 dark:hover:text-gray-100"
          title="View/Edit"
        >
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
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </NuxtLink>
        <button
          :disabled="actionLoading"
          class="text-gray-700 hover:text-gray-800 p-1 dark:text-gray-400 dark:hover:text-gray-100"
          title="Delete"
          @click="showDeleteModal = true"
        >
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
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Instruction Preview -->
    <div class="mb-3">
      <p class="text-gray-900 dark:text-gray-100 font-medium line-clamp-3">
        "{{ truncate(sample.instruction, 300) }}"
      </p>
    </div>

    <!-- Metadata -->
    <div class="flex flex-wrap gap-4 text-sm text-secondary">
      <span class="flex items-center gap-1">
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
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        {{ formatCategory(sample.category) }}
      </span>
      <span class="flex items-center gap-1">
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
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        {{ formatDifficulty(sample.difficulty) }}
      </span>
      <span
        v-if="sample.model"
        class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"
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
          <path d="M2 12l10 5 10-5" />
        </svg>
        {{ sample.model }}
      </span>
      <span class="flex items-center gap-1">
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
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {{ formatDate(sample.createdAt) }}
      </span>
    </div>

    <!-- Delete Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showDeleteModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4" @click.stop>
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
          >
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
              class="text-gray-700"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold">Delete Training Sample</h3>
        </div>
        <p class="text-secondary mb-6">
          Are you sure you want to delete training sample #{{ sample.id }}? This action cannot be
          undone.
        </p>
        <div class="flex gap-3">
          <button
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="showDeleteModal = false"
          >
            Cancel
          </button>
          <button
            :disabled="actionLoading"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            @click="deleteSample"
          >
            {{ actionLoading ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Approve Modal -->
    <div
      v-if="showApproveModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showApproveModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4" @click.stop>
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
          >
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
              class="text-gray-700"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold">Approve Training Sample</h3>
        </div>
        <p class="text-secondary mb-6">
          Are you sure you want to approve training sample #{{ sample.id }}? This will mark it as
          ready for training.
        </p>
        <div class="flex gap-3">
          <button
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="showApproveModal = false"
          >
            Cancel
          </button>
          <button
            :disabled="actionLoading"
            class="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
            @click="approveSample"
          >
            {{ actionLoading ? "Approving..." : "Approve" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from "vue";
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
    model?: string;
    createdAt: string;
    updatedAt: string;
  }

  const props = defineProps<{
    sample: Sample;
    isSelected?: boolean;
  }>();

  const emit = defineEmits<{
    refresh: [];
    toggleSelect: [];
  }>();

  const actionLoading = ref(false);
  const showDeleteModal = ref(false);
  const showApproveModal = ref(false);

  // Generate view URL with dataset parameter preserved
  const viewUrl = computed(() => {
    const datasetId = route.query.dataset;
    if (datasetId) {
      return { path: `/samples/${props.sample.id}`, query: { dataset: datasetId as string } };
    }
    return `/samples/${props.sample.id}`;
  });

  const sourceClass = computed(() => {
    const classes: Record<string, string> = {
      manual: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      json: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      opencode: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
      openwebui: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    };
    return (
      classes[props.sample.source] ||
      "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
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
      classes[props.sample.status] ||
      "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
    );
  });

  const formatSource = (source: string) => {
    const sources: Record<string, string> = {
      manual: "Manual",
      json: "JSON Import",
      opencode: "OpenCode",
      openwebui: "OpenWebUI",
    };
    return sources[source] || source;
  };

  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      draft: "Draft",
      review: "In Review",
      approved: "Approved",
      rejected: "Rejected",
    };
    return statuses[status] || status;
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  const approveSample = async () => {
    actionLoading.value = true;
    try {
      await $fetch(`/api/samples/${props.sample.id}/approve`, {
        method: "POST",
      });
      showApproveModal.value = false;
      emit("refresh");
    } catch (error) {
      console.error("Error approving training sample:", error);
      alert("Failed to approve training sample");
    } finally {
      actionLoading.value = false;
    }
  };

  const deleteSample = async () => {
    actionLoading.value = true;
    try {
      await $fetch(`/api/samples/${props.sample.id}`, {
        method: "DELETE",
      });
      showDeleteModal.value = false;
      emit("refresh");
    } catch (error) {
      console.error("Error deleting training sample:", error);
      alert("Failed to delete training sample");
    } finally {
      actionLoading.value = false;
    }
  };

  // Close modals on Escape key
  onMounted(() => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        showDeleteModal.value = false;
        showApproveModal.value = false;
      }
    });
  });
</script>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
