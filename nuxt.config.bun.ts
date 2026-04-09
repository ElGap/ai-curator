import { config as loadEnv } from "dotenv";
import { defineNuxtConfig } from "nuxt/config";

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
    esbuild: {
      options: {
        target: "es2022",
      },
    },
    // For Bun builds: Don't externalize or alias bun:sqlite
    // Let server/db/index.ts detect Bun and use bun:sqlite natively
    externals: {
      external: [], // Bundle everything, including bun:sqlite
    },
    // NO aliases - let the runtime detection in server/db/index.ts work
    alias: {},
  },
  devServer: {
    port: parseInt(process.env.AI_CURATOR_PORT || "3333"),
  },
  router: {
    options: {
      linkActiveClass: "active",
      linkExactActiveClass: "exact-active",
    },
  },
});
