<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Import from JSON</h1>
      <p class="text-secondary">Upload a JSON or JSONL file with training samples.</p>
    </div>

    <div class="card">
      <div class="mb-6">
        <label class="form-label block mb-2">Upload JSON or JSONL File</label>
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref="fileInput"
            type="file"
            accept=".json,.jsonl"
            class="hidden"
            @change="handleFileUpload"
          />
          <div v-if="!fileContent" class="space-y-2">
            <div class="text-4xl">📄</div>
            <p class="text-secondary">Click to upload or drag and drop</p>
            <p class="text-sm text-tertiary">Supports .json and .jsonl files</p>
            <button class="btn-secondary mt-2" @click="$refs.fileInput.click()">Select File</button>
          </div>
          <div v-else class="text-gray-700">
            <div class="text-4xl mb-2">✓</div>
            <p class="font-medium">{{ fileName }}</p>
            <p class="text-sm">{{ fileSize }} • {{ parsedSamples.length }} samples found</p>
            <button class="text-sm text-tertiary hover:text-secondary mt-2" @click="clearFile">
              Remove file
            </button>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="parsedSamples.length > 0" class="mb-6">
        <h3 class="font-semibold mb-3">Preview (first 3 samples)</h3>
        <div class="space-y-3">
          <div
            v-for="(sample, idx) in parsedSamples.slice(0, 3)"
            :key="idx"
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <p class="font-medium text-sm mb-1">Instruction:</p>
            <p class="text-sm text-secondary mb-2 line-clamp-2">{{ sample.instruction }}</p>
            <p class="font-medium text-sm mb-1">Output:</p>
            <p class="text-sm text-secondary line-clamp-2">{{ sample.output }}</p>
          </div>
          <p v-if="parsedSamples.length > 3" class="text-sm text-tertiary text-center">
            ... and {{ parsedSamples.length - 3 }} more samples
          </p>
        </div>
      </div>

      <!-- Import Button -->
      <div v-if="fileContent && parsedSamples.length > 0" class="flex justify-between">
        <NuxtLink to="/import" class="btn-secondary"> ← Back </NuxtLink>
        <button :disabled="importing" class="btn-primary" @click="importData">
          <span v-if="importing">Importing...</span>
          <span v-else>Import {{ parsedSamples.length }} Samples</span>
        </button>
      </div>

      <!-- Success Message -->
      <div
        v-if="importComplete"
        class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <p class="text-gray-800 font-medium">✅ Import Complete!</p>
        <p class="text-gray-700 text-sm">Successfully imported {{ importedCount }} samples.</p>
        <div class="mt-3 flex gap-2">
          <NuxtLink to="/samples" class="btn-primary"> View Dataset → </NuxtLink>
          <button class="btn-secondary" @click="reset">Import More</button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <p class="text-red-800 font-medium">❌ Error</p>
        <pre class="text-red-700 text-sm mt-1 whitespace-pre-wrap font-sans">{{ error }}</pre>
      </div>
    </div>

    <!-- Format Help -->
    <div class="mt-6 card">
      <h3 class="font-semibold mb-3">Supported Formats</h3>
      <p class="text-secondary mb-4 text-sm">Files must use standard field names:</p>

      <div class="space-y-4 text-sm">
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="font-semibold mb-1">1. Standard JSON Array</p>
          <pre
            class="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 p-2 rounded text-xs overflow-x-auto"
          ><code>[{
  "instruction": "What is Python?",
  "output": "Python is a programming language..."
}]</code></pre>
        </div>

        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="font-semibold mb-1">2. Alpaca Format (with input)</p>
          <pre
            class="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 p-2 rounded text-xs overflow-x-auto"
          ><code>[{
  "instruction": "Explain Python",
  "input": "",
  "output": "Python is a programming language..."
}]</code></pre>
        </div>

        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="font-semibold mb-1">3. JSON Lines (JSONL)</p>
          <p class="text-secondary mb-2">One JSON object per line:</p>
          <pre
            class="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 p-2 rounded text-xs overflow-x-auto"
          ><code>{"instruction": "Hello", "output": "Hi there!"}
{"instruction": "How are you?", "output": "I'm good!"}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  const fileInput = ref(null);
  const fileName = ref("");
  const fileSize = ref("");
  const fileContent = ref("");
  const parsedSamples = ref([]);
  const importing = ref(false);
  const importComplete = ref(false);
  const importedCount = ref(0);
  const error = ref("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    fileName.value = file.name;
    fileSize.value = (file.size / 1024).toFixed(1) + " KB";
    error.value = "";

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        fileContent.value = e.target.result;
        parseSamples();
      } catch (err) {
        error.value = "Failed to read file: " + err.message;
      }
    };

    reader.onerror = (_e) => {
      error.value = "Failed to read file. Please try again.";
    };

    reader.readAsText(file);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const parseSamples = () => {
    try {
      const content = fileContent.value.trim();

      // Check if content is empty
      if (!content) {
        error.value = "File is empty. Please upload a valid JSON or JSONL file.";
        parsedSamples.value = [];
        return;
      }

      let rawData = [];
      let isJSONL = false;

      // Try to detect if it's JSONL (one JSON object per line)
      const lines = content.split("\n").filter((line) => line.trim());

      if (lines.length > 0) {
        // Test if every line is valid JSON
        const allLinesValid = lines.every((_line, _idx) => {
          try {
            JSON.parse(_line);
            return true;
          } catch (_e) {
            return false;
          }
        });

        if (allLinesValid && lines.length > 0) {
          // It's JSONL format
          isJSONL = true;
          try {
            rawData = lines.map((line, idx) => {
              try {
                return JSON.parse(line);
              } catch (e) {
                throw new Error(`Failed to parse line ${idx + 1}: ${e.message}`);
              }
            });
          } catch (e) {
            error.value = `JSONL parsing error: ${e.message}`;
            parsedSamples.value = [];
            return;
          }
        }
      }

      // If not JSONL, try regular JSON
      if (!isJSONL) {
        try {
          const data = JSON.parse(content);

          if (Array.isArray(data)) {
            rawData = data;
          } else if (data.examples && Array.isArray(data.examples)) {
            rawData = data.examples;
          } else if (data.data && Array.isArray(data.data)) {
            rawData = data.data;
          } else {
            // Single object, wrap in array
            rawData = [data];
          }
        } catch (e) {
          // Provide more helpful error message
          let errorMsg = e.message;
          if (errorMsg.includes("Unexpected end of JSON")) {
            errorMsg =
              "JSON is incomplete or missing closing brackets. Check if the file was fully uploaded.";
          } else if (errorMsg.includes("Unexpected token")) {
            errorMsg = `JSON syntax error: ${errorMsg}. Check for trailing commas or invalid characters.`;
          }
          error.value = `JSON parsing error: ${errorMsg}`;
          parsedSamples.value = [];
          return;
        }
      }

      // Check if we have any data
      if (!rawData || rawData.length === 0) {
        error.value = "No data found in file. Please check the file format.";
        parsedSamples.value = [];
        return;
      }

      // Map fields - only accept standard field names
      parsedSamples.value = rawData
        .map((item, idx) => {
          return {
            id: idx.toString(),
            instruction: formatValue(item.instruction || ""),
            input: formatValue(item.input || ""),
            output: formatValue(item.output || ""),
            systemPrompt: item.systemPrompt || item.system || null,
            category: item.category || "general",
            difficulty: item.difficulty || "intermediate",
            qualityRating: item.qualityRating || 3,
            tags: item.tags || [],
            source: "import",
          };
        })
        .filter((sample) => sample.instruction && sample.output);

      if (parsedSamples.value.length === 0) {
        error.value =
          "No valid samples found. Please check your file format. Samples must have 'instruction' and 'output' fields.";
      }
    } catch (err) {
      error.value = "Invalid JSON: " + err.message;
      parsedSamples.value = [];
    }
  };

  const clearFile = () => {
    fileContent.value = "";
    fileName.value = "";
    fileSize.value = "";
    parsedSamples.value = [];
    error.value = "";
    importComplete.value = false;
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  };

  const importData = async () => {
    importing.value = true;
    error.value = "";

    try {
      const response = await $fetch("/api/import/json", {
        method: "POST",
        body: {
          samples: parsedSamples.value,
          format: "raw",
        },
      });

      importedCount.value = response.imported;
      importComplete.value = true;
    } catch (err) {
      // Better error handling to show validation details
      if (err.data && Array.isArray(err.data)) {
        // Zod validation errors
        const issues = err.data
          .map((issue) => {
            const path = issue.path ? issue.path.join(".") : "unknown";
            return `${path}: ${issue.message}`;
          })
          .join("\n");
        error.value = `Validation failed:\n${issues}`;
      } else {
        error.value = err.message || "Import failed";
      }
    } finally {
      importing.value = false;
    }
  };

  const reset = () => {
    clearFile();
    importComplete.value = false;
    importedCount.value = 0;
  };

  definePageMeta({
    layout: "default",
  });
</script>
