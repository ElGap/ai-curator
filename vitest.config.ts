import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    env: {
      AI_CURATOR_SKIP_AUTO_IMPORT: "1",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["node_modules/", ".nuxt/", ".output/", "*.config.*", "test/", "**/types.ts"],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
    include: ["test/**/*.test.ts", "test/**/*.spec.ts", "**/*.test.ts", "**/*.spec.ts"],
    exclude: ["node_modules", ".nuxt", ".output"],
  },
  resolve: {
    alias: {
      "bun:sqlite": path.resolve(__dirname, "test/mocks/bun-sqlite.ts"),
      "drizzle-orm/bun-sqlite": path.resolve(__dirname, "test/mocks/drizzle-bun-sqlite.ts"),
    },
  },
});
