<template>
  <div class="space-y-8">
    <!-- Integration Cards -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- OpenWebUI Integration -->
      <section class="card p-6 border-l-4 border-gray-400">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold">OpenWebUI</h2>
            <span
              class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full"
              >Beta</span
            >
          </div>
        </div>
        <p class="text-secondary text-sm mb-4">
          Capture training data from your OpenWebUI conversations. Automatically export chat
          histories as fine-tuning datasets.
        </p>
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-600 dark:text-gray-400"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <span class="text-secondary">Docker integration ready</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-600 dark:text-gray-400"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <span class="text-secondary">Automatic conversation capture</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-600 dark:text-gray-400"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <span class="text-secondary">Session-based organization</span>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-xs text-secondary mb-2">
            <strong>Status:</strong> Beta testing - Report issues on GitHub
          </p>
          <div class="space-y-1">
            <a
              href="https://github.com/open-webui/open-webui"
              target="_blank"
              class="text-xs text-gray-600 dark:text-gray-400 hover:underline block"
            >
              → OpenWebUI Project
            </a>
            <a
              href="https://github.com/elgap/ai-curator-openwebui"
              target="_blank"
              class="text-xs text-gray-600 dark:text-gray-400 hover:underline block"
            >
              → AI Curator Plugin for OpenWebUI
            </a>
          </div>
        </div>
      </section>

      <!-- OpenCode Integration -->
      <section class="card p-6 border-l-4 border-gray-400">
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
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold">OpenCode</h2>
            <span
              class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full"
              >In Development</span
            >
          </div>
        </div>
        <p class="text-secondary text-sm mb-4">
          Capture AI-assisted coding sessions from OpenCode CLI. Convert code generation workflows
          into training data.
        </p>
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-600 dark:text-gray-400"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <span class="text-secondary">CLI capture tool</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-600 dark:text-gray-400"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <span class="text-secondary">Code context preservation</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-600 dark:text-gray-400"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </div>
            <span class="text-secondary">Git integration (coming soon)</span>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-xs text-secondary mb-2">
            <strong>Status:</strong> Heavy development - API may change
          </p>
          <div class="space-y-1">
            <a
              href="https://github.com/opencode-ai/opencode"
              target="_blank"
              class="text-xs text-gray-600 dark:text-gray-400 hover:underline block"
            >
              → OpenCode Project
            </a>
            <a
              href="https://github.com/elgap/ai-curator-opencode"
              target="_blank"
              class="text-xs text-gray-600 dark:text-gray-400 hover:underline block"
            >
              → AI Curator Plugin for OpenCode
            </a>
          </div>
        </div>
      </section>
    </div>

    <!-- How It Works -->
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
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold">How Integrations Work</h3>
      </div>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div
            class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 font-bold text-gray-600 dark:text-gray-400 text-sm"
          >
            1
          </div>
          <div class="font-medium mb-2">Plugin Captures</div>
          <p class="text-secondary">
            External tools capture conversations, code sessions, or interactions using our Universal
            Capture API.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div
            class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 font-bold text-gray-600 dark:text-gray-400 text-sm"
          >
            2
          </div>
          <div class="font-medium mb-2">Data Validation</div>
          <p class="text-secondary">
            All incoming data is validated for quality and structure before being stored in your
            local database.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div
            class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 font-bold text-gray-600 dark:text-gray-400 text-sm"
          >
            3
          </div>
          <div class="font-medium mb-2">Dataset Building</div>
          <p class="text-secondary">
            Review, approve, and organize captured data into training datasets ready for
            fine-tuning.
          </p>
        </div>
      </div>
    </section>

    <!-- Setup Instructions -->
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
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold">Getting Started</h3>
      </div>
      <div class="space-y-4 text-sm">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 class="font-medium mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-gray-600 dark:text-gray-400"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Enable Live Capture
          </h4>
          <p class="text-secondary mb-3">
            Before using any integration, ensure Live Capture is enabled in your settings:
          </p>
          <div
            class="bg-white dark:bg-gray-700 rounded-lg p-3 font-mono text-xs border border-gray-200 dark:border-gray-600"
          >
            Import → Live Capture → Enable Sources
          </div>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 class="font-medium mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-gray-600 dark:text-gray-400"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Configure Default Dataset
          </h4>
          <p class="text-secondary mb-3">
            Set which dataset receives captured data by default, or let the plugin specify:
          </p>
          <div
            class="bg-white dark:bg-gray-700 rounded-lg p-3 font-mono text-xs border border-gray-200 dark:border-gray-600"
          >
            Import → Live Capture → Configure
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    layout: "docs",
  });

  useHead({
    title: "Integrations - AI Curator",
  });
</script>

<style scoped>
  @reference "tailwindcss";

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
