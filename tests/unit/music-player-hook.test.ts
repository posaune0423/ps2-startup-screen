import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const hookSource = readFileSync(new URL("../../src/hooks/use-youtube-music-player.ts", import.meta.url), "utf8");

test("youtube music player auto-advances to the next authored track when playback ends", () => {
  assert.match(hookSource, /activeTrackIndexRef/);
  assert.match(hookSource, /tracksRef/);
  assert.match(hookSource, /applyTrackSelectionRef/);
  assert.match(hookSource, /case 0:/);
  assert.match(hookSource, /applyTrackSelectionRef\.current\(activeTrackIndexRef\.current \+ 1, true\)/);
  assert.match(hookSource, /Advancing to Track/);
});

test("youtube music player suppresses auto-advance when stop is requested explicitly", () => {
  assert.match(hookSource, /suppressEndedRef/);
  assert.match(hookSource, /suppressEndedRef\.current = true;/);
  assert.match(hookSource, /Playback stopped\./);
});

test("youtube music player keeps a stable selection callback for player lifecycle handlers", () => {
  assert.match(hookSource, /const applyTrackSelectionRef = useRef\(applyTrackSelection\);/);
  assert.match(hookSource, /applyTrackSelectionRef\.current = applyTrackSelection;/);
  assert.match(hookSource, /applyTrackSelectionRef\.current\(pending\.index, pending\.autoplay\);/);
  assert.match(hookSource, /playerRef\.current\?\s*\.destroy\(\);[\s\S]*?\n  }, \[\]\);/);
});

test("youtube iframe api loader resets cached load state after failures", () => {
  assert.match(hookSource, /youtubeApiPromise = null;/);
  assert.match(hookSource, /window\.onYouTubeIframeAPIReady = previousReady;/);
});
