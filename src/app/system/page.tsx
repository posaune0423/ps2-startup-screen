"use client";

import { Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";

import { ThreeSceneHelperPanel } from "@/components/shared/three-scene-helper-panel";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import HexFlower from "@/components/system/hex-flower";
import SystemMenu from "@/components/system/system-menu";
import { startAmbientAudio } from "@/lib/ambient-audio";
import { navigate } from "@/lib/navigate";
import { createRingFogMaterial } from "@/shaders/ringFog";

function BackgroundHaze() {
  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const mats = useMemo(
    () => [
      // Main purple ring fog (#433767 base)
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
      // Outer deep purple — wide and diffuse
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
      // Lighter purple — thin fog layer
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

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    mats.forEach((mat) => {
      mat.uniforms.uTime.value = t;
    });
  });

  return (
    <group>
      <mesh position={[0, 0, -12]} scale={[34, 34, 1]} material={mats[0]} geometry={planeGeometry} />
      <mesh position={[0, 0, -15]} scale={[46, 46, 1]} material={mats[1]} geometry={planeGeometry} />
      <mesh position={[0, 0, -11]} scale={[28, 28, 1]} material={mats[2]} geometry={planeGeometry} />
    </group>
  );
}

function SystemScene() {
  return (
    <>
      <color attach="background" args={["#0D0A18"]} />
      {/* IBL — used by MeshTransmissionMaterial for reflections */}
      <Environment preset="studio" environmentIntensity={0.4} />
      {/* 3 lights instead of 7: white key + blue fill + pink accent */}
      <pointLight position={[-2, 2, 5]} intensity={18} color="#FFFFFF" distance={22} decay={2} />
      <pointLight position={[-2.5, 0, 4]} intensity={12} color="#4A90FF" distance={18} decay={2} />
      <pointLight position={[-5, 1, 3]} intensity={6} color="#FF6090" distance={12} decay={2} />
      <ambientLight intensity={0.05} color="#0D0A18" />
      <BackgroundHaze />
      <HexFlower />
    </>
  );
}

export default function SystemPage() {
  const { playBack } = useNavigationSound();

  useEffect(() => {
    startAmbientAudio();
  }, []);

  const handleBack = useCallback(() => {
    playBack();
    navigate("/menu");
  }, [playBack]);

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      >
        <SystemScene />
      </Canvas>
      <ThreeSceneHelperPanel panelStyle={{ bottom: "24px", left: "24px" }} />
      <SystemMenu onBack={handleBack} />
    </div>
  );
}
