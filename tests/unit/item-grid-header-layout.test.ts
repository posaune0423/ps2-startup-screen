import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");

test("left header keeps text anchored with left transform-origin", () => {
  assert.match(itemGridSource, /left:\s*"clamp\(20px,\s*5vw,\s*52px\)"/);
  assert.match(
    itemGridSource,
    /fontSize:\s*compact \? "clamp\(14px,\s*3\.6vw,\s*24px\)" : "clamp\(20px,\s*2\.2vw,\s*32px\)"/,
  );
  assert.match(itemGridSource, /transformOrigin:\s*"left center"/);
});

test("right header uses right-aligned transform-origin and auto-sized container", () => {
  assert.match(itemGridSource, /maxWidth:\s*"40vw"/);
  assert.match(itemGridSource, /right:\s*"clamp\(36px,\s*8vw,\s*104px\)"/);
  assert.match(
    itemGridSource,
    /fontSize:\s*compact \? "clamp\(15px,\s*3\.8vw,\s*24px\)" : "clamp\(20px,\s*2\.4vw,\s*34px\)"/,
  );
  assert.match(itemGridSource, /textAlign:\s*"right"/);
  assert.match(itemGridSource, /transformOrigin:\s*"right center"/);
  assert.match(itemGridSource, /whiteSpace:\s*"nowrap"/);
});
