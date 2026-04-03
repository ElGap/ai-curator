<template>
  <div class="space-y-8">
    <!-- Welcome Section -->
    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Welcome to AI Curator
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        AI Curator is a local-first tool for collecting, organizing, and exporting training data for
        LLM fine-tuning. Your data stays on your machine—no cloud required.
      </p>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">Core Features</h3>
          <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>✓ Local SQLite database (privacy-first)</li>
            <li>✓ Multiple dataset management</li>
            <li>✓ Manual sample creation (no import required)</li>
            <li>✓ Live capture from OpenWebUI & OpenCode</li>
            <li>✓ Quality ratings & approval workflow</li>
            <li>✓ Export to Alpaca, MLX, JSONL formats</li>
            <li>✓ Training readiness analytics</li>
          </ul>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">Get Started</h3>
          <ul class="space-y-1 text-sm">
            <li>
              <NuxtLink to="/" class="text-blue-600 dark:text-blue-400 hover:underline"
                >→ View Dashboard</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/docs/datasets" class="text-blue-600 dark:text-blue-400 hover:underline"
                >→ Learn About Datasets</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/import" class="text-blue-600 dark:text-blue-400 hover:underline"
                >→ Import or Add Samples</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/docs/integrations"
                class="text-blue-600 dark:text-blue-400 hover:underline"
                >→ Setup Integrations</NuxtLink
              >
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Quick Start Cards -->
    <div class="grid md:grid-cols-3 gap-4">
      <NuxtLink
        to="/docs/datasets"
        class="card p-5 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
      >
        <div
          class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3"
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <h3 class="font-semibold mb-1 text-gray-900 dark:text-white">1. Create Dataset</h3>
        <p class="text-sm text-secondary">Start a new project with a goal and description</p>
      </NuxtLink>

      <NuxtLink
        to="/docs/datasets"
        class="card p-5 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
      >
        <div
          class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3"
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <h3 class="font-semibold mb-1 text-gray-900 dark:text-white">2. Add Samples</h3>
        <p class="text-sm text-secondary">Create manually, import files, or use plugins</p>
      </NuxtLink>

      <NuxtLink
        to="/export"
        class="card p-5 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
      >
        <div
          class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <h3 class="font-semibold mb-1 text-gray-900 dark:text-white">3. Export & Train</h3>
        <p class="text-sm text-secondary">Export curated data for fine-tuning</p>
      </NuxtLink>
    </div>

    <!-- Data Flow -->
    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">How It Works</h2>
      <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex-1">
          <div
            class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400"
          >
            1
          </div>
          <div>
            <div class="font-medium text-gray-900 dark:text-white">Create</div>
            <div class="text-secondary">Set up a dataset</div>
          </div>
        </div>
        <div class="text-secondary hidden md:block">→</div>
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex-1">
          <div
            class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400"
          >
            2
          </div>
          <div>
            <div class="font-medium text-gray-900 dark:text-white">Add</div>
            <div class="text-secondary">Manual, import, or capture</div>
          </div>
        </div>
        <div class="text-secondary hidden md:block">→</div>
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex-1">
          <div
            class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center font-bold text-yellow-600 dark:text-yellow-400"
          >
            3
          </div>
          <div>
            <div class="font-medium text-gray-900 dark:text-white">Review</div>
            <div class="text-secondary">Quality check & approve</div>
          </div>
        </div>
        <div class="text-secondary hidden md:block">→</div>
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex-1">
          <div
            class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center font-bold text-purple-600 dark:text-purple-400"
          >
            4
          </div>
          <div>
            <div class="font-medium text-gray-900 dark:text-white">Export</div>
            <div class="text-secondary">Train your model</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Integration Notice -->
    <section class="card border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div
          class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0"
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
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <div>
          <h3 class="font-semibold mb-1 text-gray-900 dark:text-white">
            Plugin Integrations Available
          </h3>
          <p class="text-sm text-secondary mb-2">
            Connect AI Curator with OpenWebUI (Beta) and OpenCode (In Development) to automatically
            capture training data from your AI conversations.
          </p>
          <NuxtLink
            to="/docs/integrations"
            class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Learn more about integrations →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Documentation Grid -->
    <div class="grid md:grid-cols-2 gap-4">
      <NuxtLink
        to="/docs/datasets"
        class="card p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <h3 class="font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-blue-600 dark:text-blue-400"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Datasets
        </h3>
        <p class="text-sm text-secondary">Understanding the complete dataset workflow</p>
      </NuxtLink>

      <NuxtLink
        to="/docs/import"
        class="card p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <h3 class="font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-green-600 dark:text-green-400"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import
        </h3>
        <p class="text-sm text-secondary">Import from files and live capture sources</p>
      </NuxtLink>

      <NuxtLink
        to="/docs/datasets"
        class="card p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <h3 class="font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-teal-600 dark:text-teal-400"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Samples
        </h3>
        <p class="text-sm text-secondary">Manually create training samples in the web interface</p>
      </NuxtLink>

      <NuxtLink
        to="/docs/export"
        class="card p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <h3 class="font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-purple-600 dark:text-purple-400"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </h3>
        <p class="text-sm text-secondary">Export formats and training preparation</p>
      </NuxtLink>

      <NuxtLink
        to="/docs/analytics"
        class="card p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <h3 class="font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-orange-600 dark:text-orange-400"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Analytics
        </h3>
        <p class="text-sm text-secondary">Dataset quality and readiness metrics</p>
      </NuxtLink>
    </div>

    <!-- Help Section -->
    <section class="card bg-gray-50 dark:bg-gray-800/50">
      <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Need Help?</h2>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div>
          <h3 class="font-medium mb-1 text-gray-900 dark:text-white">Getting Started</h3>
          <p class="text-secondary mb-2">New to AI Curator? Start with the Datasets guide.</p>
          <NuxtLink to="/docs/datasets" class="text-blue-600 dark:text-blue-400 hover:underline"
            >Read guide →</NuxtLink
          >
        </div>
        <div>
          <h3 class="font-medium mb-1 text-gray-900 dark:text-white">Capture Setup</h3>
          <p class="text-secondary mb-2">Configure OpenWebUI or OpenCode integration.</p>
          <NuxtLink to="/docs/integrations" class="text-blue-600 dark:text-blue-400 hover:underline"
            >Setup plugins →</NuxtLink
          >
        </div>
        <div>
          <h3 class="font-medium mb-1 text-gray-900 dark:text-white">Privacy & Security</h3>
          <p class="text-secondary mb-2">Learn how your data stays safe and local.</p>
          <NuxtLink to="/docs/security" class="text-blue-600 dark:text-blue-400 hover:underline"
            >Read more →</NuxtLink
          >
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    layout: "docs",
  });
</script>

<style scoped>
  @reference "tailwindcss";

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700;
  }

  pre {
    @apply whitespace-pre-wrap;
  }
</style>
