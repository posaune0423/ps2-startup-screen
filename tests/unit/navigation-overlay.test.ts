import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const appShellSource = readFileSync(new URL("../../src/components/shared/app-shell.tsx", import.meta.url), "utf8");
const memoryShellSource = readFileSync(
  new URL("../../src/components/shared/memory-shell.tsx", import.meta.url),
  "utf8",
);

test("app shell owns the transition overlay and keeps it at the runtime boundary", () => {
  assert.match(appShellSource, /const OVERLAY_STYLE: React\.CSSProperties = \{/);
  assert.match(appShellSource, /background: "#000000"/);
  assert.match(appShellSource, /pointerEvents: inputLocked \? "all" : "none"/);
  assert.match(appShellSource, /router\.push\(href\);/);
});

test("memory shell keeps browser/work/sns/music mounted and only swaps active visibility", () => {
  assert.match(memoryShellSource, /<BrowserScreen active=\{browserActive\} \/>/);
  assert.match(memoryShellSource, /<WorkScreen active=\{workActive\} \/>/);
  assert.match(memoryShellSource, /<SnsScreen active=\{snsActive\} \/>/);
  assert.match(memoryShellSource, /<MusicScreen active=\{musicActive\} transparentBackground \/>/);
  assert.match(memoryShellSource, /opacity: active \? 1 : 0/);
  assert.match(memoryShellSource, /visibility: active \? "visible" : "hidden"/);
});

test("memory shell preserves the shared browser background even when the music HUD goes transparent", () => {
  assert.match(memoryShellSource, /background: PS2_BROWSER_BG_FALLBACK/);
  assert.match(memoryShellSource, /transparentBackground/);
});
