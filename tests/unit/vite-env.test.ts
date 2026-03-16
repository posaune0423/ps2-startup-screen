import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const viteEnvPath = new URL("../../vite-env.d.ts", import.meta.url);

test("vite env declarations type the shared three scene helper flags", () => {
  assert.equal(existsSync(viteEnvPath), true);

  const viteEnvSource = readFileSync(viteEnvPath, "utf8");
  assert.match(viteEnvSource, /interface ImportMetaEnv/);
  assert.match(viteEnvSource, /readonly VITE_AUDIO_CD_GRID_HELPER\?: string;/);
  assert.match(viteEnvSource, /readonly VITE_THREE_SCENE_HELPER\?: string;/);
  assert.match(viteEnvSource, /interface ImportMeta/);
});
