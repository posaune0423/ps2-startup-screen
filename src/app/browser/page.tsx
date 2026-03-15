"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { useRouter } from "vinext/shims/navigation";

import GlowCursor from "@/components/shared/glow-cursor";
import { navigateWithTransition } from "@/components/shared/navigate-with-transition";
import Ps2BrowserBg from "@/components/shared/ps2-browser-bg";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { startAmbientAudio } from "@/lib/ambient-audio";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";

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

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function MemoryCardModel({
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
    <group ref={groupRef} position={[position[0], position[1] + ANIM_OFFSET_Y, position[2]]} scale={0}>
      <Clone object={scene} rotation={[-0.3, Math.PI / 2, 0.5]} />
    </group>
  );
}

function CameraAdjust({ isMobile }: { isMobile: boolean }) {
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
}

function BrowserScene({ activeIndex, isMobile }: { activeIndex: number; isMobile: boolean }) {
  const positions = isMobile ? CARD_POSITIONS_MOBILE : CARD_POSITIONS;
  const cursorPosition = useMemo((): [number, number, number] => [...positions[activeIndex]], [positions, activeIndex]);

  return (
    <>
      <CameraAdjust isMobile={isMobile} />
      <Ps2BrowserBg />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-5, 6, 3]} intensity={1.6} color="#FFFFFF" />
      <spotLight position={[-6, 8, 4]} angle={0.5} penumbra={0.7} intensity={0.9} color="#FFFBE6" />
      <pointLight position={[4, -2, 2]} intensity={0.3} color="#8A8A88" distance={15} decay={2} />

      <Suspense fallback={null}>
        {positions.map((pos, i) => (
          <MemoryCardModel key={i} position={pos} scale={isMobile ? 0.7 : 1} index={i} />
        ))}
      </Suspense>

      <GlowCursor position={cursorPosition} color="#75D9EB" scale={isMobile ? 0.5 : 0.8} />
    </>
  );
}

export default function BrowserPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const { playEnter, playSelect, playBack } = useNavigationSound();
  const { t } = useLanguage();
  const { isMobile, isPortrait } = useViewport();
  const compact = isMobile || isPortrait;

  const handleSelect = useCallback(
    (index: number) => {
      playEnter();
      navigateWithTransition(router, CARDS[index].href);
    },
    [router, playEnter],
  );

  const handleBack = useCallback(() => {
    playBack();
    router.back();
  }, [router, playBack]);

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

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      {mounted && (
        <Canvas camera={{ position: [0, 1.5, 5.5], fov: 45 }} style={{ width: "100%", height: "100%" }}>
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
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
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
          inset: 0,
          display: "flex",
          zIndex: 5,
        }}
      >
        {CARDS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => selectByIndex(i)}
            style={{
              flex: 1,
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
