"use client";

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Howl } from "howler";
import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import useSound from "use-sound";
import { useRouter } from "vinext/shims/navigation";

import { startAmbientAudio } from "@/lib/ambient-audio";

import CameraRig from "./scene/CameraRig";
import CentralGlow from "./scene/CentralGlow";
import { CONFIG } from "./scene/config";
import FadeOverlay from "./scene/FadeOverlay";
import FloatingCubes from "./scene/FloatingCubes";
import Lighting from "./scene/Lighting";
import ParticleTrails from "./scene/ParticleTrails";
import PostProcessing from "./scene/PostProcessing";
import PrismField from "./scene/PrismField";
import { startSceneSound } from "./sceneAudio";
import { navigateWithTransition } from "./shared/navigate-with-transition";

function SceneContent({ elapsedRef }: { elapsedRef: RefObject<number> }) {
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
  const router = useRouter();
  const elapsedRef = useRef(0);
  const soundStartedRef = useRef(false);
  const soundPositionSyncedRef = useRef(false);
  const soundRef = useRef<Howl | null>(null);
  const [play, { sound }] = useSound("/sound/ps2-startup-bgm.mp3", {
    volume: 1.0,
    onend: () => {
      soundStartedRef.current = false;
      soundPositionSyncedRef.current = false;
    },
    onplay: () => {
      soundStartedRef.current = true;
      if (!soundPositionSyncedRef.current) {
        soundRef.current?.seek(elapsedRef.current);
        soundPositionSyncedRef.current = true;
      }
    },
    onplayerror: () => {
      soundStartedRef.current = false;
    },
    onstop: () => {
      soundStartedRef.current = false;
      soundPositionSyncedRef.current = false;
    },
  });

  useEffect(() => {
    soundRef.current = (sound as Howl | null) ?? null;
  }, [sound]);

  useEffect(() => {
    const howl = sound as Howl | null;
    return () => {
      howl?.stop();
    };
  }, [sound]);

  useEffect(() => {
    startAmbientAudio();
  }, []);

  useEffect(() => {
    let raf: number;
    const check = () => {
      if (elapsedRef.current >= CONFIG.timeline.duration) {
        navigateWithTransition(router, "/menu");
        return;
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [router]);

  useEffect(() => {
    const nextState = startSceneSound({
      elapsed: elapsedRef.current,
      hasStarted: soundStartedRef.current,
      hasSyncedPosition: soundPositionSyncedRef.current,
      play,
      sound: sound as Howl | null,
    });
    soundStartedRef.current = nextState.hasStarted;
    soundPositionSyncedRef.current = nextState.hasSyncedPosition;
  }, [play, sound]);

  const handleStartSound = useCallback(() => {
    if (soundStartedRef.current) return;
    // Reset sync flag so onplay will seek to the current animation position
    soundPositionSyncedRef.current = false;
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
    <div
      style={{ position: "relative", width: "100vw", height: "100vh", cursor: "pointer" }}
      onClick={handleStartSound}
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
        <SceneContent elapsedRef={elapsedRef} />
      </Canvas>
      <FadeOverlay getOpacity={getOverlayOpacity} />
    </div>
  );
}
