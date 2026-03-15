import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const systemMenuSource = readFileSync(new URL("../../src/components/system/system-menu.tsx", import.meta.url), "utf8");
const navigationSoundSource = readFileSync(
  new URL("../../src/components/shared/use-navigation-sound.ts", import.meta.url),
  "utf8",
);
const ambientAudioSource = readFileSync(new URL("../../src/lib/ambient-audio.ts", import.meta.url), "utf8");

test("system menu uses shared sound settings instead of local-only sound state", () => {
  assert.match(systemMenuSource, /import \{ useSoundSettings \} from "@\/lib\/sound-settings"/);
  assert.match(systemMenuSource, /const \{ soundEnabled, setSoundEnabled \} = useSoundSettings\(\)/);
  assert.doesNotMatch(systemMenuSource, /useState\(true\)/);
});

test("system menu toggles ambient audio when sound is turned on or off", () => {
  assert.match(systemMenuSource, /import \{ startAmbientAudio, stopAmbientAudio \} from "@\/lib\/ambient-audio"/);
  assert.match(systemMenuSource, /const nextSoundEnabled = !soundEnabled;/);
  assert.match(systemMenuSource, /setSoundEnabled\(nextSoundEnabled\)/);
  assert.match(
    systemMenuSource,
    /if \(nextSoundEnabled\) \{\s*startAmbientAudio\(\);\s*\} else \{\s*stopAmbientAudio\(\);\s*\}/s,
  );
});

test("navigation sound playback is gated by the shared sound setting", () => {
  assert.match(
    navigationSoundSource,
    /import \{ getSoundEnabled, initializeSoundEnabled \} from "@\/lib\/sound-settings"/,
  );
  assert.match(navigationSoundSource, /initializeSoundEnabled\(\);/);
  assert.match(navigationSoundSource, /if \(!getSoundEnabled\(\)\) return;/);
});

test("ambient audio startup respects the shared sound setting", () => {
  assert.match(
    ambientAudioSource,
    /import \{ getSoundEnabled, initializeSoundEnabled \} from "@\/lib\/sound-settings"/,
  );
  assert.match(ambientAudioSource, /initializeSoundEnabled\(\);/);
  assert.match(ambientAudioSource, /if \(!getSoundEnabled\(\)\) return;/);
});
