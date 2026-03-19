"use client";

import { useFrame } from "@react-three/fiber";
import React, { memo, useCallback, useRef, useMemo } from "react";
import * as THREE from "three";

import { CONFIG } from "./config";

interface CubeData {
  position: [number, number, number];
  size: number;
  rotationSpeeds: [number, number, number];
  bobOffset: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export default memo(function FloatingCubes({ elapsedRef }: { elapsedRef: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);

  const cubes = useMemo(() => {
    const rand = seededRandom(123);
    const { count, sizeRange, rotationSpeed } = CONFIG.floatingCubes;
    const result: CubeData[] = [];

    const positions: [number, number, number][] = [
      [-2.0, 5.2, -1.2],
      [1.8, 5.8, -1.0],
      [-1.2, 5.0, 1.0],
      [2.2, 5.4, 0.9],
    ];

    for (let i = 0; i < count; i++) {
      const size = sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0]);
      const [minSpd, maxSpd] = rotationSpeed;
      const sign = () => (rand() > 0.5 ? 1 : -1);
      result.push({
        position: positions[i % positions.length],
        size,
        rotationSpeeds: [
          sign() * (minSpd + rand() * (maxSpd - minSpd)),
          sign() * (minSpd + rand() * (maxSpd - minSpd)),
          sign() * (minSpd + rand() * (maxSpd - minSpd)),
        ],
        bobOffset: rand() * Math.PI * 2,
      });
    }

    return result;
  }, []);

  const geometries = useMemo(() => cubes.map((c) => new THREE.BoxGeometry(c.size, c.size, c.size)), [cubes]);

  const material = useMemo(() => {
    const cfg = CONFIG.floatingCubes;
    return new THREE.MeshPhysicalMaterial({
      color: cfg.color,
      roughness: cfg.roughness,
      metalness: cfg.metalness,
      transmission: cfg.transmission,
      ior: cfg.ior,
      thickness: cfg.thickness,
      clearcoat: cfg.clearcoat,
      clearcoatRoughness: cfg.clearcoatRoughness,
      specularIntensity: cfg.specularIntensity,
      specularColor: new THREE.Color(cfg.specularColor),
      attenuationColor: new THREE.Color(cfg.attenuationColor),
      attenuationDistance: cfg.attenuationDistance,
      iridescence: cfg.iridescence,
      iridescenceIOR: cfg.iridescenceIOR,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 1.0,
    });
  }, []);

  const setMeshRef = useCallback(
    (i: number) => (el: THREE.Mesh | null) => {
      if (el) meshRefs.current[i] = el;
    },
    [],
  );

  useFrame((_, delta) => {
    const t = elapsedRef.current ?? 0;
    for (let i = 0; i < cubes.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      const cube = cubes[i];
      mesh.rotation.x += cube.rotationSpeeds[0] * delta;
      mesh.rotation.y += cube.rotationSpeeds[1] * delta;
      mesh.rotation.z += cube.rotationSpeeds[2] * delta;

      mesh.position.y =
        cube.position[1] +
        Math.sin(t / CONFIG.floatingCubes.bobPeriod + cube.bobOffset) * CONFIG.floatingCubes.bobAmplitude;
    }
  });

  return (
    <group ref={groupRef} renderOrder={2}>
      {cubes.map((cube, i) => (
        <mesh
          key={`${cube.position.join("-")}-${cube.size}`}
          ref={setMeshRef(i)}
          position={cube.position}
          material={material}
          geometry={geometries[i]}
        />
      ))}
    </group>
  );
});
