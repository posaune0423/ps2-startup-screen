import { defineConfig } from "vite-plus/test/config";

export default defineConfig({
  test: {
    include: [
      "tests/unit/**/*.test.ts",
      "tests/integration/**/*.test.ts",
      "tests/e2e/**/*.test.ts",
    ],
    environment: "node",
  },
});
