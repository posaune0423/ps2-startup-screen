"use client";

import React, { memo, useMemo } from "react";
import * as THREE from "three";

import { CONFIG } from "./config";

const { size, color, roughness } = CONFIG.ground;
const ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];
const POSITION: [number, number, number] = [0, 0, 0];

export default memo(function GroundPlane() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(size, size), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }), []);

  return <mesh rotation={ROTATION} position={POSITION} receiveShadow geometry={geometry} material={material} />;
});
