<template>
  <div class="space-y-8">
    <!-- Privacy Grid -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Local Storage Card -->
      <section class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-blue-600 dark:text-blue-400"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold">Your Data Stays Local</h2>
        </div>
        <p class="text-secondary text-sm mb-4">
          All training data is stored in a local SQLite database on your machine. No cloud services,
          no external servers.
        </p>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono text-secondary">
          ~/.curator/curator.db
        </div>
      </section>

      <!-- No Telemetry Card -->
      <section class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-green-600 dark:text-green-400"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold">No Telemetry</h2>
        </div>
        <p class="text-secondary text-sm mb-4">
          No analytics, error reports, or usage statistics are collected. The app works completely
          offline with no "phone home" functionality.
        </p>
        <div class="flex gap-2">
          <span
            class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded"
            >No tracking</span
          >
          <span
            class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded"
            >No analytics</span
          >
        </div>
      </section>

      <!-- Data Control Card -->
      <section class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-purple-600 dark:text-purple-400"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold">You Control Exports</h2>
        </div>
        <p class="text-secondary text-sm mb-4">
          Export data to JSON, JSONL, or Alpaca formats when you're ready. No automatic uploads or
          sharing.
        </p>
        <div class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2">
          Export anytime from Dashboard → Dataset → Export
        </div>
      </section>

      <!-- Plugin Control Card -->
      <section class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-orange-600 dark:text-orange-400"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold">Plugin Control</h2>
        </div>
        <p class="text-secondary text-sm mb-4">
          Enable or disable individual plugin sources. Global kill switch to stop all live capture
          instantly.
        </p>
        <NuxtLink
          to="/import"
          class="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 p-2 rounded inline-block"
        >
          Manage plugins in Import → Live Capture
        </NuxtLink>
      </section>
    </div>

    <!-- Quick Summary -->
    <section class="card p-6">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-teal-600 dark:text-teal-400"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold">Data Storage</h3>
      </div>
      <div class="grid md:grid-cols-2 gap-4 text-sm">
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p class="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Stored Locally
          </p>
          <ul class="text-secondary space-y-1 ml-4">
            <li>Training samples (instruction, input, output)</li>
            <li>Sample metadata (category, quality, status)</li>
            <li>Dataset configurations</li>
            <li>Import session history</li>
          </ul>
        </div>
        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p class="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            Not Stored
          </p>
          <ul class="text-secondary space-y-1 ml-4">
            <li>User accounts or credentials</li>
            <li>Cloud sync data</li>
            <li>Analytics or telemetry</li>
            <li>Third-party service data</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Data Location -->
    <section class="card p-6">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-gray-600 dark:text-gray-400"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold">Data Location</h3>
      </div>
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm mb-4">
        <div class="mb-2">
          <span class="text-secondary">Linux/macOS:</span> ~/.curator/curator.db
        </div>
        <div><span class="text-secondary">Windows:</span> %USERPROFILE%\.curator\curator.db</div>
      </div>
      <p class="text-sm text-secondary">
        Backup your data by copying this file or using the Export feature.
      </p>
    </section>

    <!-- Best Practices -->
    <section class="card p-6">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-yellow-600 dark:text-yellow-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold">Privacy Best Practices</h3>
      </div>
      <div class="grid md:grid-cols-2 gap-4 text-sm">
        <ul class="space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span><strong>Review imports:</strong> Check for PII before importing client data</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span><strong>Use quality ratings:</strong> Mark sensitive content appropriately</span>
          </li>
        </ul>
        <ul class="space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span><strong>Regular backups:</strong> Export datasets before major changes</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span><strong>Clear data:</strong> Remove datasets after project completion</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    layout: "docs",
  });

  useHead({
    title: "Privacy - AI Curator",
  });
</script>

<style scoped>
  @reference "tailwindcss";

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
