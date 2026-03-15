import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sceneSource = readFileSync(new URL("./Scene.tsx", import.meta.url), "utf8");

void test("tries autoplay and still keeps click fallback for startup audio", () => {
  assert.match(sceneSource, /onClick=\{handleStartSound\}/);
  assert.match(sceneSource, /useEffect\(\(\) => \{\s*const nextState = startSceneSound\(/s);
});
