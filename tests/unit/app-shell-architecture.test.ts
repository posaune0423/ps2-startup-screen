import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const appShellSource = readFileSync(new URL("../../src/components/shared/app-shell.tsx", import.meta.url), "utf8");
const appScreenSource = readFileSync(new URL("../../src/lib/app-screen.ts", import.meta.url), "utf8");
const browserMenuSource = readFileSync(new URL("../../src/components/BrowserMenu.tsx", import.meta.url), "utf8");
const browserScreenSource = readFileSync(
  new URL("../../src/components/screens/browser-screen.tsx", import.meta.url),
  "utf8",
);
const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");
const menuShellSource = readFileSync(new URL("../../src/components/shared/menu-shell.tsx", import.meta.url), "utf8");
const memoryShellSource = readFileSync(
  new URL("../../src/components/shared/memory-shell.tsx", import.meta.url),
  "utf8",
);

test("app shell centralizes screen path mapping, shell clusters, and warmup asset manifest", () => {
  assert.match(appScreenSource, /export const SCREEN_PATHS: Record<AppScreenId, string> = \{/);
  assert.match(appScreenSource, /export type AppScreenCluster = "startup" \| "menu" \| "memory";/);
  assert.match(appScreenSource, /export const MENU_SHELL_SCREEN_IDS = \["menu", "system"\] as const;/);
  assert.match(appScreenSource, /memoryWork: "\/memory\/work"/);
  assert.match(appScreenSource, /memorySns: "\/memory\/sns"/);
  assert.match(appScreenSource, /music: "\/memory\/music"/);
  assert.match(
    appScreenSource,
    /export const WARMUP_ASSET_PATHS = Array\.from\(new Set\(Object\.values\(SCREEN_ASSETS\)\.flat\(\)\)\);/,
  );
});

test("app shell owns navigation transitions, startup warmup, and waits for hydration before choosing a screen", () => {
  assert.match(appShellSource, /const \[hasMounted, setHasMounted\] = useState\(false\);/);
  assert.match(appShellSource, /useEffect\(\(\) => \{\s*setHasMounted\(true\);\s*\}, \[\]\);/s);
  assert.match(
    appShellSource,
    /const currentScreen = useMemo\(\(\) => \(hasMounted \? getScreenFromPath\(pathname\) : null\), \[hasMounted, pathname\]\);/,
  );
  assert.match(appShellSource, /if \(!hasMounted \|\| currentScreen === null \|\| currentCluster === null\) \{/);
  assert.match(appShellSource, /return <div style=\{HYDRATION_PLACEHOLDER_STYLE\} \/>;/);
  assert.match(appShellSource, /window\.addEventListener\("app:navigate", handleNavigate\)/);
  assert.match(appShellSource, /beginNavigation\(targetScreen, reason\);/);
  assert.match(
    appShellSource,
    /const crossCluster = getScreenCluster\(currentScreen\) !== getScreenCluster\(targetScreen\);/,
  );
  assert.match(appShellSource, /resetScreenState\(targetScreen\);/);
  assert.match(appShellSource, /router\.push\(href\);/);
  assert.match(appShellSource, /await wait\(INTRA_CLUSTER_FADE_MS\);/);
  assert.match(appShellSource, /startWarmup\(WARMUP_ASSET_PATHS\.length\);/);
  assert.match(appShellSource, /useGLTF\.preload\(path\);/);
  assert.match(appShellSource, /fetch\(path, \{ cache: "force-cache" \}\)/);
});

test("menu cluster keeps pages mounted and uses opacity fades instead of route-owned transitions", () => {
  assert.doesNotMatch(browserMenuSource, /useGLTF\.preload/);
  assert.doesNotMatch(browserMenuSource, /router\.prefetch/);
  assert.match(browserMenuSource, /screenId: "menu"/);
  assert.match(browserMenuSource, /enabled: active,/);
  assert.match(browserMenuSource, /navigate\(item\.href\);/);
  assert.match(menuShellSource, /opacity \$\{LAYER_TRANSITION_MS\}ms ease-out/);
  assert.match(menuShellSource, /<MenuScreen active=\{menuActive\} \/>/);
  assert.match(menuShellSource, /<SystemScreen active=\{systemActive\} transparentBackground \/>/);
});

test("browser page drops route readiness gates and uses store-backed screen navigation", () => {
  assert.doesNotMatch(browserScreenSource, /markRouteReady/);
  assert.doesNotMatch(browserScreenSource, /router\.prefetch/);
  assert.doesNotMatch(browserScreenSource, /useGLTF\.preload/);
  assert.match(browserScreenSource, /screenId: "browser"/);
  assert.match(browserScreenSource, /navigate\(card\.href\);/);
});

test("memory card grids stay in a persistent shell and rely on shell warmup instead of route gates", () => {
  assert.doesNotMatch(itemGridSource, /markRouteReady/);
  assert.doesNotMatch(itemGridSource, /useGLTF\.preload\(item\.modelPath\)/);
  assert.match(itemGridSource, /screenId: ActiveIndexScreenId;/);
  assert.match(itemGridSource, /screenId,/);
  assert.match(memoryShellSource, /opacity \$\{LAYER_TRANSITION_MS\}ms ease-out/);
  assert.match(memoryShellSource, /<MemoryShellBackground useCssFallback=\{compact\} \/>/);
  assert.match(memoryShellSource, /<Ps2BrowserBg \/>/);
  assert.match(memoryShellSource, /useGLTF\.clear\(path\)/);
  assert.doesNotMatch(browserScreenSource, /background:\s*PS2_BROWSER_BG_FALLBACK/);
  assert.doesNotMatch(browserScreenSource, /<Ps2BrowserBg \/>/);
  assert.doesNotMatch(itemGridSource, /background:\s*PS2_BROWSER_BG_FALLBACK/);
  assert.doesNotMatch(itemGridSource, /<Ps2BrowserBg \/>/);
});
