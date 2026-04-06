<template>
  <div class="space-y-8">
    <!-- No Auth Required Notice -->
    <section class="card p-6 border-l-4 border-blue-500">
      <div class="flex items-start gap-4">
        <div
          class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-blue-600 dark:text-blue-400"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">
            No Login Required (By Design)
          </h2>
          <p class="text-secondary text-sm">
            AI Curator is a <strong>single-user local tool</strong>. If someone can access your
            localhost:3333, they already have access to your local machine. The app relies on your
            OS user account security, similar to VSCode, Jupyter, or Docker Desktop.
          </p>
        </div>
      </div>
    </section>

    <!-- Security Features Grid -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Local Only Card -->
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold">Local Only (Default)</h2>
        </div>
        <p class="text-secondary text-sm mb-4">
          Default configuration binds to localhost only. Safe for development with no additional
          security needed.
        </p>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono">
          localhost:3333
        </div>
      </section>

      <!-- Input Validation Card -->
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold">
            Strict Input Validation
          </h2>
        </div>
        <p class="text-secondary text-sm mb-4">
          All API inputs validated with Zod schemas. No SQL injection or XSS vulnerabilities.
        </p>
        <div class="flex gap-2 flex-wrap">
          <span
            class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
            >Zod validation</span
          >
          <span
            class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
            >Type safety</span
          >
        </div>
      </section>

      <!-- No SQL Injection Card -->
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
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5V19A9 3 0 0 0 21 19V5" />
              <path d="M3 12A9 3 0 0 0 21 12" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold">SQL Injection Safe</h2>
        </div>
        <p class="text-secondary text-sm mb-4">
          Drizzle ORM uses parameterized queries exclusively. No raw SQL with user input.
        </p>
        <div class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2">
          All queries are prepared statements with bound parameters
        </div>
      </section>

      <!-- XSS Protection Card -->
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold">XSS Protection</h2>
        </div>
        <p class="text-secondary text-sm mb-4">
          Vue.js auto-escapes all rendered content. No v-html usage in the application.
        </p>
        <div class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2">
          All user content is HTML-escaped by default
        </div>
      </section>
    </div>

    <!-- Network Deployment -->
    <section class="card p-6 border-l-4 border-yellow-500">
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
            <path
              d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold">
          Network Deployment Warning
        </h3>
      </div>
      <p class="text-secondary text-sm mb-4">
        Binding to <code>0.0.0.0</code> allows access from your local network. Only use on trusted
        home/office networks.
      </p>
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm mb-4">
        <div class="text-secondary mb-2"># Default (localhost only) - SAFE</div>
        <div class="mb-3">curator</div>
        <div class="text-secondary mb-2"># Network access - USE WITH CAUTION</div>
        <div>AI_CURATOR_HOST=0.0.0.0 curator</div>
      </div>
      <p class="text-sm text-secondary">
        <strong>Recommendation:</strong> Use SSH tunnels for remote access instead of exposing to
        network.
      </p>
    </section>

    <!-- Security Features -->
    <section class="card p-6">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-red-600 dark:text-red-400"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold">Security Features</h3>
      </div>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="font-medium mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-blue-600 dark:text-blue-400"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
            Request Limits
          </p>
          <ul class="text-secondary space-y-1">
            <li>• Import: 10MB max</li>
            <li>• Capture: 1MB max</li>
            <li>• Merge: 100KB max</li>
          </ul>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="font-medium mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-green-600 dark:text-green-400"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            CLI Protection
          </p>
          <ul class="text-secondary space-y-1">
            <li>• Path validation</li>
            <li>• File size limits</li>
            <li>• Suspicious char check</li>
          </ul>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="font-medium mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-orange-600 dark:text-orange-400"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            API Timeouts
          </p>
          <ul class="text-secondary space-y-1">
            <li>• External calls: 30s</li>
            <li>• Downloads: 5min</li>
            <li>• AbortController</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- When to Worry -->
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
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold">When Should You Worry?</h3>
      </div>
      <div class="space-y-3 text-sm">
        <div class="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div
            class="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-green-600 dark:text-green-400"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <p class="font-medium">Local Development</p>
            <p class="text-secondary">Default configuration is safe. No auth needed.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div
            class="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-yellow-600 dark:text-yellow-400"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div>
            <p class="font-medium">Shared Computer</p>
            <p class="text-secondary">Use OS user accounts or separate data directories.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div
            class="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-red-600 dark:text-red-400"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <div>
            <p class="font-medium">Public Network / Internet</p>
            <p class="text-secondary">Don't expose to public networks without authentication.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Tips -->
    <section class="card p-6">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-pink-600 dark:text-pink-400"
          >
            <path
              d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold">Security Tips</h3>
      </div>
      <div class="grid md:grid-cols-2 gap-4 text-sm">
        <ul class="space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span>Keep the app updated to get security patches</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span>Only enable plugins you trust</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span>Regular backups protect against data loss</span>
          </li>
        </ul>
        <ul class="space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span>Use SSH tunnels instead of exposing to network</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span>Review exports for sensitive data before sharing</span>
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
    title: "Security - AI Curator",
  });
</script>

<style scoped>
  @reference "tailwindcss";

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
