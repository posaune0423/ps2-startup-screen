import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");

test("memory pages use stronger light contrast instead of flat ambient fill", () => {
  assert.match(itemGridSource, /<ambientLight intensity=\{0\.52\} \/>/);
  assert.match(itemGridSource, /const HEMI_ARGS: \[string, string, number\] = \["#F8FBFF", "#0A0C14", 1\.05\];/);
  assert.match(itemGridSource, /<hemisphereLight args=\{HEMI_ARGS\} \/>/);
  assert.match(itemGridSource, /<directionalLight position=\{DIR_LIGHT_POS\} intensity=\{2\.6\} color="#D5E4FF" \/>/);
  assert.match(
    itemGridSource,
    /<spotLight position=\{SPOT_LIGHT_POS\} angle=\{0\.58\} penumbra=\{0\.9\} intensity=\{1\.9\} color="#FFFFFF" \/>/,
  );
  assert.match(
    itemGridSource,
    /<pointLight position=\{POINT_LIGHT_POS\} intensity=\{1\.4\} color="#87B1FF" distance=\{22\} decay=\{1\.6\} \/>/,
  );
});

test("memory page item boxes keep clearer highlight and shadow separation", () => {
  assert.match(itemGridSource, /fallbackMaterial\.color\.set\(isActive \? "#8BE8FF" : "#46506A"\)/);
  assert.match(itemGridSource, /fallbackMaterial\.emissive\.set\(isActive \? "#63D8FF" : "#0E1220"\)/);
  assert.match(itemGridSource, /fallbackMaterial\.emissiveIntensity = isActive \? 0\.32 : 0\.04/);
  assert.match(itemGridSource, /roughness: 0\.28/);
  assert.match(itemGridSource, /metalness: 0\.3/);
});
