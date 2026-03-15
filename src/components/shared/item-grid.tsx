"use client";

import { Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useRouter } from "vinext/shims/navigation";

import GlowCursor from "@/components/shared/glow-cursor";
import { navigateWithTransition } from "@/components/shared/navigate-with-transition";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { createGlowTexture } from "@/lib/glowTexture";

export interface GridItem {
  id: string;
  label: string;
  modelPath: string;
  href: string;
}

interface ItemGridProps {
  items: GridItem[];
}

const ITEM_SPACING = 2.2;

function PlaceholderBox({
  position,
  label,
  isActive,
}: {
  position: [number, number, number];
  label: string;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color={isActive ? "#8BE8FF" : "#46506A"}
          emissive={isActive ? "#63D8FF" : "#0E1220"}
          emissiveIntensity={isActive ? 0.32 : 0.04}
          roughness={0.28}
          metalness={0.3}
        />
      </mesh>

      <Text
        position={[0, -0.8, 0]}
        fontSize={0.18}
        color={isActive ? "#75D9EB" : "#999999"}
        anchorX="center"
        anchorY="top"
        font="/fonts/HelveticaNeue-Light.woff"
        maxWidth={1.8}
        textAlign="center"
      >
        {label}
      </Text>
    </group>
  );
}

function BackgroundHaze() {
  const tex = useMemo(() => createGlowTexture(512), []);

  const mats = useMemo(
    () => [
      new THREE.SpriteMaterial({
        map: tex,
        color: "#3A4A7A",
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      new THREE.SpriteMaterial({
        map: tex,
        color: "#2A3560",
        transparent: true,
        opacity: 0.46,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      new THREE.SpriteMaterial({
        map: tex,
        color: "#81A2FF",
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ],
    [tex],
  );

  return (
    <group>
      <sprite position={[-5, 4, -10]} scale={[22, 22, 1]} material={mats[0]} />
      <sprite position={[-2, 2, -12]} scale={[16, 16, 1]} material={mats[1]} />
      <sprite position={[2.5, 1.5, -11]} scale={[10, 10, 1]} material={mats[2]} />
    </group>
  );
}

function GridScene({ items, activeIndex }: { items: GridItem[]; activeIndex: number }) {
  const totalWidth = (items.length - 1) * ITEM_SPACING;
  const offsetX = -totalWidth / 2;

  const cursorPosition = useMemo(
    (): [number, number, number] => [offsetX + activeIndex * ITEM_SPACING, 0.8, 0],
    [activeIndex, offsetX],
  );

  return (
    <>
      <color attach="background" args={["#050510"]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[-4, 5, 4]} intensity={1.55} color="#89A8FF" />
      <spotLight position={[0, 5, 5]} angle={0.52} penumbra={0.85} intensity={1.15} color="#DCE6FF" />
      <pointLight position={[-6, 5, 2]} intensity={1.05} color="#4A5AA8" distance={20} decay={2} />
      <pointLight position={[4, -1, 3]} intensity={0.65} color="#243A7A" distance={18} decay={2} />
      <BackgroundHaze />

      {items.map((item, i) => (
        <PlaceholderBox
          key={item.id}
          position={[offsetX + i * ITEM_SPACING, 0, 0]}
          label={item.label}
          isActive={i === activeIndex}
        />
      ))}

      <GlowCursor position={cursorPosition} color="#75D9EB" scale={0.6} />
    </>
  );
}

export default function ItemGrid({ items }: ItemGridProps) {
  const router = useRouter();
  const { playEnter, playSelect, playBack } = useNavigationSound();
  const { isMobile } = useViewport();

  const handleSelect = useCallback(
    (index: number) => {
      playEnter();
      navigateWithTransition(router, items[index].href, { external: true });
    },
    [router, playEnter, items],
  );

  const handleBack = useCallback(() => {
    playBack();
    router.back();
  }, [router, playBack]);

  const { activeIndex, selectByIndex } = useMenuNavigation({
    itemCount: items.length,
    direction: "horizontal",
    onSelect: handleSelect,
    onBack: handleBack,
  });

  const prevIndexRef = useRef(activeIndex);
  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      playSelect();
      prevIndexRef.current = activeIndex;
    }
  }, [activeIndex, playSelect]);

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      <Canvas camera={{ position: [0, 0.5, isMobile ? 10 : 5], fov: 45 }} style={{ width: "100%", height: "100%" }}>
        <GridScene items={items} activeIndex={activeIndex} />
      </Canvas>

      <div
        style={{
          position: "fixed",
          bottom: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: isMobile ? "clamp(12px, 4vw, 24px)" : "40px",
          zIndex: 10,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "90vw",
        }}
      >
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectByIndex(i)}
            style={{
              background: "none",
              border: "none",
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: "clamp(12px, 2vw, 14px)",
              fontWeight: 300,
              color: i === activeIndex ? "#75D9EB" : "#4D4D4D",
              cursor: "pointer",
              transition: "color 0.2s ease",
              padding: "4px 8px",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
