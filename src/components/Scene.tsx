"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
      <fog attach="fog" args={["#1A1A1A", 4, 12]} />
      <CameraRig elapsedRef={elapsedRef} sceneGroupRef={sceneGroupRef} />
      <Environment preset="studio" background={false} environmentIntensity={0.3} />
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
  const soundStartedRef = useRef(false);
  const [finished, setFinished] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);

  const [play, { stop, sound }] = useSound("/sound/ps2-startup-bgm.mp3", {
    volume: 1.0,
  });

  useEffect(() => {
    let raf: number;
    const check = () => {
      if (elapsedRef.current >= CONFIG.timeline.duration) {
        setFinished(true);
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [sceneKey]);

  const handleInteraction = useCallback(() => {
    if (soundStartedRef.current) return;
    soundStartedRef.current = true;
    play();
    if (sound) {
      sound.seek(elapsedRef.current);
    }
  }, [play, sound]);

  const handleReplay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      stop();
      elapsedRef.current = 0;
      soundStartedRef.current = false;
      setFinished(false);
      setSceneKey((k) => k + 1);
      setTimeout(() => {
        soundStartedRef.current = true;
        play();
      }, 100);
    },
    [stop, play],
  );

  const getOverlayOpacity = useCallback(() => {
    const elapsed = elapsedRef.current;
    const { rushStart, duration } = CONFIG.timeline;
    if (elapsed < rushStart) return 0;
    const t = Math.min((elapsed - rushStart) / (duration - rushStart), 1.0);
    return t * t * (3 - 2 * t);
  }, []);

  return (
    <div
      style={{ position: "relative", width: "100vw", height: "100vh", cursor: "pointer" }}
      onClick={handleInteraction}
    >
      <Canvas
        shadows
        dpr={CONFIG.render.dpr}
        gl={{ antialias: false, alpha: false }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
        camera={{
          fov: 50,
          near: 0.1,
          far: 100,
          position: [0, CONFIG.camera.startHeight, 0],
        }}
        scene={{ background: new THREE.Color("#1A1A1A") }}
        style={{ width: "100%", height: "100%" }}
      >
        <SceneContent key={sceneKey} elapsedRef={elapsedRef} />
      </Canvas>
      <FadeOverlay getOpacity={getOverlayOpacity} />
      {finished && (
        <button
          type="button"
          onClick={handleReplay}
          style={{
            position: "fixed",
            bottom: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: 4,
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 14,
            letterSpacing: "0.2em",
            padding: "10px 28px",
            cursor: "pointer",
            animation: "fade-in 1.5s ease-in",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
          }}
        >
          REPLAY
        </button>
      )}
    </div>
  );
}
