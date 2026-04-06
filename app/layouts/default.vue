<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Sidebar -->
    <aside
      class="fixed left-0 top-0 h-full w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-colors duration-200 flex flex-col"
    >
      <!-- Top section - scrollable content -->
      <div class="flex-1 overflow-y-auto p-6">
        <NuxtLink to="/" class="flex items-center gap-2 mb-1 hover:opacity-80 transition-opacity">
          <span class="text-xl font-bold text-gray-900 dark:text-white">AI Curator</span>
          <span
            class="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full"
            >beta</span
          >
        </NuxtLink>
        <p class="text-xs mb-7 text-gray-400">Privacy-first dataset curation for LLM fine-tuning</p>
        <nav class="space-y-1">
          <!-- Main Navigation -->
          <NuxtLink :to="navLink('/')" class="nav-link" active-class="nav-link-active">
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
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>Datasets</span>
          </NuxtLink>

          <NuxtLink :to="navLink('/import')" class="nav-link" active-class="nav-link-active">
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <span>Import</span>
          </NuxtLink>

          <NuxtLink :to="navLink('/export')" class="nav-link" active-class="nav-link-active">
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            <span>Export</span>
          </NuxtLink>

          <NuxtLink :to="navLink('/analytics')" class="nav-link" active-class="nav-link-active">
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
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Analytics</span>
          </NuxtLink>

          <!-- Separator -->
          <div class="my-2 border-t border-gray-200 dark:border-gray-700"></div>

          <NuxtLink
            :to="navLink('/docs')"
            :class="['nav-link', $route.path.startsWith('/docs') ? 'nav-link-active' : '']"
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Documentation</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- Bottom section - sticky -->
      <div class="mt-auto">
        <!-- Milestones - Only show on samples page with dataset -->
        <div
          v-if="isSamplesPage && route.query.dataset"
          class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <h3 class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">🎯 Milestones</h3>
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                :class="
                  totalSamples >= Math.round(targetGoal * 0.1)
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                "
              >
                {{ totalSamples >= Math.round(targetGoal * 0.1) ? "✅" : "⏳" }}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400"
                    >Getting Started</span
                  >
                  <span class="text-xs text-gray-500 dark:text-gray-500">{{
                    Math.round(targetGoal * 0.1)
                  }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                :class="
                  totalSamples >= Math.round(targetGoal * 0.25)
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                "
              >
                {{ totalSamples >= Math.round(targetGoal * 0.25) ? "✅" : "⏳" }}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400"
                    >Building Momentum</span
                  >
                  <span class="text-xs text-gray-500 dark:text-gray-500">{{
                    Math.round(targetGoal * 0.25)
                  }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                :class="
                  totalSamples >= Math.round(targetGoal * 0.5)
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                "
              >
                {{ totalSamples >= Math.round(targetGoal * 0.5) ? "✅" : "⏳" }}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400"
                    >Halfway There!</span
                  >
                  <span class="text-xs text-gray-500 dark:text-gray-500">{{
                    Math.round(targetGoal * 0.5)
                  }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                :class="
                  totalSamples >= targetGoal
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                "
              >
                {{ totalSamples >= targetGoal ? "✅" : "⏳" }}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400"
                    >Ready to Train!</span
                  >
                  <span class="text-xs text-gray-500 dark:text-gray-500">{{ targetGoal }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Widget -->
        <div
          class="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div class="flex justify-between text-xs mb-1">
            <span class="text-gray-600 dark:text-gray-400">Progress to {{ goalName }}</span>
            <span class="text-gray-600 dark:text-gray-400">{{ progressPercentage }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              class="bg-gradient-to-r from-gray-600 to-gray-800 h-1.5 rounded-full transition-all duration-500"
              :style="{ width: `${Math.min(progressPercentage, 100)}%` }"
            ></div>
          </div>
        </div>

        <!-- Theme Toggle -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <ThemeToggle />
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main
      class="ml-64 p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col"
    >
      <div class="flex-1">
        <slot />
      </div>

      <!-- Footer -->
      <footer
        class="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400"
      >
        <p>
          Project By
          <a
            href="https://elgap.rs"
            target="_blank"
            class="font-semibold hover:text-gray-700 dark:hover:text-gray-300"
          >
            ElGap
          </a>
          |
          <a
            href="https://github.com/elgap/ai-curator"
            target="_blank"
            class="hover:text-gray-700 dark:hover:text-gray-300"
          >
            Open Source (MIT)
          </a>
          | Powered by
          <a
            href="https://elgap.rs/rapid-mvp-mindset"
            target="_blank"
            class="hover:text-gray-700 dark:hover:text-gray-300 font-semibold"
          >
            #RapidMvpMindset
          </a>
        </p>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from "vue";
  import { useRoute } from "vue-router";

  const route = useRoute();

  const totalSamples = ref(0);
  const targetGoal = ref(100);
  const goalName = ref("First Fine-Tuning");

  const progressPercentage = computed(() => {
    if (targetGoal.value === 0) return 0;
    return Math.round((totalSamples.value / targetGoal.value) * 100);
  });

  const isSamplesPage = computed(() => {
    return route.path === "/samples" || route.path.startsWith("/samples/");
  });

  const loadStats = async () => {
    try {
      const urlDatasetId = route.query.dataset;

      if (urlDatasetId) {
        // Load stats for specific dataset
        const datasetId = parseInt(urlDatasetId as string);
        const stats = (await $fetch("/api/stats/overview", {
          query: { datasetId: String(datasetId) },
        })) as any;

        totalSamples.value = stats.total || 0;
        targetGoal.value =
          stats.datasetGoal || stats.activeDatasetGoal || stats.globalDefaultGoal || 100;
        goalName.value = stats.datasetGoalName || "First Fine-Tuning";
      } else {
        // Load all datasets and aggregate stats
        const datasetsResponse = await $fetch("/api/datasets");
        const datasets = datasetsResponse.datasets || [];

        let totalSamplesCount = 0;
        let totalGoal = 0;
        let firstGoalName = "First Fine-Tuning";

        for (const dataset of datasets) {
          try {
            const stats = (await $fetch("/api/stats/overview", {
              query: { datasetId: String(dataset.id) },
            })) as any;
            totalSamplesCount += stats.total || 0;
            totalGoal += dataset.goalSamples || 100;
            if (dataset.goalName && firstGoalName === "First Fine-Tuning") {
              firstGoalName = dataset.goalName;
            }
          } catch (_e) {
            // Skip if stats fail to load for a dataset
          }
        }

        // Use defaults if no datasets
        if (totalGoal === 0) {
          totalGoal = 100;
        }

        totalSamples.value = totalSamplesCount;
        targetGoal.value = totalGoal;
        goalName.value = firstGoalName;
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  onMounted(() => {
    loadStats();
  });

  watch(
    () => route.query.dataset,
    () => {
      loadStats();
    }
  );

  // Helper to generate nav links that preserve the dataset parameter
  const navLink = (path: string) => {
    const datasetId = route.query.dataset;
    if (datasetId) {
      return { path, query: { dataset: datasetId as string } };
    }
    return path;
  };
</script>

<style scoped>
  @reference "tailwindcss";

  .nav-link {
    @apply flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-100 transition-colors text-sm font-medium;
  }

  .nav-link-active {
    @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-sm;
  }
</style>
