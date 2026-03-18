"use client";

import { Canvas } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { BrowserScreen } from "@/components/screens/browser-screen";
import { MusicScreen } from "@/components/screens/music-screen";
import { SnsScreen } from "@/components/screens/sns-screen";
import { WorkScreen } from "@/components/screens/work-screen";
import Ps2BrowserBg, { PS2_BROWSER_BG_FALLBACK } from "@/components/shared/ps2-browser-bg";
import type { AppScreenId } from "@/lib/app-screen";

interface MemoryShellProps {
  currentScreen: AppScreenId;
}

const SHELL_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100dvh",
  position: "relative",
  overflow: "hidden",
  background: PS2_BROWSER_BG_FALLBACK,
};

const BACKGROUND_CANVAS_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
};

const FOREGROUND_LAYER_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
};

const LAYER_TRANSITION_MS = 420;

function layerStyle(active: boolean): React.CSSProperties {
  return {
    ...FOREGROUND_LAYER_STYLE,
    opacity: active ? 1 : 0,
    transform: active ? "none" : "translateY(12px) scale(0.97)",
    pointerEvents: active ? "auto" : "none",
    visibility: active ? "visible" : "hidden",
    transition: `opacity ${LAYER_TRANSITION_MS}ms ease-out, transform ${LAYER_TRANSITION_MS}ms ease-out, visibility 0ms ${active ? "0ms" : `${LAYER_TRANSITION_MS}ms`}`,
  };
}

function MemoryShellBackground() {
  return (
    <Canvas
      frameloop="demand"
      dpr={1}
      gl={{ alpha: false, antialias: false, powerPreference: "low-power" }}
      style={BACKGROUND_CANVAS_STYLE}
    >
      <Ps2BrowserBg />
    </Canvas>
  );
}

function renderMemoryScreen(screen: AppScreenId, active: boolean) {
  switch (screen) {
    case "browser":
      return <BrowserScreen active={active} />;
    case "memoryWork":
      return <WorkScreen active={active} />;
    case "memorySns":
      return <SnsScreen active={active} />;
    case "music":
      return <MusicScreen active={active} transparentBackground />;
    case "startup":
    case "menu":
    case "system":
      return null;
  }
}

export default function MemoryShell({ currentScreen }: MemoryShellProps) {
  const [exitingScreen, setExitingScreen] = useState<AppScreenId | null>(null);
  const previousScreenRef = useRef(currentScreen);

  useEffect(() => {
    const previousScreen = previousScreenRef.current;
    if (previousScreen === currentScreen) return;

    previousScreenRef.current = currentScreen;
    setExitingScreen(previousScreen);

    const timer = window.setTimeout(() => {
      setExitingScreen((screen) => (screen === previousScreen ? null : screen));
    }, LAYER_TRANSITION_MS + 50);

    return () => window.clearTimeout(timer);
  }, [currentScreen]);

  const visibleScreens = useMemo(() => {
    if (exitingScreen === null || exitingScreen === currentScreen) {
      return [currentScreen];
    }
    return [exitingScreen, currentScreen];
  }, [currentScreen, exitingScreen]);

  return (
    <div style={SHELL_STYLE}>
      <MemoryShellBackground />
      {visibleScreens.map((screen) => {
        const active = screen === currentScreen;
        return (
          <div key={screen} style={layerStyle(active)}>
            {renderMemoryScreen(screen, active)}
          </div>
        );
      })}
    </div>
  );
}
