"use client";

import { useThree } from "@react-three/fiber";
import React, { memo, useEffect, useMemo, useRef } from "react";
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
  edgeness: number;
}

const DARK_CORNER_COLORS = ["#585C68", "#484C56", "#424650"] as const;
const TOP_CAP_COLOR = "#6E7280";

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function gridKey(c: number, r: number) {
  return `${c},${r}`;
}

function generatePrisms(aspect: number): PrismData[] {
  const { spacing, cullRate, heightMin, heightMax, baseWidth, widthVariance, lightnessJitter, positionJitter, colors } =
    CONFIG.prism;

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
  const hasAdjacentCull = (c: number, r: number) =>
    culled.has(gridKey(c - 1, r)) ||
    culled.has(gridKey(c + 1, r)) ||
    culled.has(gridKey(c, r - 1)) ||
    culled.has(gridKey(c, r + 1));

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const isBottom = row > rows * 0.6;
      const isEdgeBottom = isBottom && (col < cols * 0.4 || col > cols * 0.6);
      const rate = isEdgeBottom ? cullRate * 5.5 : cullRate;
      if (rand() < rate && !hasAdjacentCull(col, row)) {
        culled.add(gridKey(col, row));
      }
    }
  }

  const prisms: PrismData[] = [];
  const offsetX = ((cols - 1) * spacing) / 2;
  const offsetZ = ((rows - 1) * spacing) / 2;
  const rand2 = seededRandom(99);

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (culled.has(gridKey(col, row))) {
        for (let k = 0; k < 6; k++) rand2();
        continue;
      }

      const r = rand2();
      let height: number;
      if (r < 0.2) {
        height = heightMin + rand2() * 0.5;
      } else if (r < 0.55) {
        height = 1.5 + rand2() * 1.5;
      } else if (r < 0.8) {
        height = 3.0 + rand2() * 1.5;
      } else {
        height = 4.5 + rand2() * (heightMax - 4.5);
      }

      const cx = (col - (cols - 1) / 2) / ((cols - 1) / 2);
      const cz = (row - (rows - 1) / 2) / ((rows - 1) / 2);
      const distFromCenter = Math.sqrt(cx * cx + cz * cz) / Math.SQRT2;
      height *= 1.0 - distFromCenter * 0.15;

      const w = baseWidth + (rand2() - 0.5) * 2 * widthVariance;

      const isEdge = col <= 1 || col >= cols - 2 || row <= 1 || row >= rows - 2;
      let px = col * spacing - offsetX + (rand2() - 0.5) * 2 * positionJitter;
      let pz = row * spacing - offsetZ + (rand2() - 0.5) * 2 * positionJitter;

      const len = Math.sqrt(px * px + pz * pz);
      if (len > 0.01) {
        const push = distFromCenter * distFromCenter * 0.2;
        px += (px / len) * push;
        pz += (pz / len) * push;
      }
      const rawCI = Math.floor(rand2() * colors.length);
      const ci = isEdge ? Math.min(rawCI, 1) : rawCI;

      prisms.push({
        x: px,
        z: pz,
        width: w,
        depth: w,
        height,
        colorIndex: ci,
        lightnessOffset: (rand2() - 0.5) * 2 * lightnessJitter,
        edgeness: distFromCenter,
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

const TOP_CAP_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];

export default memo(function PrismField() {
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

  const topCapPositions = useMemo(
    () => topCapPrisms.map((p): [number, number, number] => [p.x, p.height + 0.005, p.z]),
    [topCapPrisms],
  );

  const topCapGeometries = useMemo(
    () => topCapPrisms.map((p) => new THREE.PlaneGeometry(p.width, p.depth)),
    [topCapPrisms],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      topCapMaterial.dispose();
      for (const geo of topCapGeometries) geo.dispose();
    };
  }, [geometry, material, topCapMaterial, topCapGeometries]);

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

      if (isBottomRight(p) && darkIdx % 3 === 0) {
        color.set(DARK_CORNER_COLORS[darkIdx % DARK_CORNER_COLORS.length]);
      } else {
        color.copy(paletteColors[p.colorIndex % paletteColors.length]);
        color.offsetHSL(0, 0, p.lightnessOffset - p.edgeness * 0.12);
      }
      if (isBottomRight(p)) darkIdx++;
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [prisms, paletteColors]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[geometry, material, prisms.length]} castShadow receiveShadow />
      {topCapPrisms.map((prism, i) => (
        <mesh
          key={`cap-${prism.x}-${prism.height}-${prism.z}`}
          position={topCapPositions[i]}
          rotation={TOP_CAP_ROTATION}
          material={topCapMaterial}
          geometry={topCapGeometries[i]}
        />
      ))}
    </group>
  );
});
