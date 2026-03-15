"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

import { CONFIG } from "./config";
import { getCameraParams } from "./timeline";

export default function CameraRig({
  elapsedRef,
  sceneGroupRef,
}: {
  elapsedRef: React.MutableRefObject<number>;
  sceneGroupRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const elapsed = Math.min(elapsedRef.current, CONFIG.timeline.duration);

    const { angularSpeed, height } = getCameraParams(elapsed);

    camera.position.set(0, height, 0);
    camera.rotation.set(-Math.PI / 2, 0, 0);

    angleRef.current -= angularSpeed * delta;
    if (sceneGroupRef.current) {
      sceneGroupRef.current.rotation.y = angleRef.current;
    }
  });

  return null;
}
