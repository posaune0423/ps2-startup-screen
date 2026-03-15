import { cloudflare } from "@cloudflare/vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite-plus";

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

    plugins: ["typescript", "react", "unicorn", "import"],

    env: { browser: true },

    categories: {
      correctness: "error",
      suspicious: "warn",
    },

    options: {
      typeAware: true,
      typeCheck: true,
    },

    rules: {
      // ── ESLint core ──────────────────────────────────────
      "eslint/no-unused-vars": "off",
      "eslint/no-redeclare": "error",

      // ── TypeScript ───────────────────────────────────────
      "typescript/no-explicit-any": "error",
      "typescript/consistent-type-definitions": "error",
      "typescript/consistent-type-imports": "error",
      "typescript/no-import-type-side-effects": "error",
      "typescript/no-require-imports": "error",
      "typescript/no-empty-object-type": "error",
      "typescript/no-wrapper-object-types": "error",
      "typescript/ban-ts-comment": "error",
      "typescript/no-deprecated": "warn",

      // type-aware
      "typescript/await-thenable": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-for-in-array": "error",
      "typescript/no-implied-eval": "error",
      "typescript/no-misused-promises": "error",
      "typescript/no-unnecessary-type-assertion": "error",
      "typescript/no-unsafe-argument": "error",
      "typescript/no-unsafe-assignment": "error",
      "typescript/no-unsafe-call": "error",
      "typescript/no-unsafe-member-access": "error",
      "typescript/no-unsafe-return": "error",
      "typescript/promise-function-async": "error",
      "typescript/restrict-plus-operands": "error",
      "typescript/restrict-template-expressions": "error",
      "typescript/switch-exhaustiveness-check": "error",
      "typescript/unbound-method": "error",

      // ── Import ───────────────────────────────────────────
      "import/consistent-type-specifier-style": "error",
      "import/first": "error",
      "import/no-duplicates": "error",
      "import/no-mutable-exports": "error",
      "import/no-named-default": "error",

      // ── Unicorn ──────────────────────────────────────────
      "unicorn/consistent-empty-array-spread": "error",
      "unicorn/error-message": "error",
      "unicorn/escape-case": "error",
      "unicorn/new-for-builtins": "error",
      "unicorn/no-instanceof-builtins": "error",
      "unicorn/no-new-array": "error",
      "unicorn/no-new-buffer": "error",
      "unicorn/number-literal-case": "error",
      "unicorn/prefer-dom-node-text-content": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-number-properties": "error",
      "unicorn/prefer-string-starts-ends-with": "error",
      "unicorn/prefer-type-error": "error",
      "unicorn/throw-new-error": "error",

      // ── React ────────────────────────────────────────────
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": "warn",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "warn",
      "react/no-array-index-key": "warn",
      "react/no-clone-element": "warn",
      "react/no-danger": "warn",
      "react/no-danger-with-children": "error",
      "react/no-direct-mutation-state": "error",
      "react/no-string-refs": "error",
    },

    overrides: [
      {
        files: ["src/app/layout.tsx"],
        rules: {
          "import/no-unassigned-import": "off",
        },
      },
      {
        files: ["*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx"],
        rules: {
          "typescript/no-explicit-any": "off",
          "typescript/no-unsafe-assignment": "off",
          "typescript/no-unsafe-call": "off",
          "typescript/no-unsafe-member-access": "off",
        },
      },
    ],
  },

  fmt: {
    printWidth: 120,
    singleQuote: false,
    sortImports: { enabled: true },
    sortTailwindcss: { enabled: true },
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
