"use client";

import { useFrame } from "@react-three/fiber";
import React, { memo, useCallback, useRef, useMemo } from "react";
import * as THREE from "three";

import { createGlowTexture } from "@/lib/glowTexture";
import { createCloudFogMaterial } from "@/shaders/cloudFog";

import { generateVaporSprites } from "./cloudLayout";
import { CONFIG } from "./config";
import { getFadeFactor } from "./timeline";

const CORE_GLOW = [
  { id: "core", scale: 3, alpha: 0.35 },
  { id: "halo", scale: 6, alpha: 0.12 },
] as const;

const GLOW_SPRITE_POS: [number, number, number] = [0, 0.3, 0];
const GLOW_SPRITE_SCALES = CORE_GLOW.map((l): [number, number, number] => [l.scale, l.scale, 1]);

const glowPosition: [number, number, number] = [...CONFIG.glow.position];

export default memo(function CentralGlow({ elapsedRef }: { elapsedRef: React.RefObject<number> }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const glowSpritesRef = useRef<THREE.Sprite[]>([]);
  const vaporMeshesRef = useRef<Array<THREE.Mesh | null>>([]);

  const glowTexture = useMemo(() => createGlowTexture(), []);
  const unitPlaneGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const vapors = useMemo(() => generateVaporSprites(), []);

  const vaporMaterials = useMemo(
    () =>
      vapors.map((v) =>
        createCloudFogMaterial({
          color: v.color,
          opacity: v.opacity,
          blending: v.blending,
          noiseScale: v.noiseScale,
          scrollSpeed1: v.scrollSpeed1,
          scrollSpeed2: v.scrollSpeed2,
          fbmStrength: v.fbmStrength,
          verticalFade: v.verticalFade,
        }),
      ),
    [vapors],
  );

  const vaporScales = useMemo(() => vapors.map((v): [number, number, number] => [v.scaleW, v.scaleH, 1]), [vapors]);

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

  const setGlowSpriteRef = useCallback(
    (i: number) => (el: THREE.Sprite | null) => {
      if (el) glowSpritesRef.current[i] = el;
    },
    [],
  );

  const setVaporMeshRef = useCallback(
    (i: number) => (el: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null) => {
      if (el) vaporMeshesRef.current[i] = el;
    },
    [],
  );

  useFrame(() => {
    const elapsed = elapsedRef.current ?? 0;
    const fade = getFadeFactor(elapsed);

    if (lightRef.current) {
      lightRef.current.intensity = CONFIG.glow.intensity * fade;
    }

    for (let i = 0; i < glowSpritesRef.current.length; i++) {
      const sprite = glowSpritesRef.current[i];
      if (sprite) sprite.material.opacity = CORE_GLOW[i].alpha * fade;
    }

    for (let i = 0; i < vaporMeshesRef.current.length; i++) {
      const mesh = vaporMeshesRef.current[i];
      if (!mesh) continue;
      if (!(mesh.material instanceof THREE.ShaderMaterial)) continue;
      mesh.material.uniforms.uTime.value = elapsed;
      mesh.material.uniforms.uOpacity.value = vapors[i].opacity * fade;
    }
  });

  return (
    <group>
      <pointLight
        ref={lightRef}
        position={glowPosition}
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
          key={layer.id}
          ref={setGlowSpriteRef(i)}
          position={GLOW_SPRITE_POS}
          scale={GLOW_SPRITE_SCALES[i]}
          material={glowMaterials[i]}
          renderOrder={2}
        />
      ))}
      {vapors.map((v, i) => (
        <mesh
          key={`vapor-${v.position.join("-")}-${v.scaleW}-${v.scaleH}`}
          ref={setVaporMeshRef(i)}
          position={v.position}
          scale={vaporScales[i]}
          material={vaporMaterials[i]}
          geometry={unitPlaneGeo}
          renderOrder={1}
        />
      ))}
    </group>
  );
});
