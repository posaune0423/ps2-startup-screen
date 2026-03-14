"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CONFIG } from "./config";
import { getFadeFactor } from "./timeline";
import { createGlowTexture, createFogTexture } from "@/lib/glowTexture";

const CORE_GLOW = [
  { scale: 3, alpha: 0.35 },
  { scale: 6, alpha: 0.12 },
];

const FILL_FOG_COUNT = 200;
const FILL_SPREAD_XZ = 3.5;
const FILL_HEIGHT: [number, number] = [0.02, 1.6];
const FILL_SCALE: [number, number] = [2.2, 4.0];
const FILL_TILT_MAX = 0.4;

interface FillFogData {
  position: [number, number, number];
  rotation: [number, number, number];
  scaleXY: [number, number];
  opacity: number;
  color: string;
  seed: number;
}

interface FogLayerDef {
  y: number;
  scale: number;
  opacity: number;
  rotSpeed: number;
  blending: THREE.Blending;
  color: string;
  seed: number;
}

const FOG_PLANES: FogLayerDef[] = [
  // NormalBlending — ground level only
  {
    y: 0.02,
    scale: 11,
    opacity: 0.95,
    rotSpeed: 0.012,
    blending: THREE.NormalBlending,
    color: "#161A38",
    seed: 100,
  },
  {
    y: 0.06,
    scale: 10.5,
    opacity: 0.9,
    rotSpeed: -0.008,
    blending: THREE.NormalBlending,
    color: "#1E2245",
    seed: 150,
  },
  {
    y: 0.12,
    scale: 10,
    opacity: 0.82,
    rotSpeed: 0.01,
    blending: THREE.NormalBlending,
    color: "#1A1E40",
    seed: 175,
  },
  // Additive — concentrated low, rapid falloff
  {
    y: 0.04,
    scale: 9,
    opacity: 0.65,
    rotSpeed: 0.007,
    blending: THREE.AdditiveBlending,
    color: "#2A3060",
    seed: 250,
  },
  {
    y: 0.1,
    scale: 8.5,
    opacity: 0.6,
    rotSpeed: -0.011,
    blending: THREE.AdditiveBlending,
    color: "#3A4580",
    seed: 275,
  },
  {
    y: 0.2,
    scale: 8,
    opacity: 0.55,
    rotSpeed: -0.009,
    blending: THREE.AdditiveBlending,
    color: "#3A4580",
    seed: 300,
  },
  {
    y: 0.35,
    scale: 7,
    opacity: 0.42,
    rotSpeed: 0.013,
    blending: THREE.AdditiveBlending,
    color: "#2A3060",
    seed: 400,
  },
  {
    y: 0.5,
    scale: 6,
    opacity: 0.28,
    rotSpeed: -0.01,
    blending: THREE.AdditiveBlending,
    color: "#3A4580",
    seed: 450,
  },
  {
    y: 0.7,
    scale: 5,
    opacity: 0.15,
    rotSpeed: 0.008,
    blending: THREE.AdditiveBlending,
    color: "#2A3060",
    seed: 500,
  },
  {
    y: 1.0,
    scale: 4.5,
    opacity: 0.1,
    rotSpeed: -0.006,
    blending: THREE.AdditiveBlending,
    color: "#3A4580",
    seed: 530,
  },
  {
    y: 1.3,
    scale: 3.5,
    opacity: 0.06,
    rotSpeed: 0.005,
    blending: THREE.AdditiveBlending,
    color: "#2A3060",
    seed: 560,
  },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function heightToColor(y: number): string {
  const t = Math.min(y / FILL_HEIGHT[1], 1);
  const r = Math.round(22 + t * 20);
  const g = Math.round(26 + t * 24);
  const b = Math.round(52 + t * 45);
  return `rgb(${r},${g},${b})`;
}

function generateFillFogs(): FillFogData[] {
  const rand = seededRandom(555);
  const result: FillFogData[] = [];

  const horizCount = Math.floor(FILL_FOG_COUNT * 0.5);
  for (let i = 0; i < horizCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.8) * FILL_SPREAD_XZ;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = FILL_HEIGHT[0] + rand() * (FILL_HEIGHT[1] - FILL_HEIGHT[0]);
    const s = FILL_SCALE[0] + rand() * (FILL_SCALE[1] - FILL_SCALE[0]);
    const tiltX = -Math.PI / 2 + (rand() - 0.5) * FILL_TILT_MAX;
    const distNorm = r / FILL_SPREAD_XZ;
    const heightFade = 1 - Math.pow(y / FILL_HEIGHT[1], 0.45);
    const opacity = (0.5 + rand() * 0.25) * (1 - distNorm * 0.2) * heightFade;
    result.push({
      position: [x, y, z],
      rotation: [tiltX, rand() * Math.PI * 2, (rand() - 0.5) * FILL_TILT_MAX],
      scaleXY: [s, s],
      opacity,
      color: heightToColor(y),
      seed: 1000 + i * 37,
    });
  }

  const vertCount = Math.floor(FILL_FOG_COUNT * 0.5);
  for (let i = 0; i < vertCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.7) * FILL_SPREAD_XZ;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const yCenter = FILL_HEIGHT[0] + rand() * (FILL_HEIGHT[1] - FILL_HEIGHT[0]) * 0.85;
    const w = 0.8 + rand() * 1.5;
    const h = 0.6 + rand() * 1.2;
    const rotY = rand() * Math.PI;
    const tiltFwd = (rand() - 0.5) * 0.3;
    const distNorm = r / FILL_SPREAD_XZ;
    const heightFade = 1 - Math.pow(yCenter / FILL_HEIGHT[1], 0.45);
    const opacity = (0.35 + rand() * 0.2) * (1 - distNorm * 0.25) * heightFade;
    result.push({
      position: [x, yCenter, z],
      rotation: [tiltFwd, rotY, 0],
      scaleXY: [w, h],
      opacity,
      color: heightToColor(yCenter),
      seed: 2000 + i * 41,
    });
  }

  return result;
}

export default function CentralGlow({ elapsedRef }: { elapsedRef: React.RefObject<number> }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const glowSpritesRef = useRef<THREE.Sprite[]>([]);
  const fogMeshesRef = useRef<THREE.Mesh[]>([]);
  const fillMeshesRef = useRef<THREE.Mesh[]>([]);

  const glowTexture = useMemo(() => createGlowTexture(), []);

  const fogTextures = useMemo(() => FOG_PLANES.map((def) => createFogTexture(512, def.seed)), []);

  const fillFogs = useMemo(() => generateFillFogs(), []);
  const fillTextures = useMemo(
    () => fillFogs.map((f) => createFogTexture(256, f.seed)),
    [fillFogs],
  );
  const fillMaterials = useMemo(
    () =>
      fillFogs.map(
        (f, i) =>
          new THREE.MeshBasicMaterial({
            map: fillTextures[i],
            color: f.color,
            transparent: true,
            opacity: f.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
      ),
    [fillFogs, fillTextures],
  );

  const fogMaterials = useMemo(
    () =>
      FOG_PLANES.map(
        (def, i) =>
          new THREE.MeshBasicMaterial({
            map: fogTextures[i],
            color: def.color,
            transparent: true,
            opacity: def.opacity,
            blending: def.blending,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
      ),
    [fogTextures],
  );

  const glowMaterials = useMemo(
    () =>
      CORE_GLOW.map(
        (layer) =>
          new THREE.SpriteMaterial({
            map: glowTexture,
            color: CONFIG.glow.color,
            transparent: true,
            opacity: layer.alpha,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
      ),
    [glowTexture],
  );

  useFrame((_, delta) => {
    const fade = getFadeFactor(elapsedRef.current ?? 0);

    if (lightRef.current) {
      lightRef.current.intensity = CONFIG.glow.intensity * fade;
    }

    glowSpritesRef.current.forEach((sprite, i) => {
      if (sprite) {
        sprite.material.opacity = CORE_GLOW[i].alpha * fade;
      }
    });

    fogMeshesRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const def = FOG_PLANES[i];
      mesh.rotation.z += def.rotSpeed * delta;
      (mesh.material as THREE.MeshBasicMaterial).opacity = def.opacity * fade;
    });

    fillMeshesRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      (mesh.material as THREE.MeshBasicMaterial).opacity = fillFogs[i].opacity * fade;
    });
  });

  return (
    <group>
      <pointLight
        ref={lightRef}
        position={[...CONFIG.glow.position]}
        color={CONFIG.glow.color}
        intensity={CONFIG.glow.intensity}
        distance={CONFIG.glow.distance}
        decay={CONFIG.glow.decay}
        castShadow
        shadow-mapSize-width={CONFIG.glow.shadowMapSize}
        shadow-mapSize-height={CONFIG.glow.shadowMapSize}
        shadow-bias={CONFIG.glow.shadowBias}
      />
      {CORE_GLOW.map((layer, i) => (
        <sprite
          key={`glow-${i}`}
          ref={(el) => {
            if (el) glowSpritesRef.current[i] = el;
          }}
          position={[0, 0.3, 0]}
          scale={[layer.scale, layer.scale, 1]}
          material={glowMaterials[i]}
          renderOrder={2}
        />
      ))}
      {FOG_PLANES.map((def, i) => (
        <mesh
          key={`fog-${i}`}
          ref={(el) => {
            if (el) fogMeshesRef.current[i] = el;
          }}
          position={[0, def.y, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={fogMaterials[i]}
          renderOrder={def.blending === THREE.NormalBlending ? -1 : 1}
        >
          <planeGeometry args={[def.scale, def.scale]} />
        </mesh>
      ))}
      {fillFogs.map((f, i) => (
        <mesh
          key={`fill-${i}`}
          ref={(el) => {
            if (el) fillMeshesRef.current[i] = el;
          }}
          position={f.position}
          rotation={f.rotation}
          material={fillMaterials[i]}
          renderOrder={0}
        >
          <planeGeometry args={[f.scaleXY[0], f.scaleXY[1]]} />
        </mesh>
      ))}
    </group>
  );
}
