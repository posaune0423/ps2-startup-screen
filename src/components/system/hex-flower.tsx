"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const PETAL_COUNT = 12;
const PETAL_HEIGHT = 3;
const PETAL_RADIUS_TOP = 0.28;
const PETAL_RADIUS_BOTTOM = 0.28;
const CENTER_OFFSET = 3.0;

const PETAL_DATA = Array.from({ length: PETAL_COUNT }, (_, i) => {
  const angle = (i / PETAL_COUNT) * Math.PI * 2;
  return {
    position: [Math.cos(angle) * CENTER_OFFSET, Math.sin(angle) * CENTER_OFFSET, 0] as [number, number, number],
    rotation: [0, 0, angle - Math.PI / 2] as [number, number, number],
  };
});

const sharedGeometry = new THREE.CylinderGeometry(PETAL_RADIUS_TOP, PETAL_RADIUS_BOTTOM, PETAL_HEIGHT, 6);

const sharedMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#ffffff"),
  emissive: new THREE.Color("#1040AA"),
  emissiveIntensity: 0.5,
  transmission: 0.96,
  roughness: 0,
  metalness: 0,
  thickness: 0.3,
  ior: 1.6,
  iridescence: 0.8,
  iridescenceIOR: 1.8,
  iridescenceThicknessRange: [100, 700],
  clearcoat: 0.6,
  clearcoatRoughness: 0,
  transparent: true,
  opacity: 0.85,
  flatShading: true,
});

export default function HexFlower() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[-2.5, 0, -3]}>
      {PETAL_DATA.map(({ position, rotation }, i) => (
        <mesh key={i} position={position} rotation={rotation} geometry={sharedGeometry} material={sharedMaterial} />
      ))}
    </group>
  );
}
