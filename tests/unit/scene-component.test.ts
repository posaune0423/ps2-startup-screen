import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const sceneSource = readFileSync(new URL("../../src/components/Scene.tsx", import.meta.url), "utf8");

test("tries autoplay and still keeps click fallback for startup audio", () => {
  assert.match(sceneSource, /onClick=\{handleStartSound\}/);
  assert.match(sceneSource, /useEffect\(\(\) => \{[\s\S]*const nextState = startSceneSound\(/);
});

test("startup audio path reads the shared sound setting before autoplay or click fallback", () => {
  assert.match(sceneSource, /import \{ getSoundEnabled, initializeSoundEnabled \} from "@\/lib\/sound-settings"/);
  assert.match(sceneSource, /initializeSoundEnabled\(\);/);
  assert.match(sceneSource, /soundEnabled: getSoundEnabled\(\)/);
  assert.match(sceneSource, /if \(!getSoundEnabled\(\)\) return;/);
});

test("startup scene leaves ambient audio to the menu screens", () => {
  assert.doesNotMatch(sceneSource, /import \{ startAmbientAudio \} from "@\/lib\/ambient-audio"/);
  assert.doesNotMatch(sceneSource, /startAmbientAudio\(\)/);
});
