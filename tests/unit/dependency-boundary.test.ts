import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

function getPackageDependencies(): Record<string, string> | undefined {
  const parsed = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as unknown;
  if (typeof parsed !== "object" || parsed === null || !("dependencies" in parsed)) {
    return undefined;
  }

  const { dependencies } = parsed;
  if (typeof dependencies !== "object" || dependencies === null) {
    return undefined;
  }

  const entries = Object.entries(dependencies);
  if (entries.some(([key, value]) => typeof key !== "string" || typeof value !== "string")) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

const packageDependencies = getPackageDependencies();
const viteConfigSource = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");

test("vinext app does not install the Next-only next-view-transitions package", () => {
  assert.equal(packageDependencies?.["next-view-transitions"], undefined);
});

test("vite prebundles the vinext next/navigation shim before the first client render", () => {
  assert.match(viteConfigSource, /optimizeDeps:\s*\{[\s\S]*include:\s*\[[\s\S]*"next\/navigation"[\s\S]*\]/);
});
