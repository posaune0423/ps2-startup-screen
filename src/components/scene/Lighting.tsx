"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CONFIG } from "./config";
import { getFadeFactor } from "./timeline";

export default function Lighting({ elapsedRef }: { elapsedRef: React.RefObject<number> }) {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);

  const { directional, ambient } = CONFIG.lighting;

  useFrame(() => {
    const fade = getFadeFactor(elapsedRef.current ?? 0);
    if (dirRef.current) dirRef.current.intensity = directional.intensity * fade;
    if (ambRef.current) ambRef.current.intensity = ambient.intensity * fade;
  });

  return (
    <>
      <directionalLight
        ref={dirRef}
        position={[...directional.position]}
        intensity={directional.intensity}
        color={directional.color}
      />
      <ambientLight ref={ambRef} intensity={ambient.intensity} color={ambient.color} />
    </>
  );
}
