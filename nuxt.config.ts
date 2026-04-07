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
    // Externalize native dependencies - let npm handle platform-specific binaries
    externals: {
      external: [
        "better-sqlite3",
        "bindings",
        "file-uri-to-path",
        "prebuild-install",
        "napi-build-utils",
        "node-gyp",
        "tar",
        "rc",
        "pump",
        "simple-get",
        "which-pm-runs",
        "expand-template",
        "github-from-package",
      ],
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
