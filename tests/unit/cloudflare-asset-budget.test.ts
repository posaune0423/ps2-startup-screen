import assert from "node:assert/strict";
import { statSync } from "node:fs";

import { test } from "vite-plus/test";

const WORKERS_ASSET_LIMIT_BYTES = 25 * 1024 * 1024;

test("ambient loop stays within the Cloudflare Workers asset limit", () => {
  const ambientLoop = statSync(new URL("../../public/sound/ambient.wav", import.meta.url));

  assert.ok(
    ambientLoop.size <= WORKERS_ASSET_LIMIT_BYTES,
    `public/sound/ambient.wav is ${ambientLoop.size} bytes, exceeding the Workers asset limit of ${WORKERS_ASSET_LIMIT_BYTES} bytes`,
  );
});
