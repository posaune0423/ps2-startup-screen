import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const backButtonSource = readFileSync(new URL("../../src/components/shared/back-button.tsx", import.meta.url), "utf8");

test("startup route does not map to a global back button", () => {
  assert.doesNotMatch(backButtonSource, /"\/":/);
});

test("button overlay triggers use-haptic feedback for both enter and back actions", () => {
  assert.match(backButtonSource, /import \{ useHaptic \} from "use-haptic"/);
  assert.match(backButtonSource, /const \{ triggerHaptic \} = useHaptic\(5\);/);
  assert.match(
    backButtonSource,
    /const handleBack = useCallback\(\(\) => \{[\s\S]*triggerHaptic\(\);[\s\S]*playBack\(\);/,
  );
  assert.match(
    backButtonSource,
    /const handleEnter = useCallback\(\(\) => \{[\s\S]*triggerHaptic\(\);[\s\S]*KeyboardEvent\("keydown", \{ key: "Enter", bubbles: true \}\)/,
  );
});

test("button icons use a tighter circular mask to remove the white rim", () => {
  assert.match(backButtonSource, /const iconStyle = \{ clipPath: "circle\(40%\)" \} as const;/);
  assert.doesNotMatch(backButtonSource, /className="overflow-hidden bg-black"/);
});
