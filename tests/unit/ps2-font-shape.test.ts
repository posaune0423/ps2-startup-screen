import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const globalsCssSource = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");
const menuListSource = readFileSync(
  new URL("../../src/components/browser-menu/menu-list.tsx", import.meta.url),
  "utf8",
);
const systemMenuSource = readFileSync(new URL("../../src/components/system/system-menu.tsx", import.meta.url), "utf8");
const browserPageSource = readFileSync(
  new URL("../../src/components/screens/browser-screen.tsx", import.meta.url),
  "utf8",
);
const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");

test("shared PS2 text class keeps a Helvetica-based stack with horizontal shaping", () => {
  assert.match(
    globalsCssSource,
    /body\s*\{[\s\S]*font-family:\s*"Helvetica Neue",\s*Helvetica,\s*Arial,\s*sans-serif;/,
  );
  assert.match(globalsCssSource, /\.ps2-text\s*\{/);
  assert.match(
    globalsCssSource,
    /\.ps2-text\s*\{[\s\S]*font-family:\s*"Helvetica Neue",\s*Helvetica,\s*Arial,\s*sans-serif;/,
  );
  assert.match(globalsCssSource, /display:\s*inline-block;/);
  assert.match(globalsCssSource, /transform:\s*scaleX\(1\.18\);/);
  assert.match(globalsCssSource, /transform-origin:\s*center center;/);
  assert.match(globalsCssSource, /letter-spacing:\s*-0\.02em;/);
});

test("major UI labels opt into the shared PS2 text class", () => {
  assert.match(menuListSource, /className="ps2-text"/);
  assert.match(systemMenuSource, /className="ps2-text"/);
  assert.match(browserPageSource, /className="ps2-text"/);
  assert.match(itemGridSource, /className="ps2-text"/);
});
