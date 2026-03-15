"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const PETAL_COUNT = 12;
const PETAL_HEIGHT = 3;
const PETAL_RADIUS_TOP = 0.4;
const PETAL_RADIUS_BOTTOM = 0.4;
const CENTER_OFFSET = 3.0;

export default function HexFlower() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[-2.5, 0, -3]}>
      {Array.from({ length: PETAL_COUNT }, (_, i) => {
        const angle = (i / PETAL_COUNT) * Math.PI * 2;
        const x = Math.cos(angle) * CENTER_OFFSET;
        const y = Math.sin(angle) * CENTER_OFFSET;

        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle - Math.PI / 2]}>
            <cylinderGeometry args={[PETAL_RADIUS_TOP, PETAL_RADIUS_BOTTOM, PETAL_HEIGHT, 6]} />
            <meshPhysicalMaterial
              color="#0249A6"
              emissive={new THREE.Color("#0249A6")}
              emissiveIntensity={0.6}
              transmission={0.88}
              roughness={0}
              metalness={0}
              thickness={0.5}
              transparent
              opacity={0.25}
              ior={1.55}
              envMapIntensity={4}
              reflectivity={1}
              clearcoat={1}
              clearcoatRoughness={0}
              iridescence={0.8}
              iridescenceIOR={1.6}
              iridescenceThicknessRange={[150, 500]}
              attenuationColor={new THREE.Color("#0249A6")}
              attenuationDistance={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}
