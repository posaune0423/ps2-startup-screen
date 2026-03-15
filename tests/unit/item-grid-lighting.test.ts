import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");

test("memory pages use stronger light contrast instead of flat ambient fill", () => {
  assert.match(itemGridSource, /<ambientLight intensity=\{0\.18\} \/>/);
  assert.match(itemGridSource, /<directionalLight position=\{\[-4, 5, 4\]\} intensity=\{1\.55\} color="#89A8FF" \/>/);
  assert.match(
    itemGridSource,
    /<spotLight position=\{\[0, 5, 5\]\} angle=\{0\.52\} penumbra=\{0\.85\} intensity=\{1\.15\} color="#DCE6FF" \/>/,
  );
  assert.match(
    itemGridSource,
    /<pointLight position=\{\[4, -1, 3\]\} intensity=\{0\.65\} color="#243A7A" distance=\{18\} decay=\{2\} \/>/,
  );
});

test("memory page item boxes keep clearer highlight and shadow separation", () => {
  assert.match(itemGridSource, /color=\{isActive \? "#8BE8FF" : "#46506A"\}/);
  assert.match(itemGridSource, /emissive=\{isActive \? "#63D8FF" : "#0E1220"\}/);
  assert.match(itemGridSource, /emissiveIntensity=\{isActive \? 0\.32 : 0\.04\}/);
  assert.match(itemGridSource, /roughness=\{0\.28\}/);
  assert.match(itemGridSource, /metalness=\{0\.3\}/);
});
