<template>
  <div class="form-input flex flex-wrap items-center gap-2 min-h-[42px] p-2">
    <span
      v-for="tag in tags"
      :key="tag"
      class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md dark:bg-gray-700 dark:text-gray-300"
    >
      {{ tag }}
      <button
        type="button"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        @click="removeTag(tag)"
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
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </span>

    <input
      v-model="newTag"
      type="text"
      class="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
      placeholder="Type a tag and press Enter..."
      @keydown.enter.prevent="addTag"
      @keydown.backspace="removeLastTag"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";

  const props = defineProps<{
    modelValue: string[] | string;
  }>();

  const emit = defineEmits<{
    "update:modelValue": [value: string[]];
  }>();

  // Parse tags from string or array
  const parseTags = (value: string[] | string): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const tags = computed({
    get: () => parseTags(props.modelValue),
    set: (value) => emit("update:modelValue", value),
  });

  const newTag = ref("");

  const addTag = () => {
    const trimmed = newTag.value.trim().toLowerCase();
    if (trimmed && !tags.value.includes(trimmed)) {
      tags.value = [...tags.value, trimmed];
    }
    newTag.value = "";
  };

  const removeTag = (tag: string) => {
    tags.value = tags.value.filter((t) => t !== tag);
  };

  const removeLastTag = (_event: KeyboardEvent) => {
    if (newTag.value === "" && tags.value.length > 0) {
      tags.value = tags.value.slice(0, -1);
    }
  };
</script>
