// server/cli/workers/worker-pool.js
// Worker pool for parallel import processing

import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WorkerPool {
  constructor(workerCount = 4) {
    this.workerCount = workerCount;
    this.workers = [];
    this.queue = [];
    this.results = [];
    this.activeWorkers = 0;
  }

  async initialize() {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(join(__dirname, "import-worker.js"));

      worker.on("message", (message) => {
        if (message.type === "complete") {
          this.results.push(message);
          this.activeWorkers--;
          this.processQueue();
        }
      });

      worker.on("error", (error) => {
        console.error(`Worker ${i} error:`, error);
        this.activeWorkers--;
        this.processQueue();
      });

      this.workers.push(worker);
    }
  }

  async processChunk(chunk, options, chunkId) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        chunk,
        options,
        chunkId,
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  processQueue() {
    while (this.queue.length > 0 && this.activeWorkers < this.workerCount) {
      const { chunk, options, chunkId, resolve } = this.queue.shift();
      const worker = this.getAvailableWorker();

      if (worker) {
        this.activeWorkers++;

        // Set up one-time listener for this specific chunk
        const messageHandler = (message) => {
          if (message.type === "complete" && message.chunkId === chunkId) {
            worker.removeListener("message", messageHandler);
            resolve(message);
          }
        };

        worker.on("message", messageHandler);

        worker.postMessage({
          type: "process",
          records: chunk,
          options,
          chunkId,
        });
      } else {
        // Put back in queue if no worker available
        this.queue.unshift({ chunk, options, chunkId, resolve });
        break;
      }
    }
  }

  getAvailableWorker() {
    // Simple round-robin selection
    return this.workers[this.activeWorkers % this.workerCount];
  }

  async terminate() {
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
  }
}
