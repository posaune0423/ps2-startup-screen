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
  assert.match(
    hookSource,
    /let script = document\.querySelector<HTMLScriptElement>\('script\[data-youtube-iframe-api="true"\]'\);/,
  );
  assert.match(hookSource, /youtubeApiPromise = null;/);
  assert.match(hookSource, /window\.onYouTubeIframeAPIReady = previousReady;/);
  assert.match(hookSource, /script\?\.removeEventListener\("error", handleScriptError\);/);
  assert.match(hookSource, /if \(!script \|\| window\.YT\?\.Player\) return;/);
  assert.match(hookSource, /script\.remove\(\);/);
  assert.match(hookSource, /script = null;/);
  assert.match(hookSource, /script\.addEventListener\("error", handleScriptError, \{ once: true \}\);/);
});

test("youtube music player only publishes whole-second progress changes to avoid sub-second page rerenders", () => {
  assert.match(hookSource, /const currentSecondsRef = useRef\(0\);/);
  assert.match(hookSource, /const durationSecondsRef = useRef\(0\);/);
  assert.match(hookSource, /Math\.floor\(Math\.max\(0, absoluteCurrentTime - parsedTrack\.startSeconds\)\)/);
  assert.match(hookSource, /if \(nextCurrentSeconds !== currentSecondsRef\.current\)/);
  assert.match(hookSource, /if \(nextDurationSeconds !== durationSecondsRef\.current\)/);
});
