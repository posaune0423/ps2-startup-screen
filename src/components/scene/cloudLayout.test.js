import assert from "node:assert/strict";
import test from "node:test";
import {
  generateVaporSprites,
  liftVaporY,
  scaleVaporScale,
  scaleVaporOpacity,
  VAPOR_OPACITY_MULTIPLIER,
  VAPOR_SPREAD_XZ,
  VAPOR_SCALE_X_MULTIPLIER,
  VAPOR_SCALE_Y_MULTIPLIER,
  VAPOR_Y_OFFSET,
} from "./cloudLayout.ts";

void test("keeps the vapor field slightly tighter horizontally", () => {
  assert.equal(VAPOR_SPREAD_XZ, 3.8);

  const furthestRadius = Math.max(
    ...generateVaporSprites().map(({ position: [x, , z] }) => Math.hypot(x, z)),
  );

  assert.ok(furthestRadius <= VAPOR_SPREAD_XZ);
});

void test("slightly weakens the fog opacity without changing layout", () => {
  assert.equal(VAPOR_OPACITY_MULTIPLIER, 0.8);
  assert.equal(scaleVaporOpacity(1), 0.8);
  assert.ok(Math.abs(scaleVaporOpacity(0.4) - 0.32) < 1e-9);
});

void test("shrinks fog sprite size so it stays out of the lower screen edge", () => {
  assert.equal(VAPOR_SCALE_X_MULTIPLIER, 0.88);
  assert.equal(VAPOR_SCALE_Y_MULTIPLIER, 0.68);
  assert.deepEqual(scaleVaporScale(2, 4), [1.76, 2.72]);
});

void test("keeps fog a bit lower so it does not climb too far into the pillars", () => {
  assert.equal(VAPOR_Y_OFFSET, -0.12);
  assert.equal(liftVaporY(0.4), 0.28);
});
