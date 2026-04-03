<template>
  <div class="space-y-8">
    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📥 Import Data</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Bring your training data into AI Curator from multiple sources. We support various formats
        and provide smart detection to map your fields automatically.
      </p>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">File Import</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Upload JSON, JSONL, or CSV files directly through the web interface.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">CLI Import</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Use the
            <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">curator import</code> command
            for batch operations and large files.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">External Sources</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Import from Kaggle and Hugging Face datasets with one command.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">Live Capture</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Stream data in real-time from OpenCode, OpenWebUI, or custom scripts.
          </p>
        </div>
      </div>

      <div
        class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <h3 class="font-semibold mb-2 text-blue-900 dark:text-blue-300">Smart Field Detection</h3>
        <p class="text-sm text-blue-800 dark:text-blue-400">
          Use the <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">--smart</code> flag to
          automatically map fields like "prompt" → "instruction", "rating" → "quality", and
          normalize status values automatically.
        </p>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Supported Formats</h2>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <span class="text-green-500 font-bold">✓</span>
          <div>
            <span class="font-semibold text-gray-900 dark:text-white">Alpaca (JSON)</span>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Standard format with instruction, input, output fields
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-green-500 font-bold">✓</span>
          <div>
            <span class="font-semibold text-gray-900 dark:text-white">JSONL</span>
            <p class="text-sm text-gray-600 dark:text-gray-400">JSON Lines - one record per line</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-green-500 font-bold">✓</span>
          <div>
            <span class="font-semibold text-gray-900 dark:text-white">CSV</span>
            <p class="text-sm text-gray-600 dark:text-gray-400">Comma-separated values</p>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Quick Example</h2>
      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
        <pre><code># Import with smart field detection
curator import data.json --smart --create-dataset "My Dataset"

# Import from Kaggle
curator download kaggle:owner/dataset-name --dataset 1

# Import large file with parallel processing
curator import large-dataset.jsonl --workers 8</code></pre>
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
