"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CONFIG } from "./config";
import { getFadeFactor } from "./timeline";
import { createGlowTexture } from "@/lib/glowTexture";
import { generateVaporSprites } from "./cloudLayout";
import { createCloudFogMaterial } from "@/shaders/cloudFog";

const CORE_GLOW = [
  { scale: 3, alpha: 0.35 },
  { scale: 6, alpha: 0.12 },
];

export default function CentralGlow({ elapsedRef }: { elapsedRef: React.RefObject<number> }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const glowSpritesRef = useRef<THREE.Sprite[]>([]);
  const vaporMeshesRef = useRef<THREE.Mesh[]>([]);

  const glowTexture = useMemo(() => createGlowTexture(), []);

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

  useFrame(() => {
    const elapsed = elapsedRef.current ?? 0;
    const fade = getFadeFactor(elapsed);

    if (lightRef.current) {
      lightRef.current.intensity = CONFIG.glow.intensity * fade;
    }

    glowSpritesRef.current.forEach((sprite, i) => {
      if (sprite) {
        sprite.material.opacity = CORE_GLOW[i].alpha * fade;
      }
    });

    vaporMeshesRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = elapsed;
      mat.uniforms.uOpacity.value = vapors[i].opacity * fade;
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
      {vapors.map((v, i) => (
        <mesh
          key={`vapor-${i}`}
          ref={(el) => {
            if (el) vaporMeshesRef.current[i] = el;
          }}
          position={v.position}
          scale={[v.scaleW, v.scaleH, 1]}
          material={vaporMaterials[i]}
          renderOrder={1}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}
