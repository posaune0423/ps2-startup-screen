import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const helperSource = readFileSync(
  new URL("../../src/components/shared/three-scene-helper-panel.tsx", import.meta.url),
  "utf8",
);
const sceneSource = readFileSync(new URL("../../src/components/Scene.tsx", import.meta.url), "utf8");
const browserPageSource = readFileSync(
  new URL("../../src/components/screens/browser-screen.tsx", import.meta.url),
  "utf8",
);
const systemPageSource = readFileSync(
  new URL("../../src/components/screens/system-screen.tsx", import.meta.url),
  "utf8",
);
const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");

test("shared three scene helper panel uses real r3f helpers behind a global env toggle", () => {
  assert.match(
    helperSource,
    /export const SHOW_THREE_SCENE_HELPER =[\s\S]*import\.meta\.env\.VITE_THREE_SCENE_HELPER === "1" \|\| import\.meta\.env\.VITE_AUDIO_CD_GRID_HELPER === "1";/,
  );
  assert.match(helperSource, /import \{ Html, Line \} from "@react-three\/drei"/);
  assert.match(helperSource, /<Canvas/);
  assert.match(helperSource, /<gridHelper args=\{\[size, divisions, "#D9DEE6", "#D9DEE6"\]\}/);
  assert.match(helperSource, /<axesHelper/);
  assert.match(helperSource, /const axesSize = explicitAxesSize \?\? size \/ 2;/);
  assert.match(helperSource, /const inPlaneAxes = PLANE_AXES\[plane\];/);
  assert.match(helperSource, /depthTest=\{false\}/);
  assert.match(helperSource, /lineWidth=\{2\.4\}/);
  assert.match(helperSource, /<div style=\{AXIS_LEGEND_STYLE\}>/);
  assert.match(helperSource, /<span style=\{\{ \.\.\.AXIS_LEGEND_SWATCH_STYLE, background: color \}\} \/>/);
  assert.match(helperSource, /<span style=\{\{ color \}\}>\{axis\}<\/span>/);
  assert.match(helperSource, /xy: \[Math\.PI \/ 2, 0, 0\]/);
  assert.match(helperSource, /camera\.up\.set\(\.\.\.cameraUp\)/);
  assert.match(helperSource, /x: "#FF5A5A"/);
  assert.match(helperSource, /y: "#61D96B"/);
  assert.match(helperSource, /z: "#4F7DFF"/);
  assert.doesNotMatch(helperSource, /debug:\s*x=/i);
});

test("shared three scene helper panel is mounted on the main three.js pages", () => {
  assert.match(
    sceneSource,
    /import \{ ThreeSceneHelperPanel \} from "@\/components\/shared\/three-scene-helper-panel"/,
  );
  assert.match(sceneSource, /<ThreeSceneHelperPanel/);
  assert.match(
    browserPageSource,
    /import \{ SHOW_THREE_SCENE_HELPER, ThreeSceneHelperPanel \} from "@\/components\/shared\/three-scene-helper-panel"/,
  );
  assert.match(browserPageSource, /function BrowserMemoryCardDebugPanel/);
  assert.match(browserPageSource, /SHOW_THREE_SCENE_HELPER \? <BrowserMemoryCardDebugPanel/);
  assert.match(
    systemPageSource,
    /import \{ ThreeSceneHelperPanel \} from "@\/components\/shared\/three-scene-helper-panel"/,
  );
  assert.match(systemPageSource, /<ThreeSceneHelperPanel/);
  assert.match(
    itemGridSource,
    /import \{ ThreeSceneHelperPanel \} from "@\/components\/shared\/three-scene-helper-panel"/,
  );
  assert.match(itemGridSource, /<ThreeSceneHelperPanel/);
});

test("browser memory card page helper reuses the card positions and renders an xy-plane debug view", () => {
  assert.match(browserPageSource, /function getBrowserCardPositions\(isMobile: boolean\)/);
  assert.match(
    browserPageSource,
    /const positions = useMemo\(\(\) => getBrowserCardPositions\(isMobile\), \[isMobile\]\);/,
  );
  assert.match(browserPageSource, /plane="xy"/);
  assert.match(browserPageSource, /cameraPosition=\{\[0, 0, 7\.2\]\}/);
  assert.match(browserPageSource, /boxGeometry args=\{\[0\.6, 0\.42, 0\.16\]\}/);
});
