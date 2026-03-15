import assert from "node:assert/strict";

import { test } from "vite-plus/test";

import {
  generateVaporSprites,
  liftVaporY,
  scaleVaporOpacity,
  scaleVaporScale,
  VAPOR_OPACITY_MULTIPLIER,
  VAPOR_SPREAD_XZ,
  VAPOR_SCALE_X_MULTIPLIER,
  VAPOR_SCALE_Y_MULTIPLIER,
  VAPOR_Y_OFFSET,
} from "../../src/components/scene/cloudLayout";

test("keeps the vapor field within the configured horizontal spread", () => {
  assert.equal(VAPOR_SPREAD_XZ, 2.8);

  const furthestRadius = Math.max(...generateVaporSprites().map(({ position: [x, , z] }) => Math.hypot(x, z)));

  assert.ok(furthestRadius <= VAPOR_SPREAD_XZ);
});

test("slightly weakens the fog opacity without changing layout", () => {
  assert.equal(VAPOR_OPACITY_MULTIPLIER, 0.8);
  assert.equal(scaleVaporOpacity(1), 0.8);
  assert.ok(Math.abs(scaleVaporOpacity(0.4) - 0.32) < 1e-9);
});

test("shrinks fog sprites so they stay below the lower screen edge", () => {
  assert.equal(VAPOR_SCALE_X_MULTIPLIER, 0.88);
  assert.equal(VAPOR_SCALE_Y_MULTIPLIER, 0.45);
  assert.deepEqual(scaleVaporScale(2, 4), [1.76, 1.8]);
});

test("keeps fog lower so it does not climb too far into the pillars", () => {
  assert.equal(VAPOR_Y_OFFSET, -0.3);
  assert.ok(Math.abs(liftVaporY(0.4) - 0.1) < 1e-9);
});
