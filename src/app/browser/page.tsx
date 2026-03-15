"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";

import GlowCursor from "@/components/shared/glow-cursor";
import Ps2BrowserBg from "@/components/shared/ps2-browser-bg";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { startAmbientAudio } from "@/lib/ambient-audio";
import { releaseGLTFAsset } from "@/lib/gltf-memory";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import { navigate } from "@/lib/navigate";

const CARDS = [
  { labelKey: "browser.memoryCardWork" as TranslationKey, href: "/memory/work" },
  { labelKey: "browser.memoryCardSns" as TranslationKey, href: "/memory/sns" },
] as const;

const CARD_POSITIONS: Array<[number, number, number]> = [
  [-0.5, 0, 0],
  [0.5, 0, 0],
];

const CARD_POSITIONS_MOBILE: Array<[number, number, number]> = [
  [-0.3, 0, 0],
  [0.3, 0, 0],
];

const ANIM_DURATION = 0.8;
const ANIM_STAGGER = 0.15;
const ANIM_OFFSET_Y = -0.5;
const CLONE_ROTATION: [number, number, number] = [-0.3, Math.PI / 2, 0.5];

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

const MemoryCardModel = memo(function MemoryCardModel({
  position,
  scale = 1,
  index = 0,
}: {
  position: [number, number, number];
  scale?: number;
  index?: number;
}) {
  const { scene } = useGLTF("/3d/memorycard.glb");
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const delay = index * ANIM_STAGGER;
  const clearGLTF = useCallback((path: string) => {
    useGLTF.clear(path);
  }, []);

  const initPos = useMemo(
    (): [number, number, number] => [position[0], position[1] + ANIM_OFFSET_Y, position[2]],
    [position],
  );

  useEffect(() => {
    return () => {
      releaseGLTFAsset("/3d/memorycard.glb", scene, clearGLTF);
    };
  }, [clearGLTF, scene]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = Math.min(1, Math.max(0, (elapsed.current - delay) / ANIM_DURATION));
    const eased = easeOutCubic(t);

    if (groupRef.current) {
      groupRef.current.position.y = position[1] + ANIM_OFFSET_Y * (1 - eased);
      groupRef.current.scale.setScalar(scale * eased);
    }
  });

  return (
    <group ref={groupRef} position={initPos} scale={0}>
      <Clone object={scene} rotation={CLONE_ROTATION} />
    </group>
  );
});

const CameraAdjust = memo(function CameraAdjust({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    if (isMobile) {
      camera.position.set(0, 0.3, 3.5);
    } else {
      camera.position.set(0, 1.2, 5.5);
    }
    camera.lookAt(0, 0, 0);
  }, [camera, isMobile]);
  return null;
});

const DIR_LIGHT_POS: [number, number, number] = [-4.5, 6.5, 4.5];
const SPOT_LIGHT_POS: [number, number, number] = [-4, 7.5, 5.5];
const POINT_LIGHT_POS: [number, number, number] = [3.5, 1.2, 4.2];
const HEMI_ARGS: [string, string, number] = ["#F6F9FF", "#070910", 0.75];

const BrowserScene = memo(function BrowserScene({ activeIndex, isMobile }: { activeIndex: number; isMobile: boolean }) {
  const positions = isMobile ? CARD_POSITIONS_MOBILE : CARD_POSITIONS;
  const cursorPosition = useMemo((): [number, number, number] => [...positions[activeIndex]], [positions, activeIndex]);

  return (
    <>
      <CameraAdjust isMobile={isMobile} />
      <Ps2BrowserBg />
      <ambientLight intensity={0.46} />
      <hemisphereLight args={HEMI_ARGS} />
      <directionalLight position={DIR_LIGHT_POS} intensity={2.1} color="#D6E0FF" />
      <spotLight position={SPOT_LIGHT_POS} angle={0.6} penumbra={0.84} intensity={1.3} color="#FFFDF4" />
      <pointLight position={POINT_LIGHT_POS} intensity={0.9} color="#7FA9FF" distance={18} decay={1.7} />

      <Suspense fallback={null}>
        {CARDS.map((card, index) => (
          <MemoryCardModel key={card.href} position={positions[index]} scale={isMobile ? 0.7 : 1} index={index} />
        ))}
      </Suspense>

      <GlowCursor position={cursorPosition} color="#75D9EB" scale={isMobile ? 0.5 : 0.8} />
    </>
  );
});

const GL_PROPS = { antialias: false, alpha: false, powerPreference: "low-power" as const };
const CANVAS_STYLE = { width: "100%", height: "100%" } as const;
const CAMERA_PROPS = { position: [0, 1.5, 5.5] as [number, number, number], fov: 45 };

export default function BrowserPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
    itemCount: CARDS.length,
    direction: "horizontal",
    onSelect: handleSelect,
    onBack: handleBack,
  });

  useEffect(() => {
    startAmbientAudio();
  }, []);

  useSelectSound(activeIndex, playSelect);

  const selectHandlers = useMemo(() => CARDS.map((_, i) => () => selectByIndex(i)), [selectByIndex]);

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      {mounted && (
        <Canvas camera={CAMERA_PROPS} dpr={compact ? 0.8 : 1} gl={GL_PROPS} style={CANVAS_STYLE}>
          <BrowserScene activeIndex={activeIndex} isMobile={compact} />
        </Canvas>
      )}

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
          display: "flex",
          gap: compact ? "24px" : "48px",
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
            }}
          />
        ))}
      </div>
    </div>
  );
}

function useSelectSound(activeIndex: number, playSelect: () => void) {
  const prevRef = useRef(activeIndex);

  useEffect(() => {
    if (prevRef.current !== activeIndex) {
      playSelect();
      prevRef.current = activeIndex;
    }
  }, [activeIndex, playSelect]);
}
