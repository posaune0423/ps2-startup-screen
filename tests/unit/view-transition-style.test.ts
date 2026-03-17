import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const globalsCssSource = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");

test("root view transitions keep the old frame visible while the new frame fades in smoothly", () => {
  assert.match(globalsCssSource, /::view-transition-group\(root\)\s*\{[\s\S]*animation-duration:\s*320ms;/);
  assert.match(
    globalsCssSource,
    /::view-transition-group\(root\)\s*\{[\s\S]*animation-timing-function:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\);/,
  );
  assert.match(
    globalsCssSource,
    /::view-transition-old\(root\),\s*::view-transition-new\(root\)\s*\{[\s\S]*mix-blend-mode:\s*normal;/,
  );
  assert.match(globalsCssSource, /::view-transition-old\(root\)\s*\{[\s\S]*animation:\s*none;[\s\S]*opacity:\s*1;/);
  assert.match(
    globalsCssSource,
    /::view-transition-new\(root\)\s*\{[\s\S]*animation:\s*root-scene-settle 320ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\) both;[\s\S]*opacity:\s*1;[\s\S]*transform-origin:\s*center center;/,
  );
  assert.match(globalsCssSource, /@keyframes root-scene-settle/);
  assert.match(globalsCssSource, /transform:\s*translate3d\(0,\s*8px,\s*0\)\s*scale\(1\.012\);/);
  assert.match(globalsCssSource, /filter:\s*blur\(2px\);/);
  assert.doesNotMatch(globalsCssSource, /opacity:\s*0;/);
  assert.doesNotMatch(globalsCssSource, /@keyframes fade-out/);
});
