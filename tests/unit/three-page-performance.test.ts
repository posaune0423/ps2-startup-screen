import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const sceneSource = readFileSync(new URL("../../src/components/Scene.tsx", import.meta.url), "utf8");
const sceneConfigSource = readFileSync(new URL("../../src/components/scene/config.ts", import.meta.url), "utf8");
const floatingCubesSource = readFileSync(
  new URL("../../src/components/scene/FloatingCubes.tsx", import.meta.url),
  "utf8",
);
const postProcessingSource = readFileSync(
  new URL("../../src/components/scene/PostProcessing.tsx", import.meta.url),
  "utf8",
);
const browserPageSource = readFileSync(new URL("../../src/app/browser/page.tsx", import.meta.url), "utf8");
const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");
const systemPageSource = readFileSync(new URL("../../src/app/system/page.tsx", import.meta.url), "utf8");
const hexFlowerSource = readFileSync(new URL("../../src/components/system/hex-flower.tsx", import.meta.url), "utf8");
const helperSource = readFileSync(
  new URL("../../src/components/shared/three-scene-helper-panel.tsx", import.meta.url),
  "utf8",
);

test("browser and item-grid canvases use demand frameloops for mostly static 3d pages", () => {
  assert.match(
    browserPageSource,
    /<Canvas[\s\S]*camera=\{CAMERA_PROPS\}[\s\S]*dpr=\{compact \? 0\.8 : 1\}[\s\S]*frameloop="demand"/,
  );
  assert.match(
    itemGridSource,
    /<Canvas[\s\S]*camera=\{cameraProps\}[\s\S]*dpr=\{compact \? 1 : 1\.25\}[\s\S]*frameloop="demand"/,
  );
  assert.match(
    itemGridSource,
    /camera=\{MEMORY_CARD_ICON_CAMERA\}[\s\S]*dpr=\{compact \? 1 : 1\}[\s\S]*frameloop="demand"/,
  );
  assert.match(browserPageSource, /const invalidate = useThree\(\(state\) => state\.invalidate\);/);
  assert.match(itemGridSource, /const invalidate = useThree\(\(state\) => state\.invalidate\);/);
  assert.doesNotMatch(browserPageSource, /const \[mounted, setMounted\] = useState\(false\);/);
  assert.doesNotMatch(browserPageSource, /\{mounted && \(/);
});

test("main scene keeps the timeout navigation path while restoring the reference startup quality profile", () => {
  assert.match(sceneSource, /const timeoutId = window\.setTimeout\(\(\) => \{\s*navigate\("\/menu"\);/s);
  assert.doesNotMatch(sceneSource, /requestAnimationFrame\(check\)/);
  assert.doesNotMatch(postProcessingSource, /<EffectComposer multisampling=\{0\}>/);
  assert.match(sceneConfigSource, /shadowMapSize:\s*1024,/);
  assert.match(floatingCubesSource, /side:\s*THREE\.DoubleSide,/);
});

test("system and helper canvases keep the higher-quality reference desktop settings", () => {
  assert.match(systemPageSource, /dpr=\{\[1,\s*1\.5\]\}/);
  assert.match(systemPageSource, /gl=\{\{ antialias: true, powerPreference: "high-performance" \}\}/);
  assert.match(hexFlowerSource, /const petalsRef = useRef<THREE\.InstancedMesh>\(null\);/);
  assert.match(hexFlowerSource, /mesh\.instanceMatrix\.setUsage\(THREE\.StaticDrawUsage\);/);
  assert.match(
    hexFlowerSource,
    /<instancedMesh ref=\{petalsRef\} args=\{\[sharedGeometry, sharedMaterial, PETAL_DATA\.length\]\} \/>/,
  );
  assert.doesNotMatch(hexFlowerSource, /PETAL_DATA\.map\(\(\{ position, rotation \}\) => \(/);
  assert.match(
    helperSource,
    /<Canvas[\s\S]*camera=\{\{ fov: 34, position: cameraPosition \}\}[\s\S]*dpr=\{1\}[\s\S]*frameloop="demand"/,
  );
});
