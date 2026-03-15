import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

import { getClientViewport, getServerViewport, MOBILE_BREAKPOINT } from "../../src/components/shared/use-viewport";

const viewportSource = readFileSync(new URL("../../src/components/shared/use-viewport.ts", import.meta.url), "utf8");

const originalWindow = globalThis.window;

test("server viewport snapshot stays desktop-sized for hydration", () => {
  assert.deepEqual(getServerViewport(), {
    width: 1920,
    height: 1080,
    isMobile: false,
    isPortrait: false,
  });
});

test("client viewport snapshot still reflects the live window size", () => {
  Object.defineProperty(globalThis, "window", {
    value: { innerWidth: MOBILE_BREAKPOINT - 1, innerHeight: 900 },
    configurable: true,
    writable: true,
  });

  assert.deepEqual(getClientViewport(), {
    width: MOBILE_BREAKPOINT - 1,
    height: 900,
    isMobile: true,
    isPortrait: true,
  });

  Object.defineProperty(globalThis, "window", {
    value: originalWindow,
    configurable: true,
    writable: true,
  });
});

test("useViewport uses a server snapshot instead of initializing from window during render", () => {
  assert.match(viewportSource, /useSyncExternalStore/);
  assert.doesNotMatch(viewportSource, /useState\(getViewport\)/);
});
