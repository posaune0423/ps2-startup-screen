import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const musicPageSource = readFileSync(new URL("../../src/app/memory/music/page.tsx", import.meta.url), "utf8");

test("music page keeps cube rendering lightweight on desktop", () => {
  assert.match(musicPageSource, /const TrackCube = React\.memo\(function TrackCube/);
  assert.match(musicPageSource, /backfaceVisibility: "hidden"/);
  assert.doesNotMatch(musicPageSource, /backdropFilter:/);
});
