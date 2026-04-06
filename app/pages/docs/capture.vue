<template>
  <div class="space-y-8">
    <section class="card">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-2xl font-bold">Universal Capture API</h2>
        <span
          class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full"
          >Experimental</span
        >
      </div>

      <div class="prose dark:prose-invert max-w-none mb-6">
        <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          The <strong>Universal Capture API</strong> is a single HTTP endpoint that accepts training
          data from any source in real-time. Instead of manual imports and file management, capture
          training examples as they happen - directly from your IDE, chat interface, or custom
          integrations.
        </p>

        <h3 class="text-lg font-semibold mt-6 mb-3">
          Why This Matters
        </h3>

        <ul class="space-y-2 text-gray-700 dark:text-gray-300 mb-6">
          <li>
            <strong>One API, All Sources:</strong> Same endpoint accepts data from OpenCode,
            OpenWebUI, custom scripts, or any other source. No special handling needed.
          </li>
          <li>
            <strong>Real-Time Capture:</strong> Data flows instantly with automatic categorization,
            quality scoring, and duplicate detection.
          </li>
          <li>
            <strong>Rich Context:</strong> Automatically captures code files, git state, environment
            info, model details - not just the conversation.
          </li>
          <li>
            <strong>Zero Authentication:</strong> Local-first design runs on localhost. No API keys,
            no auth complexity.
          </li>
        </ul>

        <h3 class="text-lg font-semibold mt-6 mb-3">
          Getting Started
        </h3>

        <p class="text-gray-700 dark:text-gray-300 mb-4">
          The fastest way to start capturing data is using one of the ready-made plugins:
        </p>

        <div class="space-y-2 mb-6">
          <div class="flex items-start gap-3">
            <span class="text-gray-500">→</span>
            <div>
              <a
                href="https://opencode.ai"
                target="_blank"
                class="font-semibold hover:underline"
              >
                OpenCode Plugin
              </a>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Capture AI conversations from your IDE (VS Code, JetBrains, terminal)
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-gray-500">→</span>
            <div>
              <a
                href="https://openwebui.com"
                target="_blank"
                class="font-semibold hover:underline"
              >
                OpenWebUI Plugin
              </a>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Capture from OpenWebUI chat interface for web-based AI interactions
              </p>
            </div>
          </div>
        </div>

        <p class="text-gray-700 dark:text-gray-300">
          Or build your own integration using the API below. Simple HTTP POST to
          <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">/api/capture</code>
          .
        </p>
      </div>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
        <div class="text-gray-300 mb-2">POST /api/capture</div>
        <div class="text-gray-400">Content-Type: application/json</div>
      </div>

      <h3 class="font-semibold mb-2">Key Features</h3>
      <ul class="space-y-2 text-gray-600 dark:text-gray-400 mb-6">
        <li>
          <strong>Universal Format:</strong> Single schema for
          all data sources
        </li>
        <li>
          <strong>No Authentication:</strong> Local-first
          design, runs on localhost
        </li>
        <li>
          <strong>Auto-Enrichment:</strong> Automatic
          categorization and quality scoring
        </li>
        <li>
          <strong>Duplicate Detection:</strong> Prevents
          duplicate entries
        </li>
        <li>
          <strong>Batch Support:</strong> Up to 100 records
          per request
        </li>
      </ul>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4">Request Schema</h2>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2 text-white">Basic Structure</h4>
        <pre class="font-mono text-sm text-gray-100 overflow-x-auto"><code>{
  "source": "opencode",              // Required: Source identifier
  "apiVersion": "1.0",               // API version
  
  "session": {                       // Optional: Session grouping
    "id": "sess_abc123",
    "name": "Debug Session",
    "startedAt": "2024-01-15T10:30:00Z"
  },
  
  "records": [                       // Required: Array of records (1-100)
    {
      "instruction": "How do I...?",   // Required: The question/prompt
      "output": "Here's how...",       // Required: The answer/response
      "input": "Additional context",   // Optional: Extra context
      "systemPrompt": "You are...",    // Optional: System instructions
      
      // Metadata (optional)
      "source": "opencode",
      "sessionId": "sess_abc123",
      "messageId": "msg_001",
      "timestamp": "2024-01-15T10:30:00Z",
      
      // Categorization (optional)
      "category": "coding",
      "difficulty": "intermediate",
      "qualityRating": 4,
      "tags": ["python", "async"],
      
      // Rich context (optional)
      "context": {
        "files": [...],
        "environment": {...},
        "git": {...},
        "model": {...}
      }
    }
  ],
  
  "options": {                       // Processing options
    "datasetId": 1,                  // Target dataset (or auto-select active)
    "autoApprove": false,            // Auto-approve on capture
    "skipDuplicates": true,          // Skip duplicate detection
    "enrichMetadata": true,          // Auto-categorize and score
    "dryRun": false                  // Validate only, don't store
  }
}</code></pre>
      </div>

      <h4 class="font-semibold mb-2">Core Fields</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Field</th>
              <th class="px-4 py-2">Type</th>
              <th class="px-4 py-2">Required</th>
              <th class="px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">source</td>
              <td class="px-4 py-2">string</td>
              <td class="px-4 py-2">Yes</td>
              <td class="px-4 py-2">Source identifier (e.g., "opencode", "import-csv")</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">instruction</td>
              <td class="px-4 py-2">string</td>
              <td class="px-4 py-2">Yes</td>
              <td class="px-4 py-2">The question, prompt, or user request</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">output</td>
              <td class="px-4 py-2">string</td>
              <td class="px-4 py-2">Yes</td>
              <td class="px-4 py-2">The answer, response, or AI output</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">input</td>
              <td class="px-4 py-2">string</td>
              <td class="px-4 py-2">No</td>
              <td class="px-4 py-2">Additional context provided (code snippets, etc.)</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">systemPrompt</td>
              <td class="px-4 py-2">string</td>
              <td class="px-4 py-2">No</td>
              <td class="px-4 py-2">System instructions given to the model</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4">Response Schema</h2>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2 text-white">Success Response (200)</h4>
        <pre class="font-mono text-sm text-gray-100 overflow-x-auto"><code>{
  "success": true,
  "capture": {
    "id": "cap_1234567890_abc",
    "source": "opencode",
    "dataset": {
      "id": 1,
      "name": "MyProject"
    },
    "samples": [
      {
        "id": 42,
        "url": "/samples/42",
        "status": "draft"
      }
    ],
    "summary": {
      "total": 1,
      "created": 1,
      "skipped": 0,
      "failed": 0
    }
  },
  "processing": {
    "duration": 45,
    "enriched": true,
    "duplicates": []
  },
  "links": {
    "review": "/samples?source=opencode&dataset=1",
    "dataset": "/datasets/1"
  },
  "message": "Successfully captured 1 records to \"MyProject\""
}</code></pre>
      </div>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2 text-white">Error Response (400/404/500)</h4>
        <pre class="font-mono text-sm text-gray-100 overflow-x-auto"><code>{
  "success": false,
  "error": {
    "code": "SOURCE_NOT_FOUND",
    "message": "Source 'unknown' is not registered"
  }
}</code></pre>
      </div>

      <h4 class="font-semibold mb-2">Error Codes</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Code</th>
              <th class="px-4 py-2">HTTP</th>
              <th class="px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">VALIDATION_ERROR</td>
              <td class="px-4 py-2">400</td>
              <td class="px-4 py-2">Request schema validation failed</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">SOURCE_NOT_FOUND</td>
              <td class="px-4 py-2">400</td>
              <td class="px-4 py-2">Source identifier not registered</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">SOURCE_DISABLED</td>
              <td class="px-4 py-2">403</td>
              <td class="px-4 py-2">Source is disabled in settings</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">DATASET_NOT_FOUND</td>
              <td class="px-4 py-2">404</td>
              <td class="px-4 py-2">Specified dataset ID doesn't exist</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">NO_ACTIVE_DATASET</td>
              <td class="px-4 py-2">400</td>
              <td class="px-4 py-2">No dataset specified and no active dataset</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono">INTERNAL_ERROR</td>
              <td class="px-4 py-2">500</td>
              <td class="px-4 py-2">Unexpected server error</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4">Usage Examples</h2>

      <div class="space-y-6">
        <div>
          <h3 class="font-semibold mb-2">1. Python Script</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-2">
            Import historical data from any source using Python:
          </p>
          <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre><code>import requests

# Parse your custom format
def parse_legacy_log(line):
    parts = line.split('|||')
    return {
        'instruction': parts[0],
        'output': parts[1],
        'timestamp': parts[2]
    }

# Read and parse file
records = []
with open('legacy-logs.txt') as f:
    for line in f:
        records.append(parse_legacy_log(line))

# Send to AI Curator
response = requests.post(
    'http://localhost:3030/api/capture',
    json={
        'source': 'legacy-import',
        'apiVersion': '1.0',
        'records': records[:100],  // Batch of 100
        'options': {
            'datasetId': 1,
            'autoApprove': False
        }
    }
)

print(f"Imported: {response.json()['capture']['summary']['created']} records")</code></pre>
          </div>
        </div>

        <div>
          <h3 class="font-semibold mb-2">2. cURL Command</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-2">
            Quick test using cURL from command line:
          </p>
          <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre><code>curl -X POST http://localhost:3030/api/capture \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual-test",
    "apiVersion": "1.0",
    "records": [{
      "instruction": "How do I sort an array in Python?",
      "output": "Use the sorted() function or .sort() method.",
      "category": "coding",
      "difficulty": "beginner",
      "tags": ["python", "arrays"]
    }],
    "options": {
      "autoApprove": true
    }
  }'</code></pre>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4">Best Practices</h2>

      <div class="space-y-6">
        <div>
          <h3 class="font-semibold mb-2">
            1. Batch Records Efficiently
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Send up to 100 records per request. For large imports, batch your data to reduce HTTP
            overhead:
          </p>
          <div class="bg-gray-900 text-gray-100 p-3 rounded-lg mt-2 font-mono text-sm">
            for (const batch of chunk(allRecords, 100)) {<br />
            &nbsp;&nbsp;await fetch('/api/capture', { records: batch });<br />
            }
          </div>
        </div>

        <div>
          <h3 class="font-semibold mb-2">
            2. Use Session IDs for Grouping
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Group related captures by session. This helps organize conversations and view them as
            threads in the UI.
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">3. Provide Rich Context</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Include file paths, environment info, and model details when available. This creates
            higher quality training data and better context for review.
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">
            4. Use messageId for Duplicate Prevention
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Always provide a unique messageId. This enables automatic duplicate detection across
            imports and prevents data loss from accidental re-imports.
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">
            5. Leverage Auto-Enrichment
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Let AI Curator auto-categorize and score your data by setting enrichMetadata: true. You
            can always adjust categories later in the UI.
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">6. Test with Dry Run</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Before importing large datasets, use dryRun: true to validate your data format without
            actually storing anything.
          </p>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4">Rich Context Fields</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Provide additional context to enhance your training data. All context fields are optional -
        include what you have, omit what you don't.
      </p>

      <div class="space-y-4">
        <div class="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <h4 class="font-semibold mb-2 text-white">File Context</h4>
          <pre class="font-mono text-sm text-gray-100 overflow-x-auto"><code>"context": {
  "files": [
    {
      "path": "api/routes.py",
      "content": "def get_user(user_id):...",
      "language": "python"
    }
  ]
}</code></pre>
        </div>

        <div class="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <h4 class="font-semibold mb-2 text-white">Environment</h4>
          <pre class="font-mono text-sm text-gray-100 overflow-x-auto"><code>"context": {
  "environment": {
    "os": "darwin",
    "shell": "zsh",
    "language": "python",
    "workingDirectory": "/home/user/project"
  }
}</code></pre>
        </div>

        <div class="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <h4 class="font-semibold mb-2 text-white">Git Information</h4>
          <pre class="font-mono text-sm text-gray-100 overflow-x-auto"><code>"context": {
  "git": {
    "branch": "feature/rate-limiting",
    "commit": "a1b2c3d",
    "changedFiles": ["api/routes.py", "requirements.txt"]
  }
}</code></pre>
        </div>

        <div class="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <h4 class="font-semibold mb-2 text-white">Model Information</h4>
          <pre class="font-mono text-sm text-gray-100 overflow-x-auto"><code>"context": {
  "model": {
    "name": "claude-3.5-sonnet",
    "provider": "anthropic",
    "version": "20241022",
    "parameters": {
      "temperature": 0.7,
      "maxTokens": 4096
    }
  }
}</code></pre>
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
