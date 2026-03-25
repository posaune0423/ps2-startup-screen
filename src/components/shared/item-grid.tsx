"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import GlowCursor from "@/components/shared/glow-cursor";
import { ThreeSceneHelperPanel } from "@/components/shared/three-scene-helper-panel";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { startAmbientAudio } from "@/lib/ambient-audio";
import type { ActiveIndexScreenId } from "@/lib/app-screen";
import { registerGLTFScene } from "@/lib/gltf-memory";
import { navigate } from "@/lib/navigate";

export interface GridItem {
  id: string;
  label: string;
  modelPath: string;
  href: string;
  description?: string;
  tags?: string[];
  period?: string;
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
const DETAIL_ANIM_DURATION = 0.6;
const DETAIL_SCALE_FACTOR = 2.4;

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

  useEffect(() => {
    registerGLTFScene(modelPath, scene);
  }, [modelPath, scene]);

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

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function lerpValue(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const onPointerOver = () => {
  document.body.style.cursor = "pointer";
};
const onPointerOut = () => {
  document.body.style.cursor = "auto";
};

type SelectionPhase = "idle" | "selecting" | "selected" | "deselecting";

const GridItemModel = memo(function GridItemModel({
  position,
  modelPath,
  onClick,
  index,
  isMobile,
  isActive,
  active,
  selectionPhase,
  isSelected,
  detailPosition,
  detailScale,
  onAnimationComplete,
}: {
  position: [number, number, number];
  modelPath: string;
  onClick: () => void;
  index: number;
  isMobile: boolean;
  isActive: boolean;
  active: boolean;
  selectionPhase: SelectionPhase;
  isSelected: boolean;
  detailPosition: [number, number, number];
  detailScale: number;
  onAnimationComplete: () => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const settledRef = useRef(false);
  const prevActiveRef = useRef<boolean | null>(null);
  const selectionElapsed = useRef(0);
  const prevSelectionPhaseRef = useRef<SelectionPhase>("idle");
  const selectionPhaseRef = useRef(selectionPhase);
  const clickRef = useRef(onClick);
  const delay = index * ANIM_STAGGER;

  useEffect(() => {
    selectionPhaseRef.current = selectionPhase;
  }, [selectionPhase]);

  useEffect(() => {
    clickRef.current = onClick;
  }, [onClick]);

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

  useEffect(() => {
    if (selectionPhase === prevSelectionPhaseRef.current) return;
    if (selectionPhase === "selecting" || selectionPhase === "deselecting") {
      selectionElapsed.current = 0;
      invalidate();
    }
    prevSelectionPhaseRef.current = selectionPhase;
  }, [invalidate, selectionPhase]);

  const fallbackGeo = useMemo(() => new THREE.BoxGeometry(0.8, 0.8, 0.8), []);

  const initPos = useMemo(
    (): [number, number, number] => [position[0], position[1] + ANIM_OFFSET_Y, position[2]],
    [position],
  );

  const fallbackMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.28,
        metalness: 0.3,
      }),
    [],
  );

  useEffect(() => {
    fallbackMaterial.color.set(isActive ? "#8BE8FF" : "#46506A");
    fallbackMaterial.emissive.set(isActive ? "#63D8FF" : "#0E1220");
    fallbackMaterial.emissiveIntensity = isActive ? 0.32 : 0.04;
    fallbackMaterial.needsUpdate = true;
  }, [isActive, fallbackMaterial]);

  useEffect(() => {
    return () => {
      fallbackGeo.dispose();
      fallbackMaterial.dispose();
    };
  }, [fallbackGeo, fallbackMaterial]);

  const handleModelClick = useCallback(() => {
    if (selectionPhaseRef.current !== "idle") return;
    clickRef.current();
  }, []);

  const handleModelPointerOver = useCallback(() => {
    if (selectionPhaseRef.current !== "idle") return;
    onPointerOver();
  }, []);

  const handleModelPointerOut = useCallback(() => {
    onPointerOut();
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (!settledRef.current) {
      elapsed.current += delta;
      const t = Math.min(1, Math.max(0, (elapsed.current - delay) / ANIM_DURATION));
      const eased = easeOutCubic(t);

      group.position.y = position[1] + ANIM_OFFSET_Y * (1 - eased);
      group.scale.setScalar(eased);

      if (!modelPath && meshRef.current) {
        meshRef.current.rotation.y += delta * 0.5;
      }

      if (t < 1 || !modelPath) {
        invalidate();
        return;
      }

      settledRef.current = true;
    }

    if (selectionPhase === "selecting" && isSelected) {
      selectionElapsed.current += delta;
      const t = Math.min(1, selectionElapsed.current / DETAIL_ANIM_DURATION);
      const eased = easeInOutCubic(t);

      group.position.x = lerpValue(position[0], detailPosition[0], eased);
      group.position.y = lerpValue(position[1], detailPosition[1], eased);
      group.position.z = lerpValue(position[2], detailPosition[2], eased);
      group.scale.setScalar(lerpValue(1, detailScale, eased));
      invalidate();

      if (t >= 1) {
        onAnimationComplete();
      }
      return;
    }

    if (selectionPhase === "deselecting" && isSelected) {
      selectionElapsed.current += delta;
      const t = Math.min(1, selectionElapsed.current / DETAIL_ANIM_DURATION);
      const eased = easeInOutCubic(t);

      group.position.x = lerpValue(detailPosition[0], position[0], eased);
      group.position.y = lerpValue(detailPosition[1], position[1], eased);
      group.position.z = lerpValue(detailPosition[2], position[2], eased);
      group.scale.setScalar(lerpValue(detailScale, 1, eased));
      invalidate();

      if (t >= 1) {
        onAnimationComplete();
      }
      return;
    }

    if (selectionPhase === "selected" && isSelected) {
      group.position.set(...detailPosition);
      group.scale.setScalar(detailScale);
      if (!modelPath && meshRef.current) {
        meshRef.current.rotation.y += delta * 0.3;
        invalidate();
      }
      return;
    }

    if (!modelPath && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      invalidate();
    }
  });

  const hasSelection = selectionPhase !== "idle";
  const shouldHide = hasSelection && !isSelected;

  return (
    <group
      ref={groupRef}
      position={initPos}
      scale={0}
      onClick={handleModelClick}
      onPointerOver={handleModelPointerOver}
      onPointerOut={handleModelPointerOut}
      visible={!shouldHide}
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
const GL_PROPS = { antialias: true, alpha: true, powerPreference: "high-performance" as const };
const CANVAS_STYLE = { width: "100%", height: "100%" } as const;

export const ItemGridStage = memo(function ItemGridStage({
  items,
  activeIndex,
  camPos,
  onItemClick,
  isMobile,
  active = true,
  selectionPhase,
  selectedIndex,
  onAnimationComplete,
}: {
  items: GridItem[];
  activeIndex: number;
  camPos: [number, number, number];
  onItemClick: (index: number) => void;
  isMobile: boolean;
  active?: boolean;
  selectionPhase: SelectionPhase;
  selectedIndex: number | null;
  onAnimationComplete: () => void;
}) {
  const positions = useMemo(() => calcGridPositions(items), [items]);
  const safeIndex = items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);
  const cursorPos = useMemo(
    (): [number, number, number] => (positions[safeIndex] ? [...positions[safeIndex]] : [0, 0, 0]),
    [positions, safeIndex],
  );

  const clickHandlers = useMemo(() => items.map((_, i) => () => onItemClick(i)), [items, onItemClick]);
  const detailPosition = useMemo(
    (): [number, number, number] => (isMobile ? [0, 0.9, 0.8] : [-1.2, 0.1, 0.8]),
    [isMobile],
  );

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
          selectionPhase={selectionPhase}
          isSelected={selectedIndex === i}
          detailPosition={detailPosition}
          detailScale={DETAIL_SCALE_FACTOR}
          onAnimationComplete={onAnimationComplete}
        />
      ))}

      {selectionPhase === "idle" ? <GlowCursor position={cursorPos} color="#75D9EB" scale={0.6} /> : null}
    </>
  );
});

function MemoryCardImage({ size }: { size: number }) {
  return (
    <img
      src="/memorycard.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

function DetailPanel({
  item,
  visible,
  compact,
  title,
}: {
  item: GridItem | null;
  visible: boolean;
  compact: boolean;
  title: string;
}) {
  if (!item) return null;

  return (
    <div
      style={{
        position: "absolute",
        ...(compact ? { bottom: "14%", left: 0, right: 0 } : { top: 0, right: 0, width: "55%", height: "100%" }),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: compact ? "flex-start" : "center",
        padding: compact ? "0 24px" : "0 32px",
        pointerEvents: visible ? "auto" : "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0, 0)" : compact ? "translateY(20px)" : "translateX(30px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        zIndex: 20,
      }}
    >
      <span
        className="ps2-text"
        style={{
          fontSize: compact ? "clamp(16px, 4vw, 22px)" : "clamp(20px, 1.7vw, 28px)",
          color: "#FFFFFF",
          marginBottom: 6,
          letterSpacing: "0.02em",
        }}
      >
        Memory Card <span style={{ fontSize: "0.8em" }}>({title})</span>/1
      </span>

      <h2
        className="ps2-text"
        style={{
          fontSize: compact ? "clamp(28px, 7.5vw, 44px)" : "clamp(34px, 3.2vw, 52px)",
          fontWeight: 700,
          color: "#C5CF1F",
          margin: "0 0 4px",
          letterSpacing: "0.02em",
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {item.label}
      </h2>

      {item.description ? (
        <p
          className="ps2-text"
          style={{
            fontSize: compact ? "clamp(11px, 2.8vw, 14px)" : "clamp(12px, 0.85vw, 15px)",
            color: "#C5CF1F",
            margin: "0 0 14px",
            textAlign: "center",
            lineHeight: 1.7,
            maxWidth: compact ? "min(88%, 320px)" : "min(80%, 380px)",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {item.description}
        </p>
      ) : null}

      {item.period ? (
        <p
          className="ps2-text"
          style={{
            fontSize: compact ? "clamp(13px, 3vw, 17px)" : "clamp(14px, 1.1vw, 19px)",
            color: "#8899BB",
            margin: "0 0 3px",
            textAlign: "center",
          }}
        >
          {item.period}
        </p>
      ) : null}

      {item.tags?.length ? (
        <p
          className="ps2-text"
          style={{
            fontSize: compact ? "clamp(13px, 3vw, 17px)" : "clamp(14px, 1.1vw, 19px)",
            color: "#8899BB",
            margin: "0 0 24px",
            textAlign: "center",
          }}
        >
          {item.tags.join(" · ")}
        </p>
      ) : null}

      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="ps2-text"
        style={{
          fontSize: compact ? "clamp(20px, 5vw, 28px)" : "clamp(22px, 1.8vw, 32px)",
          color: "#75D9EB",
          textDecoration: "none",
          letterSpacing: "0.02em",
          cursor: "pointer",
        }}
      >
        Open
      </a>
    </div>
  );
}

export default function ItemGrid({ items, screenId, title, active = true }: ItemGridProps) {
  const { playEnter, playSelect, playBack } = useNavigationSound();
  const { isMobile, isPortrait } = useViewport();
  const compact = isMobile || isPortrait;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectionPhase, setSelectionPhase] = useState<SelectionPhase>("idle");
  const phaseRef = useRef<SelectionPhase>("idle");
  phaseRef.current = selectionPhase;

  const camPos = useMemo((): [number, number, number] => {
    const zBase = items.length > 3 ? 6 : 4.5;
    const zScale = compact ? 1.3 : 1;
    return [0, 3.9, zBase * zScale];
  }, [items.length, compact]);

  const cameraProps = useMemo(() => ({ position: camPos, fov: 50 }), [camPos]);
  const isDetailVisible = selectionPhase === "selected" || selectionPhase === "selecting";

  const handleAnimationComplete = useCallback(() => {
    const phase = phaseRef.current;
    if (phase === "selecting") {
      setSelectionPhase("selected");
    } else if (phase === "deselecting") {
      setSelectionPhase("idle");
      setSelectedIndex(null);
    }
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (phaseRef.current !== "idle") return;
      if (!items[index]) return;
      playEnter();
      setSelectedIndex(index);
      setSelectionPhase("selecting");
    },
    [items, playEnter],
  );

  const handleDetailBack = useCallback(() => {
    if (phaseRef.current !== "selected") return;
    playBack();
    setSelectionPhase("deselecting");
  }, [playBack]);

  const handleGridBack = useCallback(() => {
    playBack();
    navigate("/browser");
  }, [playBack]);

  const handleBack = useCallback(() => {
    const phase = phaseRef.current;
    if (phase === "selected") {
      handleDetailBack();
      return;
    }
    if (phase === "idle") {
      handleGridBack();
    }
  }, [handleDetailBack, handleGridBack]);

  useEffect(() => {
    if (selectionPhase !== "selected") return;

    function handleDetailKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" && event.key !== "Backspace") return;
      event.preventDefault();
      handleDetailBack();
    }

    window.addEventListener("keydown", handleDetailKeyDown);
    return () => window.removeEventListener("keydown", handleDetailKeyDown);
  }, [handleDetailBack, selectionPhase]);

  useEffect(() => {
    function handleNavigate(event: Event) {
      const phase = phaseRef.current;
      if (phase === "idle") return;
      event.preventDefault();
      if (phase === "selected") {
        handleDetailBack();
      }
    }

    window.addEventListener("app:navigate", handleNavigate);
    return () => window.removeEventListener("app:navigate", handleNavigate);
  }, [handleDetailBack]);

  useEffect(() => {
    if (active) return;
    setSelectedIndex(null);
    setSelectionPhase("idle");
    onPointerOut();
  }, [active]);

  const selectedItem = selectedIndex === null ? null : (items[selectedIndex] ?? null);

  useEffect(() => {
    if (selectedIndex === null) return;
    if (items[selectedIndex]) return;
    setSelectedIndex(null);
    setSelectionPhase("idle");
  }, [items, selectedIndex]);

  const menuNavigationEnabled = active && selectionPhase === "idle";

  const { activeIndex: rawActiveIndex } = useMenuNavigation({
    screenId,
    itemCount: items.length,
    direction: "horizontal",
    onSelect: handleSelect,
    onBack: handleBack,
    onMove: playSelect,
    enabled: menuNavigationEnabled,
  });
  const activeIndex = items.length === 0 ? 0 : Math.min(rawActiveIndex, items.length - 1);

  useEffect(() => {
    if (!active) return;
    startAmbientAudio();
  }, [active]);

  const showGrid = selectionPhase === "idle";

  return (
    <div style={{ width: "100vw", height: "100dvh", position: "relative" }}>
      <Canvas
        camera={cameraProps}
        dpr={compact ? 1 : 1.25}
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
          selectionPhase={selectionPhase}
          selectedIndex={selectedIndex}
          onAnimationComplete={handleAnimationComplete}
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
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          display: showGrid ? "flex" : "none",
        }}
      >
        <div
          style={{
            width: compact ? 28 : 36,
            height: compact ? 28 : 36,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MemoryCardImage size={compact ? 24 : 32} />
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
          display: showGrid ? "block" : "none",
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

      <DetailPanel item={selectedItem} visible={isDetailVisible} compact={compact} title={title} />
    </div>
  );
}
