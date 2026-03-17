import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const routeReadySource = readFileSync(new URL("../../src/lib/route-transition-ready.ts", import.meta.url), "utf8");
const navigationOverlaySource = readFileSync(
  new URL("../../src/components/shared/navigation-overlay.tsx", import.meta.url),
  "utf8",
);
const browserMenuSource = readFileSync(new URL("../../src/components/BrowserMenu.tsx", import.meta.url), "utf8");
const browserPageSource = readFileSync(new URL("../../src/app/browser/page.tsx", import.meta.url), "utf8");
const itemGridSource = readFileSync(new URL("../../src/components/shared/item-grid.tsx", import.meta.url), "utf8");
const workPageSource = readFileSync(new URL("../../src/app/memory/work/page.tsx", import.meta.url), "utf8");
const snsPageSource = readFileSync(new URL("../../src/app/memory/sns/page.tsx", import.meta.url), "utf8");

test("route transition readiness helper gates the heavy three.js routes", () => {
  assert.match(routeReadySource, /const ROUTE_READY_EVENT = "app:route-ready";/);
  assert.match(routeReadySource, /const ROUTE_READY_TIMEOUT_MS = 1500;/);
  assert.match(
    routeReadySource,
    /const READY_GATED_ROUTES = new Set\(\["\/browser", "\/memory\/work", "\/memory\/sns"\]\);/,
  );
  assert.match(routeReadySource, /export function resetRouteReady\(pathname: string\)/);
  assert.match(routeReadySource, /export function markRouteReady\(pathname: string\)/);
  assert.match(routeReadySource, /export async function waitForRouteReady\(pathname: string\): Promise<void>/);
});

test("navigation overlay resets and waits for route readiness before resolving native view transitions", () => {
  assert.match(
    navigationOverlaySource,
    /import \{ resetRouteReady, waitForRouteReady \} from "@\/lib\/route-transition-ready"/,
  );
  assert.match(navigationOverlaySource, /resetRouteReady\(href\);/);
  assert.match(navigationOverlaySource, /void waitForRouteReady\(pathname\)\.then\(\(\) => \{/);
});

test("menu page preloads browser route models before navigating", () => {
  assert.match(browserMenuSource, /import \{ useGLTF \} from "@react-three\/drei"/);
  assert.match(browserMenuSource, /import \{ useRouter \} from "vinext\/shims\/navigation"/);
  assert.match(
    browserMenuSource,
    /const BROWSER_ROUTE_MODEL_PATHS = \["\/3d\/memorycard\.glb", "\/3d\/icons\/cd\.glb"\] as const;/,
  );
  assert.match(
    browserMenuSource,
    /for \(const modelPath of BROWSER_ROUTE_MODEL_PATHS\) \{\s*useGLTF\.preload\(modelPath\);/s,
  );
  assert.match(browserMenuSource, /router\.prefetch\(item\.href\);/);
});

test("browser page marks itself ready after all visible card models load and preloads the next memory routes", () => {
  assert.match(browserPageSource, /import \{ markRouteReady \} from "@\/lib\/route-transition-ready"/);
  assert.match(browserPageSource, /import \{ useRouter \} from "vinext\/shims\/navigation"/);
  assert.match(
    browserPageSource,
    /const BROWSER_READY_MODEL_COUNT = new Set\(CARDS\.map\(\(card\) => card\.modelPath\)\)\.size;/,
  );
  assert.match(browserPageSource, /const MEMORY_ROUTE_MODEL_PATHS = \[/);
  assert.match(browserPageSource, /onModelReady\?: \(modelPath: string\) => void;/);
  assert.match(browserPageSource, /onModelReady=\{handleModelReady\}/);
  assert.match(browserPageSource, /markRouteReady\("\/browser"\);/);
  assert.match(browserPageSource, /for \(const modelPath of MEMORY_ROUTE_MODEL_PATHS\)/);
  assert.match(browserPageSource, /router\.prefetch\(card\.href\);/);
});

test("memory card item grids mark their routes ready only after model loads finish", () => {
  assert.match(itemGridSource, /import \{ markRouteReady \} from "@\/lib\/route-transition-ready"/);
  assert.match(itemGridSource, /readyRoute: string;/);
  assert.match(itemGridSource, /onModelReady\?: \(modelPath: string\) => void;/);
  assert.match(
    itemGridSource,
    /const readyModelPathCount = useMemo\(\(\) => new Set\(items\.map\(\(item\) => item\.modelPath\)\)\.size, \[items\]\);/,
  );
  assert.match(itemGridSource, /markRouteReady\(readyRoute\);/);
  assert.match(workPageSource, /readyRoute="\/memory\/work"/);
  assert.match(snsPageSource, /readyRoute="\/memory\/sns"/);
});
