"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useRouter } from "vinext/shims/navigation";

import GlowCursor from "@/components/shared/glow-cursor";
import { navigateWithTransition } from "@/components/shared/navigate-with-transition";
import Ps2BrowserBg from "@/components/shared/ps2-browser-bg";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { startAmbientAudio } from "@/lib/ambient-audio";

export interface GridItem {
  id: string;
  label: string;
  modelPath: string;
  href: string;
}

interface ItemGridProps {
  items: GridItem[];
}

const ITEM_SPACING = 0.8;
const ROW_DEPTH = 0.7;
const TARGET_SIZE = 0.5;
const TARGET_SIZE_MOBILE = 0.6;

// Always 2-row × Z grid (n>2) for isometric depth effect
function calcGridPositions(items: GridItem[]): [number, number, number][] {
  const n = items.length;
  if (n <= 2) {
    const totalW = (n - 1) * ITEM_SPACING;
    return items.map((_, i) => [-totalW / 2 + i * ITEM_SPACING, 0, 0]);
  }
  const cols = Math.ceil(n / 2);
  return items.map((_, i) => {
    const row = i < cols ? 0 : 1;
    const col = i % cols;
    const rowCount = row === 0 ? cols : n - cols;
    const rowTotalW = (rowCount - 1) * ITEM_SPACING;
    const x = -rowTotalW / 2 + col * ITEM_SPACING;
    const z = row === 0 ? -ROW_DEPTH : ROW_DEPTH; // depth via Z axis
    return [x, 0, z];
  });
}

// Set up angled top-down camera perspective
function CameraSetup({ camPos }: { camPos: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...camPos);
    camera.lookAt(0, 0, 0);
  }, [camera, camPos]);
  return null;
}

function GlbModel({ modelPath, isMobile }: { modelPath: string; isMobile: boolean }) {
  const { scene } = useGLTF(modelPath);

  const normalizedScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return 1;
    const target = isMobile ? TARGET_SIZE_MOBILE : TARGET_SIZE;
    return target / maxDim;
  }, [scene, isMobile]);

  return <Clone object={scene} scale={normalizedScale} />;
}

const ANIM_DURATION = 0.8;
const ANIM_STAGGER = 0.12;
const ANIM_OFFSET_Y = -0.6;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function GridItemModel({
  position,
  modelPath,
  onClick,
  index,
  isMobile,
}: {
  position: [number, number, number];
  modelPath: string;
  onClick: () => void;
  index: number;
  isMobile: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const delay = index * ANIM_STAGGER;

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = Math.min(1, Math.max(0, (elapsed.current - delay) / ANIM_DURATION));
    const eased = easeOutCubic(t);

    if (groupRef.current) {
      groupRef.current.position.y = position[1] + ANIM_OFFSET_Y * (1 - eased);
      groupRef.current.scale.setScalar(eased);
    }

    if (!modelPath && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1] + ANIM_OFFSET_Y, position[2]]}
      scale={0}
      onClick={onClick}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {modelPath ? (
        <Suspense fallback={null}>
          <GlbModel modelPath={modelPath} isMobile={isMobile} />
        </Suspense>
      ) : (
        <mesh ref={meshRef} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial
            color="#46506A"
            emissive="#0E1220"
            emissiveIntensity={0.04}
            roughness={0.28}
            metalness={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

function GridScene({
  items,
  activeIndex,
  camPos,
  onItemClick,
  isMobile,
}: {
  items: GridItem[];
  activeIndex: number;
  camPos: [number, number, number];
  onItemClick: (index: number) => void;
  isMobile: boolean;
}) {
  const positions = useMemo(() => calcGridPositions(items), [items]);
  const cursorPos = useMemo((): [number, number, number] => [...positions[activeIndex]], [positions, activeIndex]);

  return (
    <>
      <CameraSetup camPos={camPos} />
      <Ps2BrowserBg />
      <ambientLight intensity={0.8} />
      <directionalLight position={[-5, 6, 3]} intensity={3.0} color="#FFFFFF" />
      <directionalLight position={[5, 4, 2]} intensity={1.5} color="#F0F4FF" />
      <spotLight position={[-6, 8, 4]} angle={0.5} penumbra={0.7} intensity={2.5} color="#FFFBE6" />
      <pointLight position={[0, 3, 4]} intensity={1.5} color="#FFFFFF" distance={20} decay={2} />

      {items.map((item, i) => (
        <GridItemModel
          key={item.id}
          position={positions[i]}
          modelPath={item.modelPath}
          onClick={() => onItemClick(i)}
          index={i}
          isMobile={isMobile}
        />
      ))}

      <GlowCursor position={cursorPos} color="#75D9EB" scale={0.6} />
    </>
  );
}

export default function ItemGrid({ items }: ItemGridProps) {
  const router = useRouter();
  const { playEnter, playSelect, playBack } = useNavigationSound();
  const { isMobile, isPortrait } = useViewport();
  const compact = isMobile || isPortrait;

  // Angled top-down camera position (Z distance scales with item count)
  const camPos = useMemo((): [number, number, number] => {
    const zBase = items.length > 3 ? 6 : 4.5;
    const zScale = compact ? 1.3 : 1;
    return [0, 3.5, zBase * zScale];
  }, [items.length, compact]);

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

  const { activeIndex } = useMenuNavigation({
    itemCount: items.length,
    direction: "horizontal",
    onSelect: handleSelect,
    onBack: handleBack,
  });

  useEffect(() => {
    startAmbientAudio();
  }, []);

  const prevIndexRef = useRef(activeIndex);
  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      playSelect();
      prevIndexRef.current = activeIndex;
    }
  }, [activeIndex, playSelect]);

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      <Canvas camera={{ position: camPos, fov: 50 }} style={{ width: "100%", height: "100%" }}>
        <GridScene
          items={items}
          activeIndex={activeIndex}
          camPos={camPos}
          onItemClick={handleSelect}
          isMobile={compact}
        />
      </Canvas>
    </div>
  );
}
