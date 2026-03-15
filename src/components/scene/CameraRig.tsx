"use client";

import { useFrame, useThree } from "@react-three/fiber";
import React, { memo, useRef } from "react";
import type * as THREE from "three";

import { CONFIG } from "./config";
import { getCameraParams } from "./timeline";

const HALF_PI = -Math.PI / 2;

export default memo(function CameraRig({
  elapsedRef,
  sceneGroupRef,
}: {
  elapsedRef: React.RefObject<number>;
  sceneGroupRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    const nextElapsed = (elapsedRef.current ?? 0) + delta;
    elapsedRef.current = nextElapsed;
    const elapsed = Math.min(nextElapsed, CONFIG.timeline.duration);

    const { angularSpeed, height } = getCameraParams(elapsed);

    camera.position.y = height;
    camera.rotation.x = HALF_PI;

    angleRef.current -= angularSpeed * delta;
    if (sceneGroupRef.current) {
      sceneGroupRef.current.rotation.y = angleRef.current;
    }
  });

  return null;
});
