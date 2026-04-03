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
            >0.3.0-beta</span
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

      <!-- Bottom section - fixed -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <ThemeToggle />
      </div>
    </aside>

    <!-- Main Content -->
    <main class="ml-64 min-h-screen">
      <div class="max-w-6xl mx-auto p-6">
        <div class="mb-8">
          <h1 class="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Documentation</h1>
          <p class="text-gray-600 dark:text-gray-400">
            <slot name="subtitle">Guides and reference for AI Curator</slot>
          </p>
        </div>

        <!-- Navigation -->
        <div class="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <NuxtLink
            to="/docs"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs' || $route.path === '/docs/'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            Overview
          </NuxtLink>
          <NuxtLink
            to="/docs/datasets"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs/datasets'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            Datasets
          </NuxtLink>
          <NuxtLink
            to="/docs/import"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs/import'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            Import
          </NuxtLink>
          <NuxtLink
            to="/docs/export"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs/export'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            Export
          </NuxtLink>
          <NuxtLink
            to="/docs/analytics"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs/analytics'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            Analytics
          </NuxtLink>
          <NuxtLink
            to="/docs/cli"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs/cli'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            CLI
          </NuxtLink>
          <NuxtLink
            to="/docs/capture"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs/capture'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            Capture API
          </NuxtLink>
          <NuxtLink
            to="/docs/integrations"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs/integrations'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            Integrations
          </NuxtLink>
          <NuxtLink
            to="/docs/security"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs/security'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            Security
          </NuxtLink>
          <NuxtLink
            to="/docs/privacy"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
              $route.path === '/docs/privacy'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]"
          >
            Privacy
          </NuxtLink>
        </div>

        <!-- Content -->
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  // Docs layout with sidebar and documentation navigation

  function navLink(path: string) {
    return path;
  }
</script>

<style scoped>
  @reference "tailwindcss";

  .nav-link {
    @apply flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors;
  }

  .nav-link-active {
    @apply bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400;
  }
</style>
