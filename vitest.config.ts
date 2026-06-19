import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.codex-home/**",
      "**/.pair-shared/**",
      "**/.agents/**",
      "**/.codex/**",
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname),
    },
  },
});
