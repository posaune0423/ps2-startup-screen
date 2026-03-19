"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { memo, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import GlowCursor from "@/components/shared/glow-cursor";
import { SHOW_THREE_SCENE_HELPER, ThreeSceneHelperPanel } from "@/components/shared/three-scene-helper-panel";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { startAmbientAudio } from "@/lib/ambient-audio";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import { navigate } from "@/lib/navigate";

interface BrowserCard {
  href: string;
  label: string;
  labelKey: TranslationKey;
  modelPath: string;
  modelScaleDesktop: number;
  modelScaleMobile: number;
  rotation: [number, number, number];
  normalizeScale?: boolean;
}

const CARDS = [
  {
    href: "/memory/work",
    label: "Work",
    labelKey: "browser.memoryCardWork",
    modelPath: "/3d/memorycard.glb",
    modelScaleDesktop: 1,
    modelScaleMobile: 0.7,
    normalizeScale: false,
    rotation: [-0.3, Math.PI / 2, 0.5],
  },
  {
    href: "/memory/sns",
    label: "SNS",
    labelKey: "browser.memoryCardSns",
    modelPath: "/3d/memorycard.glb",
    modelScaleDesktop: 1,
    modelScaleMobile: 0.7,
    normalizeScale: false,
    rotation: [-0.3, Math.PI / 2, 0.5],
  },
  {
    href: "/memory/music",
    label: "Audio CD",
    labelKey: "browser.audioCd",
    modelPath: "/3d/icons/cd.glb",
    modelScaleDesktop: 0.95,
    modelScaleMobile: 0.58,
    rotation: [0, Math.PI / 2, 0],
    normalizeScale: true,
  },
] as const satisfies readonly BrowserCard[];
export const BROWSER_CARDS = CARDS;

const ANIM_DURATION = 0.8;
const ANIM_STAGGER = 0.15;
const ANIM_OFFSET_Y = -0.5;
const MOBILE_CARD_POSITIONS: [number, number, number][] = [
  [-0.34, 0.24, 0],
  [0.34, 0.24, 0],
  [0, -0.28, 0],
];

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function createHorizontalPositions(itemCount: number, spacing: number): [number, number, number][] {
  const centerOffset = (itemCount - 1) / 2;
  return Array.from({ length: itemCount }, (_, index): [number, number, number] => [
    (index - centerOffset) * spacing,
    0,
    0,
  ]);
}

export function getBrowserCardPositions(isMobile: boolean) {
  return isMobile ? MOBILE_CARD_POSITIONS : createHorizontalPositions(CARDS.length, 0.92);
}

const GenericCardModel = memo(function GenericCardModel({
  position,
  modelPath,
  modelScale = 1,
  modelRotation,
  normalizeScale = false,
  index = 0,
  active = true,
}: {
  position: [number, number, number];
  modelPath: string;
  modelScale?: number;
  modelRotation: [number, number, number];
  normalizeScale?: boolean;
  index?: number;
  active?: boolean;
}) {
  const { scene } = useGLTF(modelPath);
  const invalidate = useThree((state) => state.invalidate);
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const settledRef = useRef(false);
  const prevActiveRef = useRef<boolean | null>(null);
  const delay = index * ANIM_STAGGER;

  const initPos = useMemo(
    (): [number, number, number] => [position[0], position[1] + ANIM_OFFSET_Y, position[2]],
    [position],
  );

  const normalizedScale = useMemo(() => {
    if (!normalizeScale) return 1;
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim <= 0) return 1;
    return 1 / maxDim;
  }, [normalizeScale, scene]);

  useEffect(() => {
    if (active && prevActiveRef.current === false) {
      elapsed.current = 0;
      settledRef.current = false;
      if (groupRef.current) {
        groupRef.current.scale.setScalar(0);
        groupRef.current.position.y = position[1] + ANIM_OFFSET_Y;
      }
      invalidate();
    }
    prevActiveRef.current = active;
  }, [active, invalidate, position]);

  useFrame((_, delta) => {
    if (settledRef.current) return;

    elapsed.current += delta;
    const t = Math.min(1, Math.max(0, (elapsed.current - delay) / ANIM_DURATION));
    const eased = easeOutCubic(t);

    if (groupRef.current) {
      groupRef.current.position.y = position[1] + ANIM_OFFSET_Y * (1 - eased);
      groupRef.current.scale.setScalar(modelScale * normalizedScale * eased);
    }

    if (t < 1) {
      invalidate();
      return;
    }

    settledRef.current = true;
  });

  return (
    <group ref={groupRef} position={initPos} scale={0}>
      <Clone object={scene} rotation={modelRotation} />
    </group>
  );
});

const CameraAdjust = memo(function CameraAdjust({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    if (isMobile) {
      camera.position.set(0, 0.7, 3.5);
    } else {
      camera.position.set(0, 2.0, 5.5);
    }
    camera.lookAt(0, 0, 0);
  }, [camera, isMobile]);
  return null;
});

const DIR_LIGHT_POS: [number, number, number] = [-4.5, 6.5, 4.5];
const SPOT_LIGHT_POS: [number, number, number] = [-4, 7.5, 5.5];
const POINT_LIGHT_POS: [number, number, number] = [3.5, 1.2, 4.2];
const HEMI_ARGS: [string, string, number] = ["#F6F9FF", "#070910", 0.9];

export const BrowserStage = memo(function BrowserStage({
  activeIndex,
  isMobile,
  active = true,
}: {
  activeIndex: number;
  isMobile: boolean;
  active?: boolean;
}) {
  const positions = useMemo(() => getBrowserCardPositions(isMobile), [isMobile]);
  const cursorPosition = useMemo((): [number, number, number] => [...positions[activeIndex]], [positions, activeIndex]);

  return (
    <>
      <CameraAdjust isMobile={isMobile} />
      <ambientLight intensity={0.58} />
      <hemisphereLight args={HEMI_ARGS} />
      <directionalLight position={DIR_LIGHT_POS} intensity={2.6} color="#D6E0FF" />
      <spotLight position={SPOT_LIGHT_POS} angle={0.6} penumbra={0.84} intensity={1.6} color="#FFFDF4" />
      <pointLight position={POINT_LIGHT_POS} intensity={1.15} color="#7FA9FF" distance={18} decay={1.7} />

      <Suspense fallback={null}>
        {CARDS.map((card, index) => {
          const modelScale = isMobile ? card.modelScaleMobile : card.modelScaleDesktop;

          return (
            <GenericCardModel
              key={card.href}
              position={positions[index]}
              modelPath={card.modelPath}
              modelScale={modelScale}
              modelRotation={card.rotation}
              normalizeScale={card.normalizeScale}
              index={index}
              active={active}
            />
          );
        })}
      </Suspense>

      <GlowCursor position={cursorPosition} color="#75D9EB" scale={isMobile ? 0.5 : 0.8} />
    </>
  );
});

export function BrowserMemoryCardDebugPanel({ activeIndex, isMobile }: { activeIndex: number; isMobile: boolean }) {
  const positions = useMemo(() => getBrowserCardPositions(isMobile), [isMobile]);

  return (
    <ThreeSceneHelperPanel
      axesSize={2.4}
      cameraPosition={[0, 0, 7.2]}
      cameraUp={[0, 1, 0]}
      lookAt={[0, 0, 0]}
      panelStyle={{ bottom: "24px", left: "24px" }}
      plane="xy"
      size={6}
      divisions={10}
    >
      {positions.map((position, index) => {
        const card = CARDS[index];
        const isActive = index === activeIndex;
        if (!card) return null;

        return (
          <group key={card.href} position={position}>
            <mesh position={[0, 0, 0.08]}>
              <boxGeometry args={[0.6, 0.42, 0.16]} />
              <meshStandardMaterial
                color={isActive ? "#9FE7FF" : "#6E7C97"}
                emissive={isActive ? "#3FA9D8" : "#101726"}
                emissiveIntensity={isActive ? 0.42 : 0.08}
                opacity={0.9}
                transparent
              />
            </mesh>
            <mesh position={[0, -0.42, 0.06]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial
                color={isActive ? "#F5FD74" : "#C7D0E2"}
                emissive={isActive ? "#D5E15B" : "#0C111A"}
              />
            </mesh>
          </group>
        );
      })}
    </ThreeSceneHelperPanel>
  );
}

const GL_PROPS = { antialias: false, alpha: true, powerPreference: "low-power" as const };
const CANVAS_STYLE = { width: "100%", height: "100%" } as const;
const CAMERA_PROPS = { position: [0, 2.2, 5.5] as [number, number, number], fov: 45 };

export function BrowserScreen({ active = true }: { active?: boolean }) {
  const { playEnter, playSelect, playBack } = useNavigationSound();
  const { t } = useLanguage();
  const { isMobile, isPortrait } = useViewport();
  const compact = isMobile || isPortrait;

  const handleSelect = useCallback(
    (index: number) => {
      const card = CARDS[index];
      if (!card) return;
      playEnter();
      navigate(card.href);
    },
    [playEnter],
  );

  const handleBack = useCallback(() => {
    playBack();
    navigate("/menu");
  }, [playBack]);

  const { activeIndex, selectByIndex } = useMenuNavigation({
    screenId: "browser",
    itemCount: CARDS.length,
    direction: "horizontal",
    onSelect: handleSelect,
    onBack: handleBack,
    onMove: playSelect,
    enabled: active,
  });

  useEffect(() => {
    if (!active) return;
    startAmbientAudio();
  }, [active]);

  const selectHandlers = useMemo(() => CARDS.map((_, i) => () => selectByIndex(i)), [selectByIndex]);

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      <Canvas
        camera={CAMERA_PROPS}
        dpr={compact ? 0.8 : 1}
        frameloop="demand"
        resize={{ offsetSize: true }}
        gl={GL_PROPS}
        style={CANVAS_STYLE}
      >
        <BrowserStage activeIndex={activeIndex} isMobile={compact} active={active} />
      </Canvas>
      {SHOW_THREE_SCENE_HELPER ? <BrowserMemoryCardDebugPanel activeIndex={activeIndex} isMobile={compact} /> : null}

      <div
        style={{
          position: "absolute",
          top: "clamp(16px, 4vh, 40px)",
          right: "clamp(16px, 4vw, 48px)",
          textAlign: "right",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div
          className="ps2-text"
          style={{
            fontSize: "clamp(16px, 3vw, 36px)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#C5CF1F",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            transformOrigin: "right center",
          }}
        >
          {t(CARDS[activeIndex].labelKey)} / {CARDS.length}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: compact ? "grid" : "flex",
          gap: compact ? "18px 20px" : "48px",
          gridTemplateColumns: compact ? "repeat(2, minmax(0, 1fr))" : undefined,
          justifyItems: compact ? "center" : undefined,
          width: compact ? "min(220px, calc(100vw - 40px))" : undefined,
          zIndex: 5,
        }}
      >
        {CARDS.map((card, index) => (
          <button
            key={card.href}
            type="button"
            onClick={selectHandlers[index]}
            style={{
              width: compact ? "100px" : "140px",
              height: compact ? "120px" : "160px",
              background: "none",
              border: "none",
              cursor: "pointer",
              gridColumn: compact && index === CARDS.length - 1 ? "1 / span 2" : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
