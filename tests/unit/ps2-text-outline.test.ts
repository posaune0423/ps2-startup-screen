import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const globalsCssSource = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");

test("global UI text keeps a gray PS2-style outline", () => {
  assert.match(globalsCssSource, /body\s*\{[\s\S]*text-shadow:/);
  assert.match(globalsCssSource, /rgba\(24,\s*26,\s*32,\s*1\)/);
  assert.match(globalsCssSource, /-1px -1px 0/);
  assert.match(globalsCssSource, /0 -2px 0/);
  assert.match(globalsCssSource, /2px 0 0/);
  assert.match(globalsCssSource, /1px 1px 0/);
  assert.match(globalsCssSource, /-webkit-text-stroke:\s*2px/);
  assert.match(globalsCssSource, /paint-order:\s*stroke fill/);
});

test("mobile UI text uses a lighter outline treatment", () => {
  assert.match(globalsCssSource, /@media\s*\(max-width:\s*768px\)\s*\{/);
  assert.match(globalsCssSource, /-webkit-text-stroke:\s*1px/);
  assert.match(globalsCssSource, /0 -1px 0 var\(--ps2-text-outline-color\)/);
  assert.doesNotMatch(
    globalsCssSource,
    /@media\s*\(max-width:\s*768px\)[\s\S]*0 -2px 0 var\(--ps2-text-outline-color\)/,
  );
});

test("form elements explicitly inherit the PS2 outline", () => {
  assert.match(globalsCssSource, /button[\s\S]*\{[\s\S]*-webkit-text-stroke:\s*inherit/);
  assert.match(globalsCssSource, /button[\s\S]*\{[\s\S]*paint-order:\s*inherit/);
  assert.match(globalsCssSource, /button[\s\S]*\{[\s\S]*text-shadow:\s*inherit/);
});
