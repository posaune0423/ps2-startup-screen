"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CONFIG } from "./config";
import { getCameraParams } from "./timeline";

export default function CameraRig({
  elapsedRef,
  playingRef,
  sceneGroupRef,
}: {
  elapsedRef: React.MutableRefObject<number>;
  playingRef: React.RefObject<boolean>;
  sceneGroupRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    if (!playingRef.current) return;
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
