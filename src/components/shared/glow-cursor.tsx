"use client";

import React, { memo, useEffect, useMemo } from "react";
import * as THREE from "three";

import { createCursorTexture } from "@/lib/glowTexture";

interface GlowCursorProps {
  position: [number, number, number];
  visible?: boolean;
  color?: string;
  scale?: number;
}

export default memo(function GlowCursor({ position, visible = true, color = "#75D9EB", scale = 1.2 }: GlowCursorProps) {
  const texture = useMemo(() => createCursorTexture(), []);

  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: texture,
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [texture, color],
  );

  useEffect(() => {
    return () => {
      texture.dispose();
      material.dispose();
    };
  }, [texture, material]);

  const spriteScale = useMemo((): [number, number, number] => [scale, scale, 1], [scale]);

  if (!visible) return null;

  return <sprite position={position} scale={spriteScale} material={material} />;
});
