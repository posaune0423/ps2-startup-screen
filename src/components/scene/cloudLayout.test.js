import assert from "node:assert/strict";
import test from "node:test";
import { generateVaporSprites, VAPOR_SPREAD_XZ } from "./cloudLayout.ts";

void test("keeps the vapor field slightly tighter horizontally", () => {
  assert.equal(VAPOR_SPREAD_XZ, 4.4);

  const furthestRadius = Math.max(
    ...generateVaporSprites().map(({ position: [x, , z] }) => Math.hypot(x, z)),
  );

  assert.ok(furthestRadius <= VAPOR_SPREAD_XZ);
});
