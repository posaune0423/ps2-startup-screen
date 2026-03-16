"use client";

import { useFrame } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
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
  color: new THREE.Color("#e8f0ff"),
  emissive: new THREE.Color("#5090FF"),
  emissiveIntensity: 0.8,
  transmission: 1.0,
  roughness: 0,
  metalness: 0,
  thickness: 0.15,
  ior: 1.5,
  iridescence: 0.8,
  iridescenceIOR: 1.8,
  iridescenceThicknessRange: [200, 800],
  clearcoat: 1.0,
  clearcoatRoughness: 0,
  specularIntensity: 1.2,
  specularColor: new THREE.Color("#ffffff"),
  attenuationColor: new THREE.Color("#c0dcff"),
  attenuationDistance: 5.0,
  transparent: true,
  opacity: 0.55,
  flatShading: true,
});

export default function HexFlower() {
  const groupRef = useRef<THREE.Group>(null);
  const petalsRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = petalsRef.current;
    if (!mesh) return;

    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const dummy = new THREE.Object3D();

    PETAL_DATA.forEach(({ position, rotation }, index) => {
      dummy.position.set(...position);
      dummy.rotation.set(...rotation);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
      groupRef.current.rotation.z -= delta * 0.025;
      groupRef.current.rotation.x -= delta * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[-3.2, 0.3, -5]} rotation={[-0.25, 0, 0.3]}>
      <pointLight position={[2, 3, 4]} intensity={40} color="#A0D0FF" distance={18} decay={1.5} />
      <pointLight position={[-3, -1, 2]} intensity={25} color="#6090FF" distance={14} decay={1.5} />
      <pointLight position={[0, 0, 0]} intensity={20} color="#7080FF" distance={10} decay={1.8} />
      <instancedMesh ref={petalsRef} args={[sharedGeometry, sharedMaterial, PETAL_DATA.length]} />
    </group>
  );
}
