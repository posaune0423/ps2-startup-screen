"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { memo, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import GlowCursor from "@/components/shared/glow-cursor";
import { ThreeSceneHelperPanel } from "@/components/shared/three-scene-helper-panel";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { startAmbientAudio } from "@/lib/ambient-audio";
import type { ActiveIndexScreenId } from "@/lib/app-screen";
import { navigate } from "@/lib/navigate";

export interface GridItem {
  id: string;
  label: string;
  modelPath: string;
  href: string;
}

interface ItemGridProps {
  items: GridItem[];
  screenId: ActiveIndexScreenId;
  title: string;
  active?: boolean;
}

const ITEM_SPACING = 0.8;
const ROW_DEPTH = 0.7;
const TARGET_SIZE = 0.5;
const TARGET_SIZE_MOBILE = 0.6;
const NORMALIZED_SCALE_CACHE = new Map<string, number>();

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
    const z = row === 0 ? -ROW_DEPTH : ROW_DEPTH;
    return [x, 0, z];
  });
}

const CameraSetup = memo(function CameraSetup({ camPos }: { camPos: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...camPos);
    camera.lookAt(0, 0, 0);
  }, [camera, camPos]);
  return null;
});

const GlbModel = memo(function GlbModel({ modelPath, isMobile }: { modelPath: string; isMobile: boolean }) {
  const { scene } = useGLTF(modelPath);

  const normalizedScale = useMemo(() => {
    const target = isMobile ? TARGET_SIZE_MOBILE : TARGET_SIZE;
    const cacheKey = `${modelPath}:${target}`;
    const cachedScale = NORMALIZED_SCALE_CACHE.get(cacheKey);
    if (cachedScale !== undefined) return cachedScale;

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return 1;

    const nextScale = target / maxDim;
    NORMALIZED_SCALE_CACHE.set(cacheKey, nextScale);
    return nextScale;
  }, [modelPath, scene, isMobile]);

  return <Clone object={scene} scale={normalizedScale} />;
});

const ANIM_DURATION = 0.8;
const ANIM_STAGGER = 0.12;
const ANIM_OFFSET_Y = -0.6;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

const onPointerOver = () => {
  document.body.style.cursor = "pointer";
};
const onPointerOut = () => {
  document.body.style.cursor = "auto";
};

const GridItemModel = memo(function GridItemModel({
  position,
  modelPath,
  onClick,
  index,
  isMobile,
  isActive,
  active,
}: {
  position: [number, number, number];
  modelPath: string;
  onClick: () => void;
  index: number;
  isMobile: boolean;
  isActive: boolean;
  active: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const settledRef = useRef(false);
  const prevActiveRef = useRef<boolean | null>(null);
  const delay = index * ANIM_STAGGER;

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

  const fallbackGeo = useMemo(() => new THREE.BoxGeometry(0.8, 0.8, 0.8), []);

  const initPos = useMemo(
    (): [number, number, number] => [position[0], position[1] + ANIM_OFFSET_Y, position[2]],
    [position],
  );

  const fallbackMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isActive ? "#8BE8FF" : "#46506A",
        emissive: new THREE.Color(isActive ? "#63D8FF" : "#0E1220"),
        emissiveIntensity: isActive ? 0.32 : 0.04,
        roughness: 0.28,
        metalness: 0.3,
      }),
    [isActive],
  );

  useFrame((_, delta) => {
    if (settledRef.current && modelPath) return;

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

    if (t < 1 || !modelPath) {
      invalidate();
      return;
    }

    settledRef.current = true;
  });

  return (
    <group
      ref={groupRef}
      position={initPos}
      scale={0}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {modelPath ? (
        <Suspense fallback={null}>
          <GlbModel modelPath={modelPath} isMobile={isMobile} />
        </Suspense>
      ) : (
        <mesh ref={meshRef} castShadow geometry={fallbackGeo} material={fallbackMaterial} />
      )}
    </group>
  );
});

const DIR_LIGHT_POS: [number, number, number] = [-3.5, 5.5, 5.5];
const SPOT_LIGHT_POS: [number, number, number] = [0, 5.5, 6];
const POINT_LIGHT_POS: [number, number, number] = [3.5, 1.8, 4.8];
const HEMI_ARGS: [string, string, number] = ["#F8FBFF", "#0A0C14", 1.05];
const GL_PROPS = { antialias: false, alpha: true, powerPreference: "low-power" as const };
const CANVAS_STYLE = { width: "100%", height: "100%" } as const;

export const ItemGridStage = memo(function ItemGridStage({
  items,
  activeIndex,
  camPos,
  onItemClick,
  isMobile,
  active = true,
}: {
  items: GridItem[];
  activeIndex: number;
  camPos: [number, number, number];
  onItemClick: (index: number) => void;
  isMobile: boolean;
  active?: boolean;
}) {
  const positions = useMemo(() => calcGridPositions(items), [items]);
  const safeIndex = items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);
  const cursorPos = useMemo(
    (): [number, number, number] => (positions[safeIndex] ? [...positions[safeIndex]] : [0, 0, 0]),
    [positions, safeIndex],
  );

  const clickHandlers = useMemo(() => items.map((_, i) => () => onItemClick(i)), [items, onItemClick]);

  return (
    <>
      <CameraSetup camPos={camPos} />
      <ambientLight intensity={0.52} />
      <hemisphereLight args={HEMI_ARGS} />
      <directionalLight position={DIR_LIGHT_POS} intensity={2.6} color="#D5E4FF" />
      <spotLight position={SPOT_LIGHT_POS} angle={0.58} penumbra={0.9} intensity={1.9} color="#FFFFFF" />
      <pointLight position={POINT_LIGHT_POS} intensity={1.4} color="#87B1FF" distance={22} decay={1.6} />

      {items.map((item, i) => (
        <GridItemModel
          key={item.id}
          position={positions[i]}
          modelPath={item.modelPath}
          onClick={clickHandlers[i]}
          index={i}
          isMobile={isMobile}
          isActive={i === safeIndex}
          active={active}
        />
      ))}

      <GlowCursor position={cursorPos} color="#75D9EB" scale={0.6} />
    </>
  );
});

function MemoryCardIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="8" width="36" height="32" rx="3" fill="#3A3F52" stroke="#6B7290" strokeWidth="1.5" />
      <rect x="10" y="12" width="6" height="8" rx="1" fill="#8B93B0" />
      <rect x="18" y="12" width="6" height="8" rx="1" fill="#8B93B0" />
      <rect x="26" y="12" width="6" height="8" rx="1" fill="#8B93B0" />
      <rect x="34" y="12" width="6" height="8" rx="1" fill="#8B93B0" />
      <rect x="14" y="26" width="20" height="10" rx="2" fill="#5A6180" />
      <text x="24" y="33" textAnchor="middle" fontSize="7" fontWeight="700" fill="#C8D0E8">
        MC
      </text>
    </svg>
  );
}

export default function ItemGrid({ items, screenId, title, active = true }: ItemGridProps) {
  const { playEnter, playSelect, playBack } = useNavigationSound();
  const { isMobile, isPortrait } = useViewport();
  const compact = isMobile || isPortrait;

  const camPos = useMemo((): [number, number, number] => {
    const zBase = items.length > 3 ? 6 : 4.5;
    const zScale = compact ? 1.3 : 1;
    return [0, 3.9, zBase * zScale];
  }, [items.length, compact]);

  const cameraProps = useMemo(() => ({ position: camPos, fov: 50 }), [camPos]);

  const handleSelect = useCallback(
    (index: number) => {
      playEnter();
      window.open(items[index].href, "_blank");
    },
    [playEnter, items],
  );

  const handleBack = useCallback(() => {
    playBack();
    navigate("/browser");
  }, [playBack]);

  const { activeIndex: rawActiveIndex } = useMenuNavigation({
    screenId,
    itemCount: items.length,
    direction: "horizontal",
    onSelect: handleSelect,
    onBack: handleBack,
    onMove: playSelect,
    enabled: active,
  });
  const activeIndex = items.length === 0 ? 0 : Math.min(rawActiveIndex, items.length - 1);

  useEffect(() => {
    if (!active) return;
    startAmbientAudio();
  }, [active]);

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      <Canvas
        camera={cameraProps}
        dpr={compact ? 0.75 : 1}
        frameloop="demand"
        resize={{ offsetSize: true }}
        gl={GL_PROPS}
        style={CANVAS_STYLE}
      >
        <ItemGridStage
          items={items}
          activeIndex={activeIndex}
          camPos={camPos}
          onItemClick={handleSelect}
          isMobile={compact}
          active={active}
        />
      </Canvas>
      <ThreeSceneHelperPanel panelStyle={{ bottom: "24px", left: "24px" }} />

      <div
        style={{
          position: "absolute",
          top: "clamp(6px, 1.5vh, 16px)",
          left: "clamp(20px, 5vw, 52px)",
          pointerEvents: "none",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <div style={{ width: compact ? 40 : 48, height: compact ? 40 : 48, flexShrink: 0, marginTop: "6px" }}>
          <MemoryCardIcon size={compact ? 40 : 48} />
        </div>
        <span
          className="ps2-text"
          style={{
            fontSize: compact ? "clamp(14px, 3.6vw, 24px)" : "clamp(20px, 2.2vw, 32px)",
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            transformOrigin: "left center",
            marginTop: 0,
          }}
        >
          Memory Card ({title}) / 1
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: "clamp(12px, 3vh, 32px)",
          right: "clamp(36px, 8vw, 104px)",
          pointerEvents: "none",
          zIndex: 10,
          maxWidth: "40vw",
        }}
      >
        <div
          className="ps2-text"
          style={{
            fontSize: compact ? "clamp(15px, 3.8vw, 24px)" : "clamp(20px, 2.4vw, 34px)",
            fontWeight: 700,
            color: "#C5CF1F",
            letterSpacing: "0.02em",
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            textAlign: "right",
            transformOrigin: "right center",
          }}
        >
          {items[activeIndex]?.label}
        </div>
      </div>
    </div>
  );
}
