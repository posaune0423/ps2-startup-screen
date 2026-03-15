"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "vinext/shims/navigation";

import GlowCursor from "@/components/shared/glow-cursor";
import { navigateWithTransition } from "@/components/shared/navigate-with-transition";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
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

function MemoryCardModel({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/3d/memorycard.glb");

  return <Clone object={scene} position={position} scale={[1, 1, 1]} rotation={[-0.3, Math.PI / 2, 0.5]} />;
}

function CameraAdjust({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.y = isMobile ? 0.5 : 1.5;
    camera.lookAt(0, 0, 0);
  }, [camera, isMobile]);
  return null;
}

function BrowserScene({ activeIndex, isMobile }: { activeIndex: number; isMobile: boolean }) {
  const cursorPosition = useMemo((): [number, number, number] => [...CARD_POSITIONS[activeIndex]], [activeIndex]);

  return (
    <>
      <CameraAdjust isMobile={isMobile} />
      <color attach="background" args={["#989896"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[-3, 4, 2]} intensity={1.2} color="#FFFFFF" />
      <spotLight position={[-4, 6, 3]} angle={0.4} penumbra={0.6} intensity={0.8} color="#FFFBE6" />

      <Suspense fallback={null}>
        {CARD_POSITIONS.map((pos, i) => (
          <MemoryCardModel key={i} position={pos} />
        ))}
      </Suspense>

      <GlowCursor position={cursorPosition} color="#75D9EB" scale={0.8} />
    </>
  );
}

export default function BrowserPage() {
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

  useSelectSound(activeIndex, playSelect);

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }} style={{ width: "100%", height: "100%" }}>
        <BrowserScene activeIndex={activeIndex} isMobile={compact} />
      </Canvas>

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
