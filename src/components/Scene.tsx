"use client";

import { useCallback, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import { CONFIG } from "./scene/config";
import PrismField from "./scene/PrismField";
import Lighting from "./scene/Lighting";
import CameraRig from "./scene/CameraRig";
import CentralGlow from "./scene/CentralGlow";
import FloatingCubes from "./scene/FloatingCubes";
import ParticleTrails from "./scene/ParticleTrails";
import FadeOverlay from "./scene/FadeOverlay";
import PostProcessing from "./scene/PostProcessing";

function SceneContent({ elapsedRef }: { elapsedRef: React.MutableRefObject<number> }) {
  const sceneGroupRef = useRef<THREE.Group>(null);

  return (
    <>
      <color attach="background" args={["#1A1A1A"]} />
      <CameraRig elapsedRef={elapsedRef} sceneGroupRef={sceneGroupRef} />
      <Environment preset="warehouse" background={false} environmentIntensity={0.25} />
      <group ref={sceneGroupRef}>
        <Lighting elapsedRef={elapsedRef} />
        <CentralGlow elapsedRef={elapsedRef} />
        <PrismField />
        <FloatingCubes />
        <ParticleTrails elapsedRef={elapsedRef} />
      </group>
      <PostProcessing />
    </>
  );
}

export default function Scene() {
  const elapsedRef = useRef(0);

  const [play] = useSound("/sound/ps2-startup-bgm.mp3", { volume: 1.0 });

  useEffect(() => {
    play();
  }, [play]);

  const getOverlayOpacity = useCallback(() => {
    const elapsed = elapsedRef.current;
    const { rushStart, duration } = CONFIG.timeline;
    if (elapsed < rushStart) return 0;
    const t = Math.min((elapsed - rushStart) / (duration - rushStart), 1.0);
    return t * t * (3 - 2 * t);
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <Canvas
        shadows
        dpr={CONFIG.render.dpr}
        gl={{ antialias: false, alpha: false }}
        camera={{ fov: 50, near: 0.1, far: 100 }}
        scene={{ background: new THREE.Color("#1A1A1A") }}
        style={{ width: "100%", height: "100%" }}
      >
        <SceneContent elapsedRef={elapsedRef} />
      </Canvas>
      <FadeOverlay getOpacity={getOverlayOpacity} />
    </div>
  );
}
