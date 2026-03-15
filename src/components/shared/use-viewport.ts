"use client";

import { useSyncExternalStore } from "react";

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isPortrait: boolean;
}

export const MOBILE_BREAKPOINT = 768;

const DEFAULT_VIEWPORT = {
  width: 1920,
  height: 1080,
  isMobile: false,
  isPortrait: false,
} as const satisfies ViewportInfo;

function toViewport(width: number, height: number): ViewportInfo {
  return {
    width,
    height,
    isMobile: width < MOBILE_BREAKPOINT,
    isPortrait: height > width,
  };
}

let cachedSnapshot: ViewportInfo = DEFAULT_VIEWPORT;

function updateSnapshot() {
  if (typeof window === "undefined") return;
  const next = toViewport(window.innerWidth, window.innerHeight);
  if (next.width !== cachedSnapshot.width || next.height !== cachedSnapshot.height) {
    cachedSnapshot = next;
  }
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  updateSnapshot();

  const handler = () => {
    updateSnapshot();
    onStoreChange();
  };
  window.addEventListener("resize", handler);
  window.addEventListener("orientationchange", handler);
  return () => {
    window.removeEventListener("resize", handler);
    window.removeEventListener("orientationchange", handler);
  };
}

export function getClientViewport(): ViewportInfo {
  updateSnapshot();
  return cachedSnapshot;
}

export function getServerViewport(): ViewportInfo {
  return DEFAULT_VIEWPORT;
}

export function useViewport(): ViewportInfo {
  return useSyncExternalStore(subscribe, getClientViewport, getServerViewport);
}
