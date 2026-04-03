<template>
  <div class="flex items-center gap-3">
    <div
      class="w-8 h-8 rounded-full flex items-center justify-center text-lg"
      :class="
        achieved
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:dark:text-gray-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
      "
    >
      {{ achieved ? "✅" : "⏳" }}
    </div>
    <div class="flex-1">
      <div class="flex justify-between items-center mb-1">
        <span
          class="font-medium"
          :class="
            achieved ? 'text-gray-700 dark:dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'
          "
        >
          {{ label }}
        </span>
        <span
          class="text-sm"
          :class="
            achieved ? 'text-gray-600 dark:dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'
          "
        >
          {{ count }} examples
        </span>
      </div>
      <div v-if="!achieved" class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          class="bg-gray-400 h-1.5 rounded-full transition-all duration-500"
          :style="{ width: `${(current / (parseInt(count) - getPrevCount(count))) * 100}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    achieved: boolean;
    count: string;
    label: string;
    current: number;
  }>();

  const getPrevCount = (count: string) => {
    const counts = [10, 25, 50, 100];
    const idx = counts.indexOf(parseInt(count));
    return idx > 0 ? counts[idx - 1] : 0;
  };
</script>
