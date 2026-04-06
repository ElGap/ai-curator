<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Core Fields Section -->
    <div class="card">
      <h2
        class="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-300"
      >
        <span>Core Fields</span>
        <span class="text-sm font-normal text-gray-500 dark:text-gray-400">(Required)</span>
      </h2>

      <!-- Instruction Field -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <label class="form-label">Instruction</label>
          <FieldTooltip
            title="Instruction"
            content="The main question or task. Be specific! This is what the AI will learn to respond to."
            example="Example: 'Explain closures in JavaScript with practical examples'"
          />
        </div>
        <textarea
          v-model="form.instruction"
          class="form-textarea"
          placeholder="Enter the instruction or question..."
          rows="3"
          required
        />
      </div>

      <!-- Input Field (Optional) -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <label class="form-label">Input Context</label>
          <span class="text-sm text-gray-400 dark:text-gray-500">(Optional)</span>
          <FieldTooltip
            title="Input Context"
            content="Additional context like code snippets, background info, or supporting data."
            example="Sample: A code snippet that the user wants explained or refactored."
          />
        </div>
        <textarea
          v-model="form.input"
          class="form-textarea"
          placeholder="Add any context or background information..."
          rows="4"
        />
      </div>

      <!-- Output Field -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <label class="form-label">Output / Response</label>
          <FieldTooltip
            title="Output / Response"
            content="The ideal AI response. Write exactly what you want the AI to learn to produce."
            example="Sample: A detailed explanation of closures with code examples."
          />
        </div>
        <textarea
          v-model="form.output"
          class="form-textarea"
          placeholder="Enter the desired AI response..."
          rows="12"
          required
        />
      </div>
    </div>

    <!-- Navigation Buttons (for edit mode) -->
    <div
      v-if="props.initialData?.id"
      class="relative flex justify-between items-center py-6 my-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4"
    >
      <button
        type="button"
        :disabled="props.loading || !props.prevId"
        class="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
        @click="handleNavigate('prev')"
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
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span class="font-medium">← Previous</span>
      </button>

      <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">{{
        props.prevId || props.nextId ? "Navigate through dataset" : "No more samples"
      }}</span>

      <button
        type="button"
        :disabled="props.loading || !props.nextId"
        class="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
        @click="handleNavigate('next')"
      >
        <span class="font-medium">Next →</span>
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
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Metadata Fields Section -->
    <div class="card">
      <h2 class="text-lg font-semibold mb-4 text-gray-600 dark:text-gray-300">Metadata Fields</h2>

      <!-- System Prompt -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <label class="form-label">System Prompt</label>
          <span class="text-sm text-gray-400 dark:text-gray-500">(Optional)</span>
          <FieldTooltip
            title="System Prompt"
            content="Defines the AI's personality and behavior for this conversation."
            example="Sample: 'You are a patient coding tutor who explains concepts step by step.'"
          />
        </div>
        <textarea
          v-model="form.systemPrompt"
          class="form-textarea"
          placeholder="Defines the AI's personality..."
          rows="2"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <!-- Category -->
        <div>
          <div class="flex items-center gap-2 mb-1">
            <label class="form-label">Category</label>
            <FieldTooltip
              title="Category"
              content="Helps organize your dataset. Choose the topic area."
              example="Coding, Analysis, Explanation, Writing, etc."
            />
          </div>
          <select v-model="form.category" class="form-input">
            <option v-for="cat in availableCategoryList" :key="cat" :value="cat">
              {{ formatCategory(cat) }}
            </option>
          </select>
        </div>

        <!-- Difficulty -->
        <div>
          <div class="flex items-center gap-2 mb-1">
            <label class="form-label">Difficulty</label>
            <FieldTooltip
              title="Difficulty"
              content="Track complexity. A mix of difficulties makes better models."
              example="Beginner: Simple concepts. Advanced: Complex reasoning."
            />
          </div>
          <select v-model="form.difficulty" class="form-input">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <!-- Quality Rating -->
        <div>
          <div class="flex items-center gap-2 mb-1">
            <label class="form-label">Quality Rating</label>
            <FieldTooltip
              title="Quality Rating"
              content="Your assessment of how good this training sample is."
              example="5 stars = Perfect sample, 1 star = Needs improvement"
            />
          </div>
          <QualityStars v-model="form.qualityRating" />
        </div>
      </div>

      <!-- Status Dropdown -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <label class="form-label">Status</label>
          <FieldTooltip
            title="Status"
            content="Review status of this sample. Change to move through the workflow."
            example="Draft → In Review → Approved or Rejected"
          />
        </div>
        <select v-model="form.status" class="form-input">
          <option value="draft">📝 Draft</option>
          <option value="review">👀 In Review</option>
          <option value="approved">✅ Approved</option>
          <option value="rejected">❌ Rejected</option>
        </select>
      </div>

      <!-- Tags -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <label class="form-label">Tags</label>
          <FieldTooltip
            title="Tags"
            content="Custom labels for filtering and organizing. Add any relevant tags."
            example="Sample: 'javascript', 'react', 'debugging', 'best-practices'"
          />
        </div>
        <TagInput v-model="form.tags" />
      </div>

      <!-- Notes -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <label class="form-label">Notes</label>
          <FieldTooltip
            title="Notes"
            content="Why is this a good sample? Document your reasoning for future reference."
            example="Sample: 'Clear explanation with practical examples - perfect for training'"
          />
        </div>
        <textarea
          v-model="form.notes"
          class="form-textarea"
          placeholder="Why is this a good training sample?"
          rows="2"
        />
      </div>
    </div>

    <!-- Source Tracking (Read-only for manual creation) -->
    <div class="card bg-gray-100 dark:bg-gray-800">
      <h2 class="text-lg font-semibold mb-4 text-gray-600 dark:text-gray-300">
        Source Information
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-500 dark:text-gray-400">Source:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-gray-100">
            {{
              props.initialData?.source ? formatSource(props.initialData.source) : "Manual Entry"
            }}
          </span>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400">Created:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-gray-100">
            {{
              props.initialData?.createdAt
                ? formatDateTime(props.initialData.createdAt)
                : new Date().toLocaleString()
            }}
          </span>
        </div>
        <div v-if="props.initialData?.id">
          <span class="text-gray-500 dark:text-gray-400">Last Edited:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-gray-100">
            {{
              props.initialData?.updatedAt
                ? formatDateTime(props.initialData.updatedAt)
                : "Never updated"
            }}
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-3 justify-end">
      <button type="submit" :disabled="saving" class="btn-primary">
        <span v-if="saving">Saving...</span>
        <span v-else>💾 Save</span>
      </button>

      <button type="button" class="btn-secondary" @click="$emit('cancel')">❌ Cancel</button>
    </div>

    <!-- Keyboard Shortcuts Legend -->
    <div
      class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-4 justify-end"
    >
      <span class="flex items-center gap-1">
        <kbd class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">Ctrl</kbd>+<kbd
          class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded"
          >Enter</kbd
        >
        Save
      </span>
      <span class="flex items-center gap-1">
        <kbd class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">Esc</kbd> Cancel
      </span>
    </div>
  </form>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, onUnmounted, computed } from "vue";

  interface FormData {
    instruction: string;
    input: string;
    output: string;
    systemPrompt: string;
    category: string;
    difficulty: string;
    qualityRating: number;
    notes: string;
    tags: string[];
    status: "draft" | "review" | "approved" | "rejected";
  }

  const props = defineProps<{
    initialData?: Partial<FormData> & {
      id?: string;
      createdAt?: string | number | Date;
      updatedAt?: string | number | Date;
      source?: string;
    };
    prevId?: number | null;
    nextId?: number | null;
    loading?: boolean;
    availableCategories?: string[];
  }>();

  const emit = defineEmits<{
    submit: [data: FormData];
    cancel: [];
    navigate: [id: number];
  }>();

  const saving = ref(false);

  // Navigation handler - emit the target ID
  const handleNavigate = (direction: "prev" | "next") => {
    const targetId = direction === "prev" ? props.prevId : props.nextId;
    if (targetId) {
      emit("navigate", targetId);
    }
  };

  // Sticky fields - remember last used values
  const STICKY_FIELDS_KEY = "curator-sticky-fields";

  const getStickyFields = (): Partial<FormData> => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(STICKY_FIELDS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const saveStickyFields = (data: Partial<FormData>) => {
    if (typeof window === "undefined") return;
    try {
      // Only save metadata fields, not content
      const stickyData = {
        category: data.category,
        difficulty: data.difficulty,
        qualityRating: data.qualityRating,
        tags: data.tags,
      };
      localStorage.setItem(STICKY_FIELDS_KEY, JSON.stringify(stickyData));
    } catch {
      // Ignore storage errors
    }
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

  const stickyFields = getStickyFields();

  // Helper to parse tags from string or array
  const parseTags = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Map external status to form status
  const mapStatusToForm = (status: string | undefined): FormData["status"] => {
    if (!status) return "approved";
    // Map needs_review to review for the form
    if (status === "needs_review") return "review";
    // Validate it's one of the allowed values
    if (["draft", "review", "approved", "rejected"].includes(status)) {
      return status as FormData["status"];
    }
    return "approved";
  };

  const form = reactive<FormData>({
    instruction: props.initialData?.instruction || "",
    input: props.initialData?.input || "",
    output: props.initialData?.output || "",
    systemPrompt: props.initialData?.systemPrompt || "",
    category: props.initialData?.category || stickyFields.category || "general",
    difficulty: props.initialData?.difficulty || stickyFields.difficulty || "intermediate",
    qualityRating: props.initialData?.qualityRating || stickyFields.qualityRating || 3,
    notes: props.initialData?.notes || "",
    tags:
      parseTags(props.initialData?.tags).length > 0
        ? parseTags(props.initialData?.tags)
        : parseTags(stickyFields.tags).length > 0
          ? parseTags(stickyFields.tags)
          : [],
    status: mapStatusToForm(props.initialData?.status),
  });

  const handleSubmit = async () => {
    saving.value = true;
    saveStickyFields(form);

    // Create a clean copy to avoid any reactivity issues
    const formCopy = JSON.parse(JSON.stringify({ ...form }));

    emit("submit", formCopy);
    saving.value = false;
  };

  // Keyboard shortcuts
  const handleKeydown = (e: KeyboardEvent) => {
    // Ctrl+Enter - Save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }

    // Escape - Cancel
    if (e.key === "Escape") {
      e.preventDefault();
      emit("cancel");
    }
  };

  onMounted(() => {
    document.addEventListener("keydown", handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeydown);
  });

  // Available categories - use prop or generate from current selection
  const availableCategoryList = computed(() => {
    // If prop provided, use it
    if (props.availableCategories && props.availableCategories.length > 0) {
      return props.availableCategories;
    }
    // Otherwise include current category plus defaults
    const defaults = ["general", "coding", "analysis", "explanation", "writing", "math", "science"];
    const current = form.category;
    if (current && !defaults.includes(current)) {
      return [current, ...defaults];
    }
    return defaults;
  });

  // Format category for display
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
      media: "Media",
      historical: "Historical",
      statistics: "Statistics",
      player_journey: "Player Journey",
      management: "Management",
      creative_writing: "Creative Writing",
    };
    return categories[category] || category;
  };

  const formatSource = (source: string) => {
    const sources: Record<string, string> = {
      manual: "Manual",
      json: "JSON Import",
    };
    return sources[source] || source;
  };
</script>
