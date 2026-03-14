import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite-plus";
import vinext from "vinext";

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],

  lint: {
    ignorePatterns: [
      "dist/**",
      ".vinext/**",
      ".cache/**",
      ".agents/**",
      ".claude/**",
      ".codex/**",
      ".cursor/**",
      "docs/**",
      "public/**",
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },

  fmt: {
    ignorePatterns: [
      "dist/**",
      ".vinext/**",
      ".cache/**",
      ".agents/**",
      ".claude/**",
      ".codex/**",
      ".cursor/**",
      "docs/**",
      "public/**",
    ],
  },

  staged: {
    "*.{js,ts,tsx}": "vp check --fix",
  },
});
