"use client";

import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import React, { memo } from "react";

import { CONFIG } from "./config";

export default memo(function PostProcessing() {
  return (
    <EffectComposer>
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={CONFIG.render.noiseIntensity} />
      <Vignette offset={CONFIG.render.vignetteOffset} darkness={CONFIG.render.vignetteDarkness} />
    </EffectComposer>
  );
});
