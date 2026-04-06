<template>
  <div class="space-y-8">
    <section class="card">
      <h2 class="text-xl font-semibold mb-4">📊 Analytics</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Track your dataset quality, approval rates, and progress toward your training goals. Get
        insights into your data distribution and identify areas for improvement.
      </p>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Dataset Grading</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Automatic A-D grading based on sample count, quality, validation, and approval rate. Aim
            for Grade A before training.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Quality Distribution</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Visual breakdown of your 1-5 star quality ratings. Track how many samples meet your
            quality threshold.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Status Overview</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            See counts for Draft, In Review, Approved, and Rejected samples. Know when you're ready
            to export.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Progress Tracking</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Set sample goals and track your progress with visual milestones. Celebrate when you hit
            "Ready to Train!"
          </p>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4">
        📊 Category Distribution
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Understanding your category distribution is critical for effective fine-tuning. A balanced
        dataset across categories ensures your model generalizes well and doesn't overfit to
        specific types of tasks.
      </p>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Why Balance Matters</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            If 90% of your data is "coding" examples, your model may struggle with creative writing
            or analysis tasks. Aim for proportional representation across your target use cases.
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Visual Distribution</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            See a breakdown of your samples by category (e.g., coding: 45%, writing: 30%, analysis:
            25%). Identify gaps and plan your data collection accordingly.
          </p>
        </div>
      </div>

      <div
        class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
      >
        <h3 class="font-semibold mb-2 text-amber-900 dark:text-amber-300">⚠️ Fine-Tuning Tip</h3>
        <p class="text-sm text-amber-800 dark:text-amber-400">
          When exporting, use <strong>stratified splitting</strong> to maintain category proportions
          in both training and validation sets. This ensures your model sees representative examples
          during training and is evaluated on a balanced test set.
        </p>
      </div>

      <div class="mt-6 space-y-3">
        <h3 class="font-semibold">
          Common Category Imbalances to Avoid
        </h3>
        <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-center gap-2">
            <span class="text-red-500">❌</span>
            <span
              ><strong>Over-specialization:</strong> 80%+ in one category limits model
              versatility</span
            >
          </div>
          <div class="flex items-center gap-2">
            <span class="text-red-500">❌</span>
            <span
              ><strong>Too many categories:</strong> 20+ categories with &lt;1% each creates
              noise</span
            >
          </div>
          <div class="flex items-center gap-2">
            <span class="text-green-500">✅</span>
            <span><strong>Sweet spot:</strong> 3-7 well-defined categories with 10-40% each</span>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4">Grading System</h2>
      <div class="space-y-3">
        <div class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <span class="text-2xl">🅰️</span>
          <div>
            <span class="font-semibold">Grade A (80-100)</span>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Production ready. High quality, sufficient samples.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span class="text-2xl">🅱️</span>
          <div>
            <span class="font-semibold">Grade B (60-79)</span>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Good quality. May need more samples or reviews.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <span class="text-2xl">🅲️</span>
          <div>
            <span class="font-semibold">Grade C (40-59)</span>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Needs work. Add more samples or improve quality.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <span class="text-2xl">🅳️</span>
          <div>
            <span class="font-semibold">Grade D (&lt;40)</span>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Not ready. Significant improvements needed.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4">Scoring Factors</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="flex items-start gap-3">
          <span class="text-blue-500 font-bold text-lg">25</span>
          <div>
            <h3 class="font-semibold">Quantity</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Sample count. More samples = higher score (max 25 points)
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-blue-500 font-bold text-lg">25</span>
          <div>
            <h3 class="font-semibold">Quality</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Average quality rating. 5-star average = max 25 points
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-blue-500 font-bold text-lg">25</span>
          <div>
            <h3 class="font-semibold">Validation</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Completeness of required fields (instruction, output)
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-blue-500 font-bold text-lg">25</span>
          <div>
            <h3 class="font-semibold">Approval Rate</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Percentage of samples marked as approved vs total
            </p>
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
