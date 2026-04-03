<template>
  <div class="space-y-8">
    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📤 Export Data</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Export your curated training data in multiple formats compatible with popular fine-tuning
        frameworks. Filter by status, quality, and split into train/validation sets.
      </p>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">🦙 Alpaca (JSON)</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Universal JSON format compatible with most training pipelines
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">📄 JSON Lines</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            One sample per line, ideal for streaming large datasets
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">🍎 MLX-LM</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Apple Silicon optimized format with chat templates
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">📦 Extended JSON</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Full metadata export with quality stats and category breakdown
          </p>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Export Features</h2>
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <span class="text-blue-500 text-xl">🎯</span>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Smart Filtering</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Export only approved samples, or filter by quality rating (4+ stars), category, or
              custom criteria.
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-blue-500 text-xl">✂️</span>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Train/Val Split</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Automatically split your data into training and validation sets (90/10, 80/20, or
              70/30 ratios).
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-blue-500 text-xl">🏷️</span>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Smart Filenames</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Auto-generated filenames include dataset name, count, date, and format:
              <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded"
                >dataset_100ex_2026-03-21_mlx.jsonl</code
              >
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Quick Example</h2>
      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
        <pre><code># Export approved samples in Alpaca format
$ curator export --format alpaca --filter "status=approved" --output train.json

# Export with train/val split for MLX-LM
$ curator export --format mlx --split "80-20" --output dataset

# Export high quality samples as JSONL
$ curator export --format jsonl --filter "quality>=4" --output premium.jsonl</code></pre>
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
