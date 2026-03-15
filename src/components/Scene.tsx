"use client";

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Howl } from "howler";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import useSceneSound from "use-sound";

import { navigate } from "@/lib/navigate";
import { getSoundEnabled, initializeSoundEnabled } from "@/lib/sound-settings";

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

const SceneContent = memo(function SceneContent({ elapsedRef }: { elapsedRef: RefObject<number> }) {
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
});

const GL_PROPS = { antialias: false, alpha: false } as const;
const CANVAS_STYLE = { width: "100%", height: "100%" } as const;
const CONTAINER_STYLE = { position: "relative" as const, width: "100vw", height: "100vh", cursor: "pointer" };

export default function Scene() {
  const elapsedRef = useRef(0);
  const soundStartedRef = useRef(false);
  const soundPositionSyncedRef = useRef(false);
  const soundPlaybackRequestedRef = useRef(false);
  const soundRef = useRef<Howl | null>(null);
  const [play, { sound }] = useSceneSound("/sound/ps2-startup-bgm.mp3", {
    volume: 1.0,
    onend: () => {
      soundStartedRef.current = false;
      soundPositionSyncedRef.current = false;
      soundPlaybackRequestedRef.current = false;
    },
    onplay: () => {
      soundStartedRef.current = true;
      soundPlaybackRequestedRef.current = false;
      soundRef.current?.seek(elapsedRef.current);
      soundPositionSyncedRef.current = true;
    },
    onplayerror: () => {
      soundStartedRef.current = false;
      soundPositionSyncedRef.current = false;
      soundPlaybackRequestedRef.current = false;
    },
    onstop: () => {
      soundStartedRef.current = false;
      soundPositionSyncedRef.current = false;
      soundPlaybackRequestedRef.current = false;
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
    let raf: number;
    const check = () => {
      if (elapsedRef.current >= CONFIG.timeline.duration) {
        navigate("/menu");
        return;
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    initializeSoundEnabled();
    const nextState = startSceneSound({
      elapsed: elapsedRef.current,
      hasStarted: soundStartedRef.current,
      hasSyncedPosition: soundPositionSyncedRef.current,
      hasRequestedPlayback: soundPlaybackRequestedRef.current,
      play,
      sound: sound as Howl | null,
      soundEnabled: getSoundEnabled(),
    });
    soundStartedRef.current = nextState.hasStarted;
    soundPositionSyncedRef.current = nextState.hasSyncedPosition;
    soundPlaybackRequestedRef.current = nextState.hasRequestedPlayback;
  }, [play, sound]);

  const handleStartSound = useCallback(() => {
    initializeSoundEnabled();
    if (!getSoundEnabled()) return;
    if (soundRef.current?.playing()) return;
    if (soundStartedRef.current) return;
    if (soundPlaybackRequestedRef.current) return;
    soundPositionSyncedRef.current = false;
    soundPlaybackRequestedRef.current = true;
    play();
  }, [play]);

  const getOverlayOpacity = useCallback(() => {
    const elapsed = elapsedRef.current;
    const { rushStart, duration } = CONFIG.timeline;
    if (elapsed < rushStart) return 0;
    const t = Math.min((elapsed - rushStart) / (duration - rushStart), 1.0);
    return t * t * (3 - 2 * t);
  }, []);

  const onCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.shadowMap.type = THREE.PCFShadowMap;
  }, []);

  const cameraProps = useMemo(
    () => ({
      fov: 50,
      near: 0.1,
      far: 100,
      position: [0, CONFIG.camera.startHeight, 0] as [number, number, number],
    }),
    [],
  );

  const sceneProps = useMemo(() => ({ background: new THREE.Color("#1A1A1A") }), []);

  return (
    <div style={CONTAINER_STYLE} onClick={handleStartSound}>
      <Canvas
        shadows
        dpr={CONFIG.render.dpr}
        gl={GL_PROPS}
        onCreated={onCreated}
        camera={cameraProps}
        scene={sceneProps}
        style={CANVAS_STYLE}
      >
        <SceneContent elapsedRef={elapsedRef} />
      </Canvas>
      <FadeOverlay getOpacity={getOverlayOpacity} />
    </div>
  );
}
