"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

function SceneContent() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75} />
      <OrbitControls enableDamping />

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4488ff" />
      </mesh>

      <gridHelper args={[10, 10, "#444444", "#222222"]} />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      style={{ width: "100vw", height: "100vh", background: "#000000" }}
    >
      <SceneContent />
    </Canvas>
  );
}
