import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const systemMenuSource = readFileSync(new URL("../../src/components/system/system-menu.tsx", import.meta.url), "utf8");

test("system configuration title matches the menu label scale more closely", () => {
  assert.match(systemMenuSource, /fontSize:\s*"clamp\(24px,\s*3vw,\s*36px\)"/);
  assert.match(systemMenuSource, /fontWeight:\s*400/);
});

test("system configuration title uses the requested yellow tone", () => {
  assert.match(systemMenuSource, /color:\s*"#DDE30F"/);
});

test("system configuration title keeps mixed case instead of forced uppercase", () => {
  assert.doesNotMatch(systemMenuSource, /textTransform:\s*"uppercase"/);
});
