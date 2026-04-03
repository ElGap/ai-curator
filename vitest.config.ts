import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
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
});
