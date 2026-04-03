<template>
  <div class="flex items-center gap-1">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      class="transition-transform hover:scale-110 focus:outline-none"
      :class="isFilled(star) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
      @click="setRating(star)"
      @mouseenter="hoverRating = star"
      @mouseleave="hoverRating = 0"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        />
      </svg>
    </button>
    <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">{{ ratingLabel }}</span>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from "vue";

  const props = defineProps<{
    modelValue: number;
  }>();

  const emit = defineEmits<{
    "update:modelValue": [value: number];
  }>();

  const hoverRating = ref(0);

  const currentRating = computed(() => hoverRating.value || props.modelValue);

  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  const ratingLabel = computed(() => {
    return ratingLabels[currentRating.value] || "";
  });

  const isFilled = (star: number) => {
    return star <= currentRating.value;
  };

  const setRating = (value: number) => {
    emit("update:modelValue", value);
  };
</script>
