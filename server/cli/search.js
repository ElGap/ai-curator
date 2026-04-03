// server/cli/search.js
// Search command for Kaggle and Hugging Face datasets

import {
  KaggleClient,
  HuggingFaceClient,
  formatKaggleDataset,
  formatHFDataset,
} from "./external/index.js";

export class SearchCommand {
  constructor(options = {}) {
    this.options = {
      query: options.query || "",
      source: options.source || "all", // all, kaggle, huggingface
      limit: options.limit || 10,
      kaggleToken: options.kaggleToken || null,
      hfToken: options.hfToken || null,
      ...options,
    };
  }

  async execute() {
    console.log(`🔍 Searching for "${this.options.query}"...\n`);

    const results = {
      kaggle: [],
      huggingface: [],
    };

    try {
      // Search Kaggle
      if (this.options.source === "all" || this.options.source === "kaggle") {
        try {
          const kaggleClient = new KaggleClient(this.options.kaggleToken);

          if (!kaggleClient.isAuthenticated()) {
            console.log("⚠️  Kaggle: No API credentials found (create ~/.kaggle/kaggle.json)");
          } else {
            const kaggleResults = await kaggleClient.searchDatasets(this.options.query, {
              page: 1,
            });

            if (kaggleResults && kaggleResults.data) {
              results.kaggle = kaggleResults.data
                .slice(0, this.options.limit)
                .map(formatKaggleDataset);
              console.log(`✅ Kaggle: Found ${results.kaggle.length} datasets`);
            }
          }
        } catch (error) {
          console.error(`❌ Kaggle search failed: ${error.message}`);
        }
      }

      // Search Hugging Face
      if (this.options.source === "all" || this.options.source === "huggingface") {
        try {
          const hfClient = new HuggingFaceClient(this.options.hfToken);

          const hfResults = await hfClient.searchDatasets(this.options.query, {
            limit: this.options.limit,
          });

          if (hfResults && Array.isArray(hfResults)) {
            results.huggingface = hfResults.slice(0, this.options.limit).map(formatHFDataset);
            console.log(`✅ Hugging Face: Found ${results.huggingface.length} datasets`);
          }
        } catch (error) {
          console.error(`❌ Hugging Face search failed: ${error.message}`);
        }
      }

      // Display results
      this.displayResults(results);

      return {
        success: true,
        kaggle: results.kaggle.length,
        huggingface: results.huggingface.length,
        results,
      };
    } catch (error) {
      console.error(`\n❌ Search failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        results,
      };
    }
  }

  displayResults(results) {
    console.log("\n" + "=".repeat(80));

    // Display Kaggle results
    if (results.kaggle.length > 0) {
      console.log("\n📦 KAGGLE DATASETS\n");
      results.kaggle.forEach((dataset, index) => {
        console.log(`${index + 1}. ${dataset.title}`);
        console.log(`   ID: ${dataset.id}`);
        console.log(`   Owner: ${dataset.owner}`);
        console.log(
          `   Size: ${dataset.size} | Downloads: ${dataset.downloads.toLocaleString()} | Votes: ${dataset.votes}`
        );
        if (dataset.tags.length > 0) {
          console.log(`   Tags: ${dataset.tags.slice(0, 5).join(", ")}`);
        }
        console.log();
      });
    }

    // Display Hugging Face results
    if (results.huggingface.length > 0) {
      console.log("\n🤗 HUGGING FACE DATASETS\n");
      results.huggingface.forEach((dataset, index) => {
        console.log(`${index + 1}. ${dataset.name}`);
        console.log(`   ID: ${dataset.id}`);
        console.log(`   Author: ${dataset.author}`);
        console.log(
          `   Likes: ${dataset.likes.toLocaleString()} | Downloads: ${dataset.downloads.toLocaleString()}`
        );
        if (dataset.tags.length > 0) {
          console.log(`   Tags: ${dataset.tags.slice(0, 5).join(", ")}`);
        }
        if (dataset.gated) {
          console.log(`   🔒 Gated (requires authentication)`);
        }
        console.log();
      });
    }

    // Summary
    const total = results.kaggle.length + results.huggingface.length;
    console.log("=".repeat(80));
    console.log(`\n📊 Total datasets found: ${total}`);

    if (total > 0) {
      console.log("\n💡 To download and import a dataset:");
      console.log("   curator download kaggle:<dataset-id>");
      console.log("   curator download hf:<dataset-id>");
    }
  }
}
