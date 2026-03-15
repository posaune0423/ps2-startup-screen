import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");

test("memory page headers keep their text centered inside anchored header boxes", () => {
  assert.match(itemGridSource, /justifyContent:\s*"center"/);
  assert.match(itemGridSource, /textAlign:\s*"center"/);
  assert.match(itemGridSource, /transformOrigin:\s*"left center"/);
  assert.match(itemGridSource, /transformOrigin:\s*"right center"/);
});

test("top-right memory page label stays inside the viewport instead of spilling off-screen", () => {
  assert.match(itemGridSource, /width:\s*"min\(42vw,\s*420px\)"/);
  assert.match(itemGridSource, /overflow:\s*"hidden"/);
  assert.match(itemGridSource, /width:\s*"calc\(100% \/ 1\.18\)"/);
  assert.match(itemGridSource, /right:\s*"clamp\(28px,\s*6vw,\s*88px\)"/);
  assert.match(
    itemGridSource,
    /fontSize:\s*compact \? "clamp\(16px,\s*4\.2vw,\s*28px\)" : "clamp\(20px,\s*2\.4vw,\s*34px\)"/,
  );
  assert.match(itemGridSource, /whiteSpace:\s*"normal"/);
  assert.match(itemGridSource, /overflowWrap:\s*"anywhere"/);
});
