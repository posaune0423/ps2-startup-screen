"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface GlowCursorProps {
  position: [number, number, number];
  visible?: boolean;
  color?: string;
  scale?: number;
}

function createCursorTexture(size = 128): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
  gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.25)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function GlowCursor({ position, visible = true, color = "#75D9EB", scale = 1.2 }: GlowCursorProps) {
  const texture = useMemo(() => createCursorTexture(), []);
  const spriteColor = useMemo(() => new THREE.Color(color), [color]);

  if (!visible) return null;

  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial
        map={texture}
        color={spriteColor}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  );
}
