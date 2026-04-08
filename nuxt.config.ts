import { config as loadEnv } from "dotenv";

// Load environment variables from .env file
loadEnv();

export default defineNuxtConfig({
  compatibilityDate: "2026-03-06",
  devtools: { enabled: false },
  modules: ["@nuxt/ui", "@pinia/nuxt"],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || "./data/curator.db",
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || "AI Curator",
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || "1.0.0",
    },
  },
  nitro: {
    experimental: {
      wasm: true,
    },
    // Enable top-level await support
    esbuild: {
      options: {
        target: "es2022",
      },
    },
    externals: {
      external: ["bun:sqlite"],
      inline: ["drizzle-orm/better-sqlite3"],
    },
    alias: {
      "bun:sqlite": "better-sqlite3",
      "drizzle-orm/bun-sqlite": "drizzle-orm/better-sqlite3",
    },
    hooks: {
      compiled: async (nitro) => {
        // Copy drizzle-orm modules to output
        const fs = await import("node:fs");
        const path = await import("node:path");

        const modulesToCopy = ["drizzle-orm/better-sqlite3", "drizzle-orm/cache"];

        for (const moduleName of modulesToCopy) {
          const srcDir = path.resolve(`./node_modules/${moduleName}`);
          const destDir = path.resolve(
            nitro.options.output.serverDir,
            `node_modules/${moduleName}`
          );
          if (fs.existsSync(srcDir)) {
            fs.mkdirSync(destDir, { recursive: true });
            fs.cpSync(srcDir, destDir, { recursive: true });
            console.log(`✅ Copied ${moduleName} to output`);
          }
        }
      },
    },
    routeRules: {
      // Security: Limit request body sizes to prevent DoS
      "/api/import/**": {
        body: { limit: "10mb" }, // Max 10MB for imports
      },
      "/api/capture": {
        body: { limit: "1mb" }, // Max 1MB for capture requests
      },
      "/api/datasets/merge": {
        body: { limit: "100kb" }, // Max 100KB for merge (just IDs)
      },
    },
  },
  // Dev server configuration
  devServer: {
    port: parseInt(process.env.AI_CURATOR_PORT || "3333"),
  },
  // Router configuration
  router: {
    options: {
      linkActiveClass: "active",
      linkExactActiveClass: "exact-active",
    },
  },
});
