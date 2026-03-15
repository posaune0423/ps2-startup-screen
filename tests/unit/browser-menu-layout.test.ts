import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const browserMenuSource = readFileSync(new URL("../../src/components/BrowserMenu.tsx", import.meta.url), "utf8");
const menuListSource = readFileSync(
  new URL("../../src/components/browser-menu/menu-list.tsx", import.meta.url),
  "utf8",
);

test("home menu sits at the center-right of the screen", () => {
  assert.match(browserMenuSource, /right:\s*"25%"/);
  assert.match(browserMenuSource, /top:\s*"50%"/);
  assert.match(browserMenuSource, /transform:\s*"translateY\(-50%\)"/);
});

test("home menu labels stay large and slightly bolder", () => {
  assert.match(menuListSource, /fontSize:\s*"clamp\(28px,\s*3\.5vw,\s*42px\)"/);
  assert.match(menuListSource, /fontWeight:\s*400/);
});

test("home menu labels are center-aligned", () => {
  assert.match(menuListSource, /alignItems:\s*"center"/);
  assert.match(menuListSource, /textAlign:\s*"center"/);
  assert.match(menuListSource, /justifyContent:\s*"center"/);
});

test("home menu does not play select sound for the initial auto-selected item", () => {
  assert.match(menuListSource, /const hasMountedRef = useRef\(false\)/);
  assert.match(menuListSource, /if \(!hasMountedRef\.current\) \{\s*hasMountedRef\.current = true;\s*return;\s*\}/s);
});

test("home menu does not render a bullet marker or text glow beside the active item", () => {
  assert.doesNotMatch(menuListSource, /borderRadius:\s*"50%"/);
  assert.doesNotMatch(menuListSource, /boxShadow:\s*`0 0 8px \$\{SELECTED_COLOR\}`/);
  assert.doesNotMatch(menuListSource, /textShadow:/);
});
