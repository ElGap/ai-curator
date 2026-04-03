<template>
  <div class="space-y-8">
    <section class="card">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">CLI Reference</h2>
        <span
          class="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full"
          >Experimental</span
        >
      </div>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        The AI Curator Command Line Interface provides powerful tools for importing datasets from
        various sources, managing your training data, and exporting for fine-tuning.
      </p>

      <div class="overflow-x-auto mb-6">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Command</th>
              <th class="px-4 py-2">Description</th>
              <th class="px-4 py-2">Example</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">curator</td>
              <td class="px-4 py-2">Start the server (opens browser by default)</td>
              <td class="px-4 py-2 font-mono text-xs">curator --no-browser</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">search</td>
              <td class="px-4 py-2">Search Kaggle & Hugging Face datasets</td>
              <td class="px-4 py-2 font-mono text-xs">search "python qa"</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">download</td>
              <td class="px-4 py-2">Download and import from external sources</td>
              <td class="px-4 py-2 font-mono text-xs">download kaggle:owner/name</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">import</td>
              <td class="px-4 py-2">Import local files</td>
              <td class="px-4 py-2 font-mono text-xs">import data.json --dataset 3</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">export</td>
              <td class="px-4 py-2">Export dataset to file</td>
              <td class="px-4 py-2 font-mono text-xs">export --output train.json</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">reset</td>
              <td class="px-4 py-2">Reset database</td>
              <td class="px-4 py-2 font-mono text-xs">reset --force</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <h3 class="font-semibold mb-2 text-blue-900 dark:text-blue-300">Quick Tip</h3>
        <p class="text-sm text-blue-800 dark:text-blue-400">
          Use <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">--help</code> with any command
          to see detailed options. Example:
          <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">curator import --help</code>
        </p>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Server Command</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Start the AI Curator web server. By default, the browser opens automatically for a seamless
        experience. Use
        <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">--no-browser</code>
        for headless operation in Docker, CI/CD, or when you prefer manual browser control.
      </p>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
        <div class="text-green-400 mb-2">curator [options]</div>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Server Options</h4>
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Option</th>
              <th class="px-4 py-2">Description</th>
              <th class="px-4 py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--no-browser</td>
              <td class="px-4 py-2">Start server without opening browser</td>
              <td class="px-4 py-2">false</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--browser</td>
              <td class="px-4 py-2">Start server and open browser</td>
              <td class="px-4 py-2">true</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Examples</h4>
      <div class="space-y-2">
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Default: Start server and open browser</div>
          <div>curator</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Headless mode (Docker, CI/CD, automation)</div>
          <div>curator --no-browser</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Custom port with headless mode</div>
          <div>AI_CURATOR_PORT=8080 curator --no-browser</div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Search Command</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Search for datasets across Kaggle and Hugging Face repositories.
      </p>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
        <div class="text-green-400 mb-2">curator search "&lt;query&gt;" [options]</div>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Options</h4>
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Option</th>
              <th class="px-4 py-2">Description</th>
              <th class="px-4 py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--source</td>
              <td class="px-4 py-2">Source: kaggle, hf, or all</td>
              <td class="px-4 py-2">all</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--limit</td>
              <td class="px-4 py-2">Results per source</td>
              <td class="px-4 py-2">10</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Examples</h4>
      <div class="space-y-2">
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Search all sources</div>
          <div>curator search "python programming"</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Search only Kaggle</div>
          <div>curator search "medical qa" --source kaggle</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Search Hugging Face with more results</div>
          <div>curator search "instruction tuning" --source hf --limit 20</div>
        </div>
      </div>

      <div
        class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
      >
        <h4 class="font-semibold mb-2 text-yellow-900 dark:text-yellow-300">
          Authentication Required
        </h4>
        <p class="text-sm text-yellow-800 dark:text-yellow-400">
          <strong>Kaggle:</strong> Requires API credentials in
          <code class="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">~/.kaggle/kaggle.json</code>
          (get from
          <a href="https://www.kaggle.com/settings" target="_blank" class="underline"
            >kaggle.com/settings</a
          >)
        </p>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Download Command</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Download datasets from Kaggle or Hugging Face and automatically import them into AI Curator.
      </p>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
        <div class="text-green-400 mb-2">curator download &lt;dataset-id&gt; [options]</div>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Dataset ID Format</h4>
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Source</th>
              <th class="px-4 py-2">Format</th>
              <th class="px-4 py-2">Example</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2">Kaggle</td>
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">kaggle:owner/name</td>
              <td class="px-4 py-2 font-mono text-xs">kaggle:awsaf49/coco-2017-dataset</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2">Hugging Face</td>
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">hf:owner/name</td>
              <td class="px-4 py-2 font-mono text-xs">hf:openai/summarize_from_feedback</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Options</h4>
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Option</th>
              <th class="px-4 py-2">Description</th>
              <th class="px-4 py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--dataset</td>
              <td class="px-4 py-2">Target AI Curator dataset ID</td>
              <td class="px-4 py-2">Active dataset</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--category</td>
              <td class="px-4 py-2">Default category for samples</td>
              <td class="px-4 py-2">general</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--status</td>
              <td class="px-4 py-2">Initial status (draft/review/approved)</td>
              <td class="px-4 py-2">draft</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--workers</td>
              <td class="px-4 py-2">Parallel import workers</td>
              <td class="px-4 py-2">4</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--no-import</td>
              <td class="px-4 py-2">Download only, skip import</td>
              <td class="px-4 py-2">Import enabled</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Examples</h4>
      <div class="space-y-2">
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Download from Kaggle and auto-import</div>
          <div>curator download kaggle:awsaf49/coco-2017-dataset</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Download from Hugging Face with workers</div>
          <div>curator download hf:tiiuae/falcon-refinedweb --workers 8</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Download to specific dataset with category</div>
          <div>
            curator download hf:openai/summarize_from_feedback --dataset 3 --category research
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Import Command</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Import training samples from local files with automatic field detection. Supports JSON,
        JSONL, and CSV formats.
      </p>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
        <div class="text-green-400 mb-2">curator import &lt;file&gt; [options]</div>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Supported Formats</h4>
      <div class="grid md:grid-cols-3 gap-4 mb-4">
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="font-semibold text-gray-900 dark:text-white">.json</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">JSON array or JSON Lines</div>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="font-semibold text-gray-900 dark:text-white">.jsonl</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            JSON Lines (one object per line)
          </div>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="font-semibold text-gray-900 dark:text-white">.csv</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Comma-separated values</div>
        </div>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Options</h4>
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Option</th>
              <th class="px-4 py-2">Description</th>
              <th class="px-4 py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--dataset</td>
              <td class="px-4 py-2">Target dataset ID</td>
              <td class="px-4 py-2">Active dataset</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--create-dataset</td>
              <td class="px-4 py-2">Create new dataset with name</td>
              <td class="px-4 py-2">-</td>
            </tr>
            <tr
              class="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20"
            >
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--smart</td>
              <td class="px-4 py-2"><strong>Auto-detect field mappings</strong></td>
              <td class="px-4 py-2">Disabled</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--clear</td>
              <td class="px-4 py-2">Clear existing samples before import</td>
              <td class="px-4 py-2">Disabled</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--force</td>
              <td class="px-4 py-2">Skip confirmation prompts</td>
              <td class="px-4 py-2">Disabled</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--category</td>
              <td class="px-4 py-2">Default category</td>
              <td class="px-4 py-2">general</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--status</td>
              <td class="px-4 py-2">Initial status (draft/review/approved/needs_review)</td>
              <td class="px-4 py-2">draft</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--dry-run</td>
              <td class="px-4 py-2">Preview without importing</td>
              <td class="px-4 py-2">Disabled</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--workers</td>
              <td class="px-4 py-2">Parallel workers (for large files)</td>
              <td class="px-4 py-2">4</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--resume</td>
              <td class="px-4 py-2">Resume interrupted import</td>
              <td class="px-4 py-2">Disabled</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--dedup</td>
              <td class="px-4 py-2">Remove duplicates during import</td>
              <td class="px-4 py-2">Disabled</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4"
      >
        <h4 class="font-semibold mb-2 text-blue-900 dark:text-blue-300">✨ Smart Import (New!)</h4>
        <p class="text-sm text-blue-800 dark:text-blue-400 mb-2">
          Use <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">--smart</code> for automatic
          field detection and mapping:
        </p>
        <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1 ml-4">
          <li>
            • Maps <code>rating</code> → quality, <code>prompt</code> → instruction automatically
          </li>
          <li>
            • Handles status values: <code>needs_review</code>, <code>approved</code>,
            <code>draft</code>
          </li>
          <li>• Preserves original values in metadata for audit trail</li>
          <li>• Shows preview of transformations before importing</li>
        </ul>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Examples</h4>
      <div class="space-y-2">
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Smart import with auto field detection</div>
          <div>curator import data.json --smart --create-dataset "My Dataset"</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Import to new dataset</div>
          <div>curator import data.jsonl --create-dataset "Training Data" --category coding</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Clear and re-import</div>
          <div>curator import data.json --dataset 3 --clear --force</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Import large file with workers</div>
          <div>curator import 2gb-dataset.jsonl --workers 8 --chunk-size 5000</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Resume interrupted import</div>
          <div>curator import large-dataset.json --resume</div>
        </div>
      </div>

      <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Large File Handling</h4>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          For files &gt;10MB, the CLI automatically uses streaming with parallel workers to avoid
          memory issues. Progress is tracked in real-time with ETA. Invalid records are logged to
          <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">curator-import-errors.log</code>.
        </p>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Export Command</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Export curated training data to various formats for fine-tuning.
      </p>

      <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
        <div class="text-green-400 mb-2">curator export [options]</div>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Formats</h4>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="font-semibold text-gray-900 dark:text-white">alpaca</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Standard Alpaca JSON format (default)
          </div>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="font-semibold text-gray-900 dark:text-white">jsonl</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">JSON Lines streaming format</div>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="font-semibold text-gray-900 dark:text-white">json</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Full metadata export</div>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="font-semibold text-gray-900 dark:text-white">mlx</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Apple MLX-LM chat format</div>
        </div>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Options</h4>
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Option</th>
              <th class="px-4 py-2">Description</th>
              <th class="px-4 py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--dataset</td>
              <td class="px-4 py-2">Source dataset ID</td>
              <td class="px-4 py-2">Active dataset</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--format</td>
              <td class="px-4 py-2">Export format: alpaca, jsonl, json, mlx</td>
              <td class="px-4 py-2">alpaca</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--output</td>
              <td class="px-4 py-2">Output file path (required)</td>
              <td class="px-4 py-2">-</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--filter</td>
              <td class="px-4 py-2">Filter samples (e.g., "status=approved")</td>
              <td class="px-4 py-2">Export all</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">--split</td>
              <td class="px-4 py-2">Train/val split (e.g., "80-20")</td>
              <td class="px-4 py-2">No split</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Examples</h4>
      <div class="space-y-2">
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Export approved samples (Alpaca format)</div>
          <div>
            curator export --format alpaca --output training.json --filter "status=approved"
          </div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Export for Apple MLX-LM (Apple Silicon)</div>
          <div>curator export --format mlx --output train.jsonl --filter "status=approved"</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Export as JSON Lines for streaming</div>
          <div>curator export --format jsonl --output train.jsonl</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Export full metadata</div>
          <div>curator export --format json --output dataset.json</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Export with train/val split</div>
          <div>curator export --format jsonl --output dataset.jsonl --split "80-20"</div>
        </div>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-gray-400"># Export high quality samples</div>
          <div>curator export --output high-quality.json --filter "quality_rating>=4"</div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Environment Variables
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead
            class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800"
          >
            <tr>
              <th class="px-4 py-2">Variable</th>
              <th class="px-4 py-2">Default</th>
              <th class="px-4 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">AI_CURATOR_PORT</td>
              <td class="px-4 py-2">3333</td>
              <td class="px-4 py-2">Server port</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">AI_CURATOR_HOST</td>
              <td class="px-4 py-2">localhost</td>
              <td class="px-4 py-2">Bind address (use 0.0.0.0 for network access)</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">
                AI_CURATOR_OPEN_BROWSER
              </td>
              <td class="px-4 py-2">true</td>
              <td class="px-4 py-2">Auto-open browser on server start</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">AI_CURATOR_DATA_DIR</td>
              <td class="px-4 py-2">~/.curator</td>
              <td class="px-4 py-2">Data directory for SQLite database</td>
            </tr>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-gray-900 dark:text-white">HUGGINGFACE_TOKEN</td>
              <td class="px-4 py-2">-</td>
              <td class="px-4 py-2">Hugging Face API token (optional, for higher rate limits)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Environment File</h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Create a <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env</code> file in your
          working directory:
        </p>
        <div class="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          <div class="text-green-400"># .env</div>
          <div>AI_CURATOR_PORT=3333</div>
          <div>AI_CURATOR_HOST=localhost</div>
          <div>AI_CURATOR_OPEN_BROWSER=false</div>
          <div>HUGGINGFACE_TOKEN=your_token_here</div>
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
