import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const browserScreenSource = readFileSync(
  new URL("../../src/components/screens/browser-screen.tsx", import.meta.url),
  "utf8",
);
const appShellSource = readFileSync(new URL("../../src/components/shared/app-shell.tsx", import.meta.url), "utf8");
const appScreenSource = readFileSync(new URL("../../src/lib/app-screen.ts", import.meta.url), "utf8");
const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");
const sceneSource = readFileSync(new URL("../../src/components/Scene.tsx", import.meta.url), "utf8");
const systemScreenSource = readFileSync(
  new URL("../../src/components/screens/system-screen.tsx", import.meta.url),
  "utf8",
);

test("app shell warms shared GLTF assets during startup instead of scattering preloads across routes", () => {
  assert.match(
    appScreenSource,
    /export const WARMUP_ASSET_PATHS = Array\.from\(new Set\(Object\.values\(SCREEN_ASSETS\)\.flat\(\)\)\);/,
  );
  assert.match(appShellSource, /useGLTF\.preload\(path\);/);
  assert.match(appShellSource, /fetch\(path, \{ cache: "force-cache" \}\)/);
  assert.doesNotMatch(browserScreenSource, /useGLTF\.preload/);
  assert.doesNotMatch(itemGridSource, /useGLTF\.preload\(item\.modelPath\)/);
});

test("shared item grid caches normalized GLTF scales and the startup scene avoids a duplicate scene background object", () => {
  assert.match(itemGridSource, /const NORMALIZED_SCALE_CACHE = new Map<string, number>\(\);/);
  assert.match(itemGridSource, /const cacheKey = `\$\{modelPath\}:\$\{target\}`;/);
  assert.match(itemGridSource, /NORMALIZED_SCALE_CACHE\.set\(cacheKey, nextScale\);/);
  assert.doesNotMatch(sceneSource, /scene=\{sceneProps\}/);
});

test("system page keeps the reference desktop quality profile for the always-animating flower scene", () => {
  assert.match(systemScreenSource, /dpr=\{\[1, 1\.5\]\}/);
  assert.match(
    systemScreenSource,
    /gl=\{\{ alpha: transparentBackground, antialias: true, powerPreference: "high-performance" \}\}/,
  );
});
