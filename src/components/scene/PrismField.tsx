"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CONFIG } from "./config";

interface PrismData {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  colorIndex: number;
  lightnessOffset: number;
}

const DARK_CORNER_COLORS = ["#515460", "#383C45", "#3A3C43"] as const;
const TOP_CAP_COLOR = "#1B1F32";

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generatePrisms(aspect: number): PrismData[] {
  const {
    spacing,
    cullRate,
    heightMin,
    heightMax,
    baseWidth,
    widthVariance,
    lightnessJitter,
    positionJitter,
    colors,
  } = CONFIG.prism;

  const totalCells = CONFIG.prism.gridCols * CONFIG.prism.gridRows;

  let cols: number;
  let rows: number;
  if (aspect >= 1) {
    cols = Math.round(Math.sqrt(totalCells * aspect));
    rows = Math.round(totalCells / cols);
  } else {
    rows = Math.round(Math.sqrt(totalCells / aspect));
    cols = Math.round(totalCells / rows);
  }
  cols = Math.max(cols, 4);
  rows = Math.max(rows, 4);

  const rand = seededRandom(42);

  const culled = new Set<string>();
  const key = (c: number, r: number) => `${c},${r}`;
  const hasAdjacentCull = (c: number, r: number) =>
    culled.has(key(c - 1, r)) ||
    culled.has(key(c + 1, r)) ||
    culled.has(key(c, r - 1)) ||
    culled.has(key(c, r + 1));

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (rand() < cullRate && !hasAdjacentCull(col, row)) {
        culled.add(key(col, row));
      }
    }
  }

  const prisms: PrismData[] = [];
  const offsetX = ((cols - 1) * spacing) / 2;
  const offsetZ = ((rows - 1) * spacing) / 2;
  const rand2 = seededRandom(99);

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (culled.has(key(col, row))) {
        for (let k = 0; k < 6; k++) rand2();
        continue;
      }

      const r = rand2();
      let height: number;
      if (r < 0.2) {
        height = heightMin + rand2() * 0.4;
      } else if (r < 0.55) {
        height = 0.6 + rand2() * 1.0;
      } else if (r < 0.82) {
        height = 1.6 + rand2() * 1.4;
      } else {
        height = 3.0 + rand2() * (heightMax - 3.0);
      }

      const w = baseWidth + (rand2() - 0.5) * 2 * widthVariance;

      prisms.push({
        x: col * spacing - offsetX + (rand2() - 0.5) * 2 * positionJitter,
        z: row * spacing - offsetZ + (rand2() - 0.5) * 2 * positionJitter,
        width: w,
        depth: w,
        height,
        colorIndex: Math.floor(rand2() * colors.length),
        lightnessOffset: (rand2() - 0.5) * 2 * lightnessJitter,
      });
    }
  }

  return prisms;
}

function isBottomRight(p: PrismData): boolean {
  return p.x > 1.2 && p.z > 0.6;
}

function isCenterBottom(p: PrismData): boolean {
  return Math.abs(p.x) < 0.8 && p.z > 0.4;
}

export default function PrismField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const aspect = viewport.width / viewport.height;

  const prisms = useMemo(() => generatePrisms(aspect), [aspect]);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: CONFIG.prism.roughness,
        metalness: CONFIG.prism.metalness,
      }),
    [],
  );

  const paletteColors = useMemo(() => CONFIG.prism.colors.map((c) => new THREE.Color(c)), []);

  const topCapPrisms = useMemo(() => {
    const candidates = prisms.filter(isCenterBottom);
    return candidates.slice(0, 3);
  }, [prisms]);

  const topCapMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: TOP_CAP_COLOR,
        roughness: CONFIG.prism.roughness,
        metalness: CONFIG.prism.metalness,
      }),
    [],
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let darkIdx = 0;

    for (let i = 0; i < prisms.length; i++) {
      const p = prisms[i];
      dummy.position.set(p.x, p.height / 2, p.z);
      dummy.scale.set(p.width, p.height, p.depth);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (isBottomRight(p)) {
        color.set(DARK_CORNER_COLORS[darkIdx % DARK_CORNER_COLORS.length]);
        darkIdx++;
      } else {
        color.copy(paletteColors[p.colorIndex % paletteColors.length]);
        color.offsetHSL(0, 0, p.lightnessOffset);
      }
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [prisms, paletteColors]);

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, prisms.length]}
        castShadow
        receiveShadow
      />
      {topCapPrisms.map((p, i) => (
        <mesh
          key={`cap-${i}`}
          position={[p.x, p.height + 0.005, p.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={topCapMaterial}
        >
          <planeGeometry args={[p.width, p.depth]} />
        </mesh>
      ))}
    </group>
  );
}
