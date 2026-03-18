"use client";

import { Canvas } from "@react-three/fiber";
import React from "react";

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
  width: "100vw",
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

export default function MemoryShell({ currentScreen }: MemoryShellProps) {
  const browserActive = currentScreen === "browser";
  const workActive = currentScreen === "memoryWork";
  const snsActive = currentScreen === "memorySns";
  const musicActive = currentScreen === "music";

  return (
    <div style={SHELL_STYLE}>
      <MemoryShellBackground />
      <div style={layerStyle(browserActive)}>
        <BrowserScreen active={browserActive} />
      </div>
      <div style={layerStyle(workActive)}>
        <WorkScreen active={workActive} />
      </div>
      <div style={layerStyle(snsActive)}>
        <SnsScreen active={snsActive} />
      </div>
      <div style={layerStyle(musicActive)}>
        <MusicScreen active={musicActive} transparentBackground />
      </div>
    </div>
  );
}
