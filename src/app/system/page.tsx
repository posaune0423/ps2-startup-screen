"use client";

import { Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import type * as THREE from "three";
import { useRouter } from "vinext/shims/navigation";

import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import HexFlower from "@/components/system/hex-flower";
import SystemMenu from "@/components/system/system-menu";
import { createRingFogMaterial } from "@/shaders/ringFog";

function BackgroundHaze() {
  const mats = useMemo(
    () => [
      // メイン紫リング霧 (#433767 ベース)
      createRingFogMaterial({
        color: "#433767",
        opacity: 0.95,
        noiseScale: 2.2,
        scrollSpeed1: [0.01, -0.007],
        scrollSpeed2: [-0.008, 0.009],
        fbmStrength: 0.28,
        innerRadius: 0.22,
        outerRadius: 0.88,
        ringWidth: 0.22,
      }),
      // 外側の深い紫 — 広くぼんやり
      createRingFogMaterial({
        color: "#2A2040",
        opacity: 0.7,
        noiseScale: 1.8,
        scrollSpeed1: [-0.006, 0.005],
        scrollSpeed2: [0.007, -0.006],
        fbmStrength: 0.35,
        innerRadius: 0.18,
        outerRadius: 0.95,
        ringWidth: 0.28,
      }),
      // 明るめ紫 — 霧の薄い層
      createRingFogMaterial({
        color: "#6650A0",
        opacity: 0.5,
        noiseScale: 3.0,
        scrollSpeed1: [0.014, 0.006],
        scrollSpeed2: [-0.011, -0.008],
        fbmStrength: 0.2,
        innerRadius: 0.28,
        outerRadius: 0.78,
        ringWidth: 0.18,
      }),
    ],
    [],
  );

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    mats.forEach((mat) => {
      mat.uniforms.uTime.value = t;
    });
  });

  return (
    <group>
      <mesh
        ref={(el) => {
          meshRefs.current[0] = el;
        }}
        position={[0, 0, -12]}
        scale={[34, 34, 1]}
        material={mats[0]}
      >
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh
        ref={(el) => {
          meshRefs.current[1] = el;
        }}
        position={[0, 0, -15]}
        scale={[46, 46, 1]}
        material={mats[1]}
      >
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh
        ref={(el) => {
          meshRefs.current[2] = el;
        }}
        position={[0, 0, -11]}
        scale={[28, 28, 1]}
        material={mats[2]}
      >
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}

function SystemScene() {
  return (
    <>
      <color attach="background" args={["#0D0A18"]} />
      {/* IBL環境マップ — ガラス反射の光源 */}
      <Environment preset="studio" environmentIntensity={0.5} />
      {/* メインライト — #0249A6 青系で手前から */}
      <pointLight position={[-2, 2, 5]} intensity={8} color="#FFFFFF" distance={18} decay={2} />
      <pointLight position={[-2.5, 0, 4]} intensity={5} color="#3080FF" distance={14} decay={2} />
      <pointLight position={[-4, -2, 3]} intensity={3} color="#0249A6" distance={10} decay={2} />
      {/* プリズム分散カラーライト */}
      <pointLight position={[-5, 1, 3]} intensity={2} color="#FF6090" distance={10} decay={2} />
      <pointLight position={[1, 3, 3]} intensity={2} color="#60C8FF" distance={10} decay={2} />
      <pointLight position={[-2, -3, 2]} intensity={1.5} color="#80FF90" distance={8} decay={2} />
      <pointLight position={[0, 0, 4]} intensity={1.2} color="#D080FF" distance={8} decay={2} />
      {/* 奥を暗くするために ambient は最小限 */}
      <ambientLight intensity={0.05} color="#0D0A18" />
      <BackgroundHaze />
      <HexFlower />
    </>
  );
}

export default function SystemPage() {
  const router = useRouter();
  const { playBack } = useNavigationSound();

  const handleBack = useCallback(() => {
    playBack();
    router.back();
  }, [router, playBack]);

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} style={{ width: "100%", height: "100%" }}>
        <SystemScene />
      </Canvas>
      <SystemMenu onBack={handleBack} />
    </div>
  );
}
