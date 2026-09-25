import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["utils/**/*.ts", "store/**/*.ts", "hooks/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
