"use client";

import { useFrame } from "@react-three/fiber";
import React, { memo, useMemo, useRef } from "react";
import type * as THREE from "three";

import { CONFIG } from "./config";
import { getFadeFactor } from "./timeline";

const { directional, ambient } = CONFIG.lighting;

export default memo(function Lighting({ elapsedRef }: { elapsedRef: React.RefObject<number> }) {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);

  const dirPosition = useMemo((): [number, number, number] => [...directional.position], []);

  useFrame(() => {
    const fade = getFadeFactor(elapsedRef.current ?? 0);
    if (dirRef.current) dirRef.current.intensity = directional.intensity * fade;
    if (ambRef.current) ambRef.current.intensity = ambient.intensity * fade;
  });

  return (
    <>
      <directionalLight
        ref={dirRef}
        position={dirPosition}
        intensity={directional.intensity}
        color={directional.color}
      />
      <ambientLight ref={ambRef} intensity={ambient.intensity} color={ambient.color} />
    </>
  );
});
