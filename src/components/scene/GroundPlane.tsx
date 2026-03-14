"use client";

import { CONFIG } from "./config";

export default function GroundPlane() {
  const { size, color, roughness } = CONFIG.ground;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0} />
    </mesh>
  );
}
