import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const musicPageSource = readFileSync(new URL("../../src/components/screens/music-screen.tsx", import.meta.url), "utf8");

test("music page renders the Audio CD header, track counter, and responsive grid layout", () => {
  assert.match(musicPageSource, /Audio CD/);
  assert.match(musicPageSource, /Track \{currentTrack\.number\}/);
  assert.match(musicPageSource, /const GRID_COLUMNS = \{ desktop: 5, mobile: \d+ \} as const;/);
  assert.match(musicPageSource, /MUSIC_TRACKS\.map\(\(track, index\) =>/);
});

test("music page keeps the shared back/enter chrome at the bottom and uses media icons instead of text glyphs", () => {
  assert.match(
    musicPageSource,
    /import \{ SHOW_THREE_SCENE_HELPER, ThreeSceneHelperPanel \} from "@\/components\/shared\/three-scene-helper-panel"/,
  );
  assert.match(musicPageSource, /import \{ MediaControlIcon \} from "@\/components\/shared\/media-icons"/);
  assert.match(musicPageSource, /aria-label="Previous track"/);
  assert.match(musicPageSource, /aria-label="Seek backward 10 seconds"/);
  assert.match(musicPageSource, /aria-label="Seek forward 10 seconds"/);
  assert.match(musicPageSource, /aria-label="Next track"/);
  assert.match(musicPageSource, /aria-label="Play"/);
  assert.match(musicPageSource, /aria-label="Pause"/);
  assert.match(musicPageSource, /aria-label="Stop"/);
  assert.doesNotMatch(musicPageSource, />\s*\|<</);
  assert.doesNotMatch(musicPageSource, />\s*<</);
  assert.doesNotMatch(musicPageSource, />\s*>>/);
  assert.doesNotMatch(musicPageSource, />\s*>>\|/);
  assert.doesNotMatch(musicPageSource, />\s*\|>/);
  assert.doesNotMatch(musicPageSource, />\s*\|\|/);
  assert.doesNotMatch(musicPageSource, />\s*\[\]/);
});

test("music page abstracts YouTube playback through a dedicated hook and keeps playback messaging off the visible reference UI", () => {
  assert.match(musicPageSource, /import \{ useYoutubeMusicPlayer \} from "@\/hooks\/use-youtube-music-player"/);
  assert.match(
    musicPageSource,
    /import \{ formatElapsedTime, HIDDEN_YOUTUBE_PLAYER_DIMENSION \} from "@\/lib\/youtube";/,
  );
  assert.match(
    musicPageSource,
    /const \{\s*activeTrackIndex,\s*currentSeconds,\s*errorMessage,\s*isReady,[\s\S]*noticeMessage,[\s\S]*playerHostRef,[\s\S]*playerState,/s,
  );
  assert.match(musicPageSource, /aria-live="polite"/);
  assert.doesNotMatch(musicPageSource, /\{activeTrack\.title\}/);
  assert.doesNotMatch(musicPageSource, /\{activeTrack\.artist\}/);
});

test("music page keeps the hidden YouTube host offscreen without using a zero-sized box", () => {
  assert.match(musicPageSource, /height: HIDDEN_YOUTUBE_PLAYER_DIMENSION,/);
  assert.match(musicPageSource, /width: HIDDEN_YOUTUBE_PLAYER_DIMENSION,/);
  assert.match(musicPageSource, /opacity: 0,/);
  assert.match(musicPageSource, /pointerEvents: "none",/);
});

test("music page uses a six-face cube and animates the selected cube into the player pane", () => {
  assert.match(musicPageSource, /const viewMode = useAppStore\(\(state\) => state\.screenState\.music\.viewMode\);/);
  assert.match(musicPageSource, /const setMusicState = useAppStore\(\(state\) => state\.setMusicState\);/);
  assert.match(musicPageSource, /rotateY\(180deg\) translateZ/);
  assert.match(musicPageSource, /rotateY\(90deg\) translateZ/);
  assert.match(musicPageSource, /rotateY\(-90deg\) translateZ/);
  assert.match(musicPageSource, /rotateX\(90deg\) translateZ/);
  assert.match(musicPageSource, /rotateX\(-90deg\) translateZ/);
  assert.match(musicPageSource, /playerDockRef/);
  assert.match(musicPageSource, /position: "fixed"/);
  assert.match(musicPageSource, /music-cube-twist-walk 14s linear infinite/);
  assert.match(musicPageSource, /rotate3d\(1, 1, 0\.75, 360deg\)/);
});

test("music page keeps x/y aligned and exposes an env-toggled grid helper for axis debugging", () => {
  assert.match(musicPageSource, /display: "grid"/);
  assert.match(musicPageSource, /gridTemplateColumns: `repeat\(\$\{columnCount\}, minmax\(0, 1fr\)\)`/);
  assert.match(
    musicPageSource,
    /import \{ SHOW_THREE_SCENE_HELPER, ThreeSceneHelperPanel \} from "@\/components\/shared\/three-scene-helper-panel"/,
  );
  assert.match(musicPageSource, /SHOW_THREE_SCENE_HELPER \? <MusicGridDebugPanel/);
  assert.match(musicPageSource, /const GRID_CAMERA_TILT = "rotateX\(-?\d+deg\)";/);
  assert.match(musicPageSource, /const GRID_CAMERA = \{/);
  assert.match(musicPageSource, /const gridCamera = compact \? GRID_CAMERA\.mobile : GRID_CAMERA\.desktop;/);
  assert.match(musicPageSource, /perspective: gridCamera\.perspective/);
  assert.match(musicPageSource, /transform: gridCamera\.transform/);
  assert.match(musicPageSource, /translate3d\(0, 0, \$\{halfSize\}\)/);
  assert.match(musicPageSource, /plane="xy"/);
  assert.match(musicPageSource, /cameraUp=\{\[0, 0, 1\]\}/);
  assert.doesNotMatch(musicPageSource, /const GRID_CAMERA_TILT = "rotateX\([^)]+\) rotateZ\([^)]+\)";/);
  assert.doesNotMatch(musicPageSource, /const GRID_CAMERA_TILT = "rotateX\([^)]+\) rotateY\([^)]+\)";/);
});

test("music page keeps shared text outline smoothing and avoids forcing the player text pane onto a 3d layer", () => {
  assert.doesNotMatch(musicPageSource, /textShadow:\s*"none"/);
  assert.match(musicPageSource, /translateY/);
  assert.doesNotMatch(musicPageSource, /transform: `translate3d\(0, \$\{viewMode === "grid" \? "24px" : "0"\}, 0\)`/);
});
