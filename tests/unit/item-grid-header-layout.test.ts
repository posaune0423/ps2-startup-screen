import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");

test("left header keeps text anchored with left transform-origin", () => {
  assert.match(itemGridSource, /transformOrigin:\s*"left center"/);
});

test("right header uses right-aligned transform-origin and auto-sized container", () => {
  assert.match(itemGridSource, /maxWidth:\s*"45vw"/);
  assert.match(itemGridSource, /right:\s*"clamp\(16px,\s*4vw,\s*48px\)"/);
  assert.match(itemGridSource, /textAlign:\s*"right"/);
  assert.match(itemGridSource, /transformOrigin:\s*"right center"/);
  assert.match(itemGridSource, /whiteSpace:\s*"nowrap"/);
});
