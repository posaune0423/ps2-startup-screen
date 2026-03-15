import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const hookSource = readFileSync(new URL("../../src/hooks/use-youtube-music-player.ts", import.meta.url), "utf8");

test("youtube music player auto-advances to the next authored track when playback ends", () => {
  assert.match(hookSource, /activeTrackIndexRef/);
  assert.match(hookSource, /tracksRef/);
  assert.match(hookSource, /case 0:/);
  assert.match(hookSource, /applyTrackSelection\(activeTrackIndexRef\.current \+ 1, true\)/);
  assert.match(hookSource, /Advancing to Track/);
});

test("youtube music player suppresses auto-advance when stop is requested explicitly", () => {
  assert.match(hookSource, /suppressEndedRef/);
  assert.match(hookSource, /suppressEndedRef\.current = true;/);
  assert.match(hookSource, /Playback stopped\./);
});
