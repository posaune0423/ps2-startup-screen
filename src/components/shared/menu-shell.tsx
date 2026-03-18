"use client";

import React from "react";

import { MenuScreen } from "@/components/screens/menu-screen";
import { SystemScreen } from "@/components/screens/system-screen";
import type { AppScreenId } from "@/lib/app-screen";

interface MenuShellProps {
  currentScreen: AppScreenId;
}

const SHELL_STYLE: React.CSSProperties = {
  width: "100vw",
  height: "100dvh",
  position: "relative",
  overflow: "hidden",
  background: "#000000",
};

const LAYER_TRANSITION_MS = 420;

function layerStyle(active: boolean): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    opacity: active ? 1 : 0,
    transform: active ? "translateY(0) scale(1)" : "translateY(10px) scale(0.98)",
    pointerEvents: active ? "auto" : "none",
    visibility: active ? "visible" : "hidden",
    transition: `opacity ${LAYER_TRANSITION_MS}ms ease-out, transform ${LAYER_TRANSITION_MS}ms ease-out, visibility 0ms ${active ? "0ms" : `${LAYER_TRANSITION_MS}ms`}`,
  };
}

export default function MenuShell({ currentScreen }: MenuShellProps) {
  const menuActive = currentScreen === "menu";
  const systemActive = currentScreen === "system";

  return (
    <div style={SHELL_STYLE}>
      <div style={layerStyle(menuActive)}>
        <MenuScreen active={menuActive} />
      </div>
      <div style={layerStyle(systemActive)}>
        <SystemScreen active={systemActive} transparentBackground />
      </div>
    </div>
  );
}
