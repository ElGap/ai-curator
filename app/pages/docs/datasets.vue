<template>
  <div class="space-y-8">
    <!-- What is a Dataset -->
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
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">What is a Dataset?</h2>
      </div>
      <p class="text-secondary mb-6">
        A dataset in AI Curator is a collection of training samples (instruction-output pairs)
        organized for a specific purpose. Think of it as a project folder for your AI training data.
      </p>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div
            class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3"
          >
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div class="font-medium mb-2 text-gray-900 dark:text-white">Samples</div>
          <p class="text-secondary">
            Individual training examples with instruction, input, and output
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div
            class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3"
          >
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <div class="font-medium mb-2 text-gray-900 dark:text-white">Categories</div>
          <p class="text-secondary">Organize by domain: code, general, reasoning, etc.</p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div
            class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-yellow-600 dark:text-yellow-400"
            >
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              />
            </svg>
          </div>
          <div class="font-medium mb-2 text-gray-900 dark:text-white">Quality Ratings</div>
          <p class="text-secondary">1-5 star rating system for filtering exports</p>
        </div>
      </div>
    </section>

    <!-- Complete Workflow -->
    <section class="card p-6">
      <div class="flex items-center gap-3 mb-6">
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
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Complete Dataset Workflow
        </h2>
      </div>

      <div class="space-y-6">
        <!-- Step 1 -->
        <div class="flex gap-4">
          <div
            class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <span class="text-sm font-bold text-blue-600 dark:text-blue-400">1</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Create Dataset</h3>
            <p class="text-secondary text-sm mb-2">
              Start by creating a new dataset with a name and optional description. Set your goal
              (e.g., 100, 500, or 1000 samples) to track progress.
            </p>
            <div
              class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2 inline-block"
            >
              Dashboard → Create Dataset
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="flex gap-4">
          <div
            class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <span class="text-sm font-bold text-blue-600 dark:text-blue-400">2</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Add Samples</h3>
            <p class="text-secondary text-sm mb-2">
              Add training samples through any of these methods:
            </p>
            <ul class="text-sm text-secondary space-y-1 ml-4 mb-2">
              <li>
                • <strong>Manual:</strong> Create samples directly in the web interface
                (instruction, input, output)
              </li>
              <li>• <strong>Import:</strong> Upload JSON/JSONL files from existing datasets</li>
              <li>
                • <strong>Live Capture:</strong> Automatically capture from OpenWebUI or OpenCode
              </li>
            </ul>
            <div class="flex gap-2">
              <div
                class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2 inline-block"
              >
                Dashboard → Dataset → Add Sample
              </div>
              <div
                class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2 inline-block"
              >
                Import → Select Method
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="flex gap-4">
          <div
            class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <span class="text-sm font-bold text-blue-600 dark:text-blue-400">3</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Review & Organize</h3>
            <p class="text-secondary text-sm mb-2">Review imported samples and organize them:</p>
            <ul class="text-sm text-secondary space-y-1 ml-4 mb-2">
              <li>• Set quality ratings (1-5 stars)</li>
              <li>• Assign categories (general, code, reasoning)</li>
              <li>• Approve good samples, reject poor ones</li>
              <li>• Add tags for filtering</li>
            </ul>
            <div
              class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2 inline-block"
            >
              Dashboard → Dataset → Review
            </div>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="flex gap-4">
          <div
            class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <span class="text-sm font-bold text-blue-600 dark:text-blue-400">4</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Analyze & Improve</h3>
            <p class="text-secondary text-sm mb-2">Check your dataset health with analytics:</p>
            <ul class="text-sm text-secondary space-y-1 ml-4 mb-2">
              <li>• View distribution by category and quality</li>
              <li>• Check training readiness score</li>
              <li>• Identify gaps in your data</li>
            </ul>
            <div
              class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2 inline-block"
            >
              Dashboard → Dataset → Analytics
            </div>
          </div>
        </div>

        <!-- Step 5 -->
        <div class="flex gap-4">
          <div
            class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <span class="text-sm font-bold text-green-600 dark:text-green-400">5</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Export for Training</h3>
            <p class="text-secondary text-sm mb-2">
              Export your curated dataset in the format you need:
            </p>
            <ul class="text-sm text-secondary space-y-1 ml-4 mb-2">
              <li>• Alpaca (instruction, input, output)</li>
              <li>• ShareGPT (conversations)</li>
              <li>• MLX (Apple Silicon optimized)</li>
              <li>• JSONL (one sample per line)</li>
            </ul>
            <div
              class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2 inline-block"
            >
              Dashboard → Dataset → Export
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Creating Samples Manually -->
    <section class="card p-6 border-l-4 border-green-500">
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Creating Samples Manually
        </h2>
      </div>
      <p class="text-secondary mb-4">
        You don't need to import files or use plugins. Create training samples directly in the web
        interface—perfect for small datasets or quick additions.
      </p>
      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 class="font-medium mb-2 text-gray-900 dark:text-white flex items-center gap-2">
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
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            How to Create
          </h4>
          <ol class="text-sm text-secondary space-y-1 ml-4">
            <li>1. Go to your dataset</li>
            <li>2. Click "Add Sample" button</li>
            <li>3. Fill in instruction (the prompt)</li>
            <li>4. Fill in input (optional context)</li>
            <li>5. Fill in output (expected response)</li>
            <li>6. Set quality rating and category</li>
            <li>7. Save and repeat</li>
          </ol>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 class="font-medium mb-2 text-gray-900 dark:text-white flex items-center gap-2">
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
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            When to Use
          </h4>
          <ul class="text-sm text-secondary space-y-1 ml-4">
            <li>• Building small, curated datasets</li>
            <li>• Adding individual high-quality examples</li>
            <li>• Correcting or augmenting imported data</li>
            <li>• Creating synthetic training data</li>
            <li>• Testing the format before bulk import</li>
          </ul>
        </div>
      </div>
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-secondary">
        <strong>Location:</strong> Dashboard → Select Dataset → "Add Sample" button
      </div>
    </section>

    <!-- Dataset Features -->
    <div class="grid md:grid-cols-2 gap-6">
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
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Active Dataset</h3>
        </div>
        <p class="text-secondary text-sm mb-4">
          One dataset can be "active" at a time. This is the default destination for live capture
          from plugins.
        </p>
        <div class="text-xs text-secondary bg-gray-50 dark:bg-gray-800 rounded p-2">
          Switch active dataset from Dashboard or Import → Live Capture
        </div>
      </section>

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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Sample Status</h3>
        </div>
        <p class="text-secondary text-sm mb-3">Samples go through workflow states:</p>
        <div class="flex gap-2 flex-wrap text-xs">
          <span
            class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded"
            >Draft</span
          >
          <span
            class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
            >Review</span
          >
          <span
            class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded"
            >Approved</span
          >
          <span
            class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded"
            >Rejected</span
          >
        </div>
      </section>
    </div>

    <!-- Quick Tips -->
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
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M12 22l10-5-10-5-10 5 10 5z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Best Practices</h3>
      </div>
      <div class="grid md:grid-cols-2 gap-4 text-sm">
        <ul class="space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span
              ><strong>Use descriptive names:</strong> "Customer Support Bot" not "Dataset 1"</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span><strong>Set a goal:</strong> Helps track progress and stay motivated</span>
          </li>
        </ul>
        <ul class="space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span><strong>Quality over quantity:</strong> Approve only good samples</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span><strong>Regular exports:</strong> Backup your work frequently</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-600 dark:text-blue-400">•</span>
            <span><strong>One dataset per project:</strong> Keep data organized</span>
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
    title: "Datasets - AI Curator",
  });
</script>

<style scoped>
  @reference "tailwindcss";

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
