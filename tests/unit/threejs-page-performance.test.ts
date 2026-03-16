import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const browserPageSource = readFileSync(new URL("../../src/app/browser/page.tsx", import.meta.url), "utf8");
const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");
const sceneSource = readFileSync(new URL("../../src/components/Scene.tsx", import.meta.url), "utf8");
const systemPageSource = readFileSync(new URL("../../src/app/system/page.tsx", import.meta.url), "utf8");

test("browser and item-grid pages preload repeated GLTF assets instead of waiting for first mount", () => {
  assert.match(browserPageSource, /const PRELOADED_MODEL_PATHS = new Set<string>\(\);/);
  assert.match(browserPageSource, /useGLTF\.preload\(modelPath\);/);
  assert.match(itemGridSource, /const PRELOADED_MODEL_PATHS = new Set<string>\(\["\/3d\/memorycard\.glb"\]\);/);
  assert.match(itemGridSource, /useGLTF\.preload\("\/3d\/memorycard\.glb"\);/);
  assert.match(itemGridSource, /useGLTF\.preload\(item\.modelPath\);/);
});

test("shared item grid caches normalized GLTF scales and the startup scene avoids a duplicate scene background object", () => {
  assert.match(itemGridSource, /const NORMALIZED_SCALE_CACHE = new Map<string, number>\(\);/);
  assert.match(itemGridSource, /const cacheKey = `\$\{modelPath\}:\$\{target\}`;/);
  assert.match(itemGridSource, /NORMALIZED_SCALE_CACHE\.set\(cacheKey, nextScale\);/);
  assert.doesNotMatch(sceneSource, /scene=\{sceneProps\}/);
});

test("system page keeps the reference desktop quality profile for the always-animating flower scene", () => {
  assert.match(systemPageSource, /dpr=\{\[1, 1\.5\]\}/);
  assert.match(systemPageSource, /gl=\{\{ antialias: true, powerPreference: "high-performance" \}\}/);
});
