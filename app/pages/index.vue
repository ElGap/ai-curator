<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2">Datasets</h1>
        <p class="text-secondary">Create, manage, and organize your training data collections</p>
      </div>
      <button
        class="btn-primary flex items-center gap-2 border border-gray-500 dark:border-gray-500"
        @click="showCreateModal = true"
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
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Dataset
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
      <p class="mt-4 text-secondary">Loading datasets...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="datasets.length === 0" class="card text-center py-12">
      <div class="text-tertiary mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="mx-auto"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold mb-2">No datasets yet</h3>
      <p class="text-secondary mb-4">
        Create your first dataset to start collecting training examples.
      </p>
      <button class="btn-primary" @click="showCreateModal = true">Create Your First Dataset</button>
    </div>

    <!-- Dataset List -->
    <div v-else class="space-y-4">
      <div v-for="dataset in datasets" :key="dataset.id" class="card relative">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="mb-2">
              <NuxtLink
                :to="{ path: '/samples', query: { dataset: dataset.id } }"
                class="text-lg font-semibold hover:text-gray-700 dark:hover:text-gray-500 transition-colors"
              >
                {{ dataset.name }}
              </NuxtLink>
              <span
                v-if="dataset.id === defaultCaptureDatasetId && isLiveCaptureEnabled"
                class="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full"
                title="This dataset is enabled for live capture"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
                Live Capture
              </span>
              <p v-if="dataset.description" class="text-sm text-secondary mt-1">
                {{ dataset.description }}
              </p>
              <p
                v-if="dataset.goalName"
                class="text-sm text-gray-700 dark:text-gray-300 font-medium my-2"
              >
                🎯 {{ dataset.goalName }}
              </p>
            </div>

            <!-- Stats -->
            <div class="flex items-center gap-4 mt-4 text-sm text-secondary">
              <span class="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                </svg>
                {{ dataset.sampleCount }} / {{ dataset.goalSamples || 100 }} samples
              </span>
              <span class="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-gray-500"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {{ dataset.approvedCount }} approved
              </span>
              <span v-if="dataset.updatedAt" class="text-tertiary">
                Updated {{ timeAgo(dataset.updatedAt) }}
              </span>
              <span v-else class="text-tertiary">Never updated</span>
            </div>

            <!-- Settings -->
            <div class="flex items-center gap-2 mt-3">
              <span
                class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded font-medium"
                title="Use this ID for CLI commands: curator --dataset {{ dataset.id }}"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
                ID: {{ dataset.id }}
              </span>
              <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-secondary text-xs rounded">
                Quality: {{ dataset.defaultQuality }}
              </span>
              <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-secondary text-xs rounded">
                Category: {{ dataset.defaultCategory }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <NuxtLink
              :to="{ path: '/samples', query: { dataset: dataset.id } }"
              class="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              View
            </NuxtLink>
            <NuxtLink
              :to="{ path: '/samples/new', query: { dataset: dataset.id } }"
              class="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add
            </NuxtLink>
            <NuxtLink
              :to="{ path: '/import', query: { dataset: dataset.id } }"
              class="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" x2="12" y1="3" y2="15"></line>
              </svg>
              Import
            </NuxtLink>
            <NuxtLink
              :to="{ path: '/analytics', query: { dataset: dataset.id } }"
              class="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Analytics
            </NuxtLink>
            <NuxtLink
              :to="{ path: '/export', query: { dataset: dataset.id } }"
              class="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" x2="12" y1="15" y2="3"></line>
              </svg>
              Export
            </NuxtLink>
            <button
              v-if="datasets.length > 1"
              class="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
              title="Merge into another dataset"
              @click="openMergeModal(dataset)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
              Merge
            </button>
            <button
              class="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
              title="Edit"
              @click="editDataset(dataset)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              Edit
            </button>
            <button
              v-if="datasets.length > 1"
              class="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1"
              title="Delete"
              @click="confirmDelete(dataset)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Dataset Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Create New Dataset</h3>
        <form @submit.prevent="createDataset">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="createForm.name"
                type="text"
                required
                maxlength="100"
                placeholder="e.g., Python Code Examples"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Description
              </label>
              <textarea
                v-model="createForm.description"
                maxlength="500"
                rows="2"
                placeholder="What kind of examples will this dataset contain?"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Default Quality
                </label>
                <select
                  v-model="createForm.defaultQuality"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Goal (samples)
                </label>
                <div class="flex gap-2">
                  <select
                    v-model="createForm.goalPreset"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  >
                    <option value="100">100 (Beginner)</option>
                    <option value="250">250 (Intermediate)</option>
                    <option value="500">500 (Advanced)</option>
                    <option value="1000">1000 (Professional)</option>
                    <option value="custom">Custom...</option>
                  </select>
                  <input
                    v-if="createForm.goalPreset === 'custom'"
                    v-model.number="createForm.customGoalSamples"
                    type="number"
                    min="10"
                    max="10000"
                    placeholder="#"
                    class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Project / Goal Name
              </label>
              <input
                v-model="createForm.goalName"
                type="text"
                maxlength="50"
                placeholder="e.g., First Fine-Tuning, Customer Support Bot, etc."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <p class="text-xs text-tertiary mt-1">
                This name will be displayed in progress tracking
              </p>
            </div>
            <div class="flex items-center gap-2">
              <input
                id="autoApprove"
                v-model="createForm.defaultAutoApprove"
                type="checkbox"
                class="w-4 h-4 text-gray-700 rounded focus:ring-blue-500"
              />
              <label for="autoApprove" class="text-sm text-gray-700 dark:text-gray-200">
                Auto-approve imported examples
              </label>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button
              type="button"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="showCreateModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="creating || !createForm.name"
              class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {{ creating ? "Creating..." : "Create" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Dataset Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Dataset</h3>
        <form @submit.prevent="updateDataset">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="editForm.name"
                type="text"
                required
                maxlength="100"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Description
              </label>
              <textarea
                v-model="editForm.description"
                maxlength="500"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Default Quality
                </label>
                <select
                  v-model="editForm.defaultQuality"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Goal (samples)
                </label>
                <div class="flex gap-2">
                  <select
                    v-model="editForm.goalPreset"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  >
                    <option value="100">100 (Beginner)</option>
                    <option value="250">250 (Intermediate)</option>
                    <option value="500">500 (Advanced)</option>
                    <option value="1000">1000 (Professional)</option>
                    <option value="custom">Custom...</option>
                  </select>
                  <input
                    v-if="editForm.goalPreset === 'custom'"
                    v-model.number="editForm.customGoalSamples"
                    type="number"
                    min="10"
                    max="10000"
                    placeholder="#"
                    class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Project / Goal Name
              </label>
              <input
                v-model="editForm.goalName"
                type="text"
                maxlength="50"
                placeholder="e.g., First Fine-Tuning, Customer Support Bot, etc."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <p class="text-xs text-tertiary mt-1">
                This name will be displayed in progress tracking
              </p>
            </div>
            <div class="flex items-center gap-2">
              <input
                id="editAutoApprove"
                v-model="editForm.defaultAutoApprove"
                type="checkbox"
                class="w-4 h-4 text-gray-700 rounded focus:ring-blue-500"
              />
              <label for="editAutoApprove" class="text-sm text-gray-700 dark:text-gray-200">
                Auto-approve imported examples
              </label>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button
              type="button"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="showEditModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="updating"
              class="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {{ updating ? "Saving..." : "Save Changes" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <div class="text-center">
          <div
            class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-red-600 dark:text-red-400"
            >
              <polyline points="3 6 5 6 21 6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Delete Dataset</h3>
          <p class="text-secondary mb-4">
            Are you sure you want to delete
            <strong class="text-gray-900 dark:text-gray-100">{{ datasetToDelete?.name }}</strong
            >?
          </p>
          <p class="text-sm text-red-600 dark:text-red-400 mb-4">
            <span v-if="datasetToDelete?.sampleCount > 0">
              This will permanently delete {{ datasetToDelete?.sampleCount }} sample(s). This action
              cannot be undone.
            </span>
            <span v-else>This action cannot be undone.</span>
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="showDeleteModal = false"
            >
              Cancel
            </button>
            <button
              :disabled="deleting"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              @click="deleteDataset"
            >
              {{ deleting ? "Deleting..." : "Delete" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Merge Modal -->
    <div
      v-if="showMergeModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showMergeModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
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
              <path
                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
              />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Merge Dataset</h3>
        </div>

        <p class="text-secondary mb-4">
          Merge
          <strong class="text-gray-900 dark:text-gray-100">{{ datasetToMerge?.name }}</strong> ({{
            datasetToMerge?.sampleCount
          }}
          samples) into:
        </p>

        <!-- Merge Mode Selection -->
        <div class="space-y-3 mb-4">
          <label
            class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <input
              v-model="mergeForm.mergeMode"
              type="radio"
              value="existing"
              class="w-4 h-4 text-blue-600"
            />
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-gray-100">Existing Dataset</div>
              <div class="text-sm text-secondary">Merge into an existing dataset</div>
            </div>
          </label>

          <label
            class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <input
              v-model="mergeForm.mergeMode"
              type="radio"
              value="new"
              class="w-4 h-4 text-blue-600"
            />
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-gray-100">New Dataset</div>
              <div class="text-sm text-secondary">Create a new dataset with merged samples</div>
            </div>
          </label>
        </div>

        <!-- Target Dataset Selection (Existing) -->
        <div v-if="mergeForm.mergeMode === 'existing'" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Target Dataset <span class="text-red-500">*</span>
          </label>
          <select
            v-model="mergeForm.targetDatasetId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select a dataset...</option>
            <option
              v-for="ds in datasets.filter((d) => d.id !== datasetToMerge?.id)"
              :key="ds.id"
              :value="ds.id"
            >
              {{ ds.name }} ({{ ds.sampleCount }} samples)
            </option>
          </select>
        </div>

        <!-- New Dataset Name (New) -->
        <div v-if="mergeForm.mergeMode === 'new'" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            New Dataset Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="mergeForm.newDatasetName"
            type="text"
            placeholder="e.g., Merged Training Data"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <!-- Delete Source Option -->
        <div class="mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="mergeForm.deleteSource"
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <span class="text-sm text-gray-700 dark:text-gray-200">
              Delete source dataset after merge
            </span>
          </label>
        </div>

        <!-- Warning -->
        <div
          class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4"
        >
          <p class="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Warning:</strong> This action cannot be undone. Samples will be copied to the
            target dataset.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            @click="showMergeModal = false"
          >
            Cancel
          </button>
          <button
            :disabled="
              merging ||
              (mergeForm.mergeMode === 'existing' && !mergeForm.targetDatasetId) ||
              (mergeForm.mergeMode === 'new' && !mergeForm.newDatasetName.trim())
            "
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            @click="executeMerge"
          >
            {{ merging ? "Merging..." : "Merge" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // State
  const loading = ref(true);
  const datasets = ref<any[]>([]);
  const showCreateModal = ref(false);
  const showEditModal = ref(false);
  const showDeleteModal = ref(false);
  const showMergeModal = ref(false);
  const creating = ref(false);
  const updating = ref(false);
  const deleting = ref(false);
  const merging = ref(false);
  const datasetToDelete = ref<any>(null);
  const datasetToMerge = ref<any>(null);

  // Settings
  const defaultCaptureDatasetId = ref<number | null>(null);
  const isLiveCaptureEnabled = ref(false);

  // Forms
  const createForm = reactive({
    name: "",
    description: "",
    defaultQuality: "medium",
    defaultCategory: "general",
    defaultAutoApprove: false,
    goalPreset: "100" as "100" | "250" | "500" | "1000" | "custom",
    customGoalSamples: 100,
    goalName: "First Fine-Tuning",
  });

  const editForm = reactive({
    id: 0,
    name: "",
    description: "",
    defaultQuality: "medium",
    defaultCategory: "general",
    defaultAutoApprove: false,
    goalPreset: "100" as "100" | "250" | "500" | "1000" | "custom",
    customGoalSamples: 100,
    goalSamples: null as number | null,
    goalName: "First Fine-Tuning",
  });

  const mergeForm = reactive({
    mergeMode: "existing" as "existing" | "new",
    targetDatasetId: "",
    newDatasetName: "",
    deleteSource: false,
  });

  // Helper functions
  function timeAgo(timestamp: string) {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  async function loadCaptureSettings() {
    try {
      const response = (await $fetch("/api/settings/capture-default")) as any;
      if (response.success) {
        defaultCaptureDatasetId.value = response.datasetId;
        isLiveCaptureEnabled.value = response.isEnabled ?? true;
      }
    } catch (error) {
      console.error("Error loading capture settings:", error);
    }
  }

  async function loadData() {
    try {
      loading.value = true;

      // Load datasets and capture settings in parallel
      await Promise.all([
        (async () => {
          const datasetsResponse = await $fetch("/api/datasets");
          datasets.value = datasetsResponse.datasets || [];
        })(),
        loadCaptureSettings(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      loading.value = false;
    }
  }

  // Create dataset
  async function createDataset() {
    try {
      creating.value = true;

      const goalValue =
        createForm.goalPreset === "custom"
          ? createForm.customGoalSamples
          : parseInt(createForm.goalPreset);

      const response = await $fetch("/api/datasets", {
        method: "POST",
        body: {
          name: createForm.name,
          description: createForm.description,
          defaultQuality: createForm.defaultQuality,
          defaultCategory: createForm.defaultCategory,
          defaultAutoApprove: createForm.defaultAutoApprove,
          goalSamples: goalValue,
          goalName: createForm.goalName,
        },
      });

      if (response.success) {
        showCreateModal.value = false;
        createForm.name = "";
        createForm.description = "";
        createForm.defaultQuality = "medium";
        createForm.defaultCategory = "general";
        createForm.defaultAutoApprove = false;
        createForm.goalPreset = "100";
        createForm.customGoalSamples = 100;
        createForm.goalName = "First Fine-Tuning";
        await loadData();
      }
    } catch (error) {
      console.error("Error creating dataset:", error);
      alert("Failed to create dataset");
    } finally {
      creating.value = false;
    }
  }

  // Edit dataset
  function editDataset(dataset: any) {
    editForm.id = dataset.id;
    editForm.name = dataset.name;
    editForm.description = dataset.description || "";
    editForm.defaultQuality = dataset.defaultQuality;
    editForm.defaultCategory = dataset.defaultCategory;
    editForm.defaultAutoApprove = dataset.defaultAutoApprove === 1;
    editForm.goalName = dataset.goalName || "First Fine-Tuning";

    // Determine preset based on goalSamples value
    const goalValue = dataset.goalSamples || 100;
    const presetValues = [100, 250, 500, 1000];
    if (presetValues.includes(goalValue)) {
      editForm.goalPreset = String(goalValue) as any;
    } else {
      editForm.goalPreset = "custom";
      editForm.customGoalSamples = goalValue;
    }
    editForm.goalSamples = goalValue;

    showEditModal.value = true;
  }

  async function updateDataset() {
    try {
      updating.value = true;

      const goalValue =
        editForm.goalPreset === "custom"
          ? editForm.customGoalSamples
          : parseInt(editForm.goalPreset);

      const response = await $fetch(`/api/datasets/${editForm.id}`, {
        method: "PUT",
        body: {
          name: editForm.name,
          description: editForm.description,
          defaultQuality: editForm.defaultQuality,
          defaultCategory: editForm.defaultCategory,
          defaultAutoApprove: editForm.defaultAutoApprove,
          goalSamples: goalValue,
          goalName: editForm.goalName,
        },
      });

      if (response.success) {
        showEditModal.value = false;
        await loadData();
      }
    } catch (error) {
      console.error("Error updating dataset:", error);
      alert("Failed to update dataset");
    } finally {
      updating.value = false;
    }
  }

  // Delete dataset
  function confirmDelete(dataset: any) {
    datasetToDelete.value = dataset;
    showDeleteModal.value = true;
  }

  async function deleteDataset() {
    if (!datasetToDelete.value) return;

    try {
      deleting.value = true;
      await $fetch(`/api/datasets/${datasetToDelete.value.id}`, {
        method: "DELETE",
      });

      showDeleteModal.value = false;
      datasetToDelete.value = null;
      await loadData();
    } catch (error) {
      console.error("Error deleting dataset:", error);
      alert("Failed to delete dataset");
    } finally {
      deleting.value = false;
    }
  }

  // Merge dataset
  function openMergeModal(dataset: any) {
    datasetToMerge.value = dataset;
    // Reset form
    mergeForm.mergeMode = "existing";
    mergeForm.targetDatasetId = "";
    mergeForm.newDatasetName = "";
    mergeForm.deleteSource = false;
    showMergeModal.value = true;
  }

  async function executeMerge() {
    if (!datasetToMerge.value) return;

    try {
      merging.value = true;

      const response = await $fetch("/api/datasets/merge", {
        method: "POST",
        body: {
          sourceDatasetId: datasetToMerge.value.id,
          targetDatasetId:
            mergeForm.mergeMode === "existing" ? parseInt(mergeForm.targetDatasetId) : null,
          newDatasetName: mergeForm.mergeMode === "new" ? mergeForm.newDatasetName.trim() : null,
          deleteSource: mergeForm.deleteSource,
        },
      });

      if (response.success) {
        showMergeModal.value = false;
        datasetToMerge.value = null;
        await loadData();
      } else {
        alert(response.message || "Failed to merge datasets");
      }
    } catch (error: any) {
      console.error("Error merging datasets:", error);
      alert(error?.data?.message || "Failed to merge datasets");
    } finally {
      merging.value = false;
    }
  }

  onMounted(() => {
    loadData();

    // Close modals on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        showCreateModal.value = false;
        showEditModal.value = false;
        showDeleteModal.value = false;
        showMergeModal.value = false;
      }
    });
  });

  useHead({
    title: "Dashboard - AI Curator",
  });
</script>
