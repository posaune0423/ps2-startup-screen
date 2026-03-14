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

function SceneContent({
  elapsedRef,
  playingRef,
}: {
  elapsedRef: React.MutableRefObject<number>;
  playingRef: React.RefObject<boolean>;
}) {
  const sceneGroupRef = useRef<THREE.Group>(null);

  return (
    <>
      <color attach="background" args={["#1A1A1A"]} />
      <CameraRig elapsedRef={elapsedRef} playingRef={playingRef} sceneGroupRef={sceneGroupRef} />
      <Environment preset="warehouse" background={false} environmentIntensity={0.25} />
      <group ref={sceneGroupRef}>
        <Lighting elapsedRef={elapsedRef} />
        <CentralGlow elapsedRef={elapsedRef} />
        <PrismField />
        <FloatingCubes elapsedRef={elapsedRef} />
        <ParticleTrails elapsedRef={elapsedRef} />
      </group>
      <PostProcessing />
    </>
  );
}

export default function Scene() {
  const elapsedRef = useRef(0);
  const playingRef = useRef(false);

  const [play] = useSound("/sound/ps2-startup-bgm.mp3", {
    volume: 1.0,
    onplay: () => {
      elapsedRef.current = 0;
      playingRef.current = true;
    },
  });

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
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
        camera={{ fov: 50, near: 0.1, far: 100 }}
        scene={{ background: new THREE.Color("#1A1A1A") }}
        style={{ width: "100%", height: "100%" }}
      >
        <SceneContent elapsedRef={elapsedRef} playingRef={playingRef} />
      </Canvas>
      <FadeOverlay getOpacity={getOverlayOpacity} />
    </div>
  );
}
