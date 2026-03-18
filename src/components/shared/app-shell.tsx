"use client";

import { useGLTF } from "@react-three/drei";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "vinext/shims/navigation";

import { StartupScreen } from "@/components/screens/startup-screen";
import MemoryShell from "@/components/shared/memory-shell";
import MenuShell from "@/components/shared/menu-shell";
import { getScreenCluster, getScreenFromPath, WARMUP_ASSET_PATHS } from "@/lib/app-screen";
import { useAppStore } from "@/lib/app-store";

const LEAVE_MS = 600;
const ENTER_MS = 600;
const SETTLE_MS = 200;
const INTRA_CLUSTER_FADE_MS = 450;

const SHELL_STYLE: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  overflow: "hidden",
};

const HYDRATION_PLACEHOLDER_STYLE: React.CSSProperties = {
  ...SHELL_STYLE,
  background: "#000000",
};

const OVERLAY_STYLE: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "#000000",
  transition: `opacity ${ENTER_MS}ms ease-in-out`,
  willChange: "opacity",
  zIndex: 99998,
};

async function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function warmAsset(path: string) {
  useGLTF.preload(path);
  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to warm asset: ${path}`);
  }
}

export default function AppShell() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const currentScreen = useMemo(() => (hasMounted ? getScreenFromPath(pathname) : null), [hasMounted, pathname]);
  const currentCluster = useMemo(() => (currentScreen ? getScreenCluster(currentScreen) : null), [currentScreen]);
  const navigationRef = useRef(false);
  const warmupStartedRef = useRef(false);

  const hydrateSettings = useAppStore((state) => state.hydrateSettings);
  const beginNavigation = useAppStore((state) => state.beginNavigation);
  const commitNavigation = useAppStore((state) => state.commitNavigation);
  const completeNavigation = useAppStore((state) => state.completeNavigation);
  const resetScreenState = useAppStore((state) => state.resetScreenState);
  const syncScreenFromPath = useAppStore((state) => state.syncScreenFromPath);
  const startWarmup = useAppStore((state) => state.startWarmup);
  const markAssetLoading = useAppStore((state) => state.markAssetLoading);
  const markAssetReady = useAppStore((state) => state.markAssetReady);
  const markAssetError = useAppStore((state) => state.markAssetError);
  const finishWarmup = useAppStore((state) => state.finishWarmup);
  const inputLocked = useAppStore((state) => state.inputLocked);

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (navigationRef.current) return;
    syncScreenFromPath(pathname, pathname === "/" ? "boot" : "history");
  }, [hasMounted, pathname, syncScreenFromPath]);

  const navigateWithTransition = useCallback(
    async (href: string, reason: "user" | "auto" = "user") => {
      if (!hasMounted || currentScreen === null) return;
      if (navigationRef.current || href === pathname) return;

      const targetScreen = getScreenFromPath(href);
      const crossCluster = getScreenCluster(currentScreen) !== getScreenCluster(targetScreen);
      navigationRef.current = true;
      beginNavigation(targetScreen, reason);
      if (crossCluster) {
        setOverlayVisible(true);
        await wait(LEAVE_MS);
      }

      resetScreenState(targetScreen);
      router.push(href);
      commitNavigation(targetScreen);

      if (crossCluster) {
        await wait(SETTLE_MS);
        window.requestAnimationFrame(() => {
          setOverlayVisible(false);
        });
        await wait(ENTER_MS);
      } else {
        await wait(INTRA_CLUSTER_FADE_MS);
      }
      completeNavigation();
      navigationRef.current = false;
    },
    [
      beginNavigation,
      commitNavigation,
      completeNavigation,
      currentScreen,
      hasMounted,
      pathname,
      resetScreenState,
      router,
    ],
  );

  useEffect(() => {
    function handleNavigate(event: Event) {
      if (!(event instanceof CustomEvent) || typeof event.detail !== "string") return;
      const href = event.detail;

      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        void navigateWithTransition(href);
      });
    }

    window.addEventListener("app:navigate", handleNavigate);
    return () => window.removeEventListener("app:navigate", handleNavigate);
  }, [navigateWithTransition]);

  useEffect(() => {
    if (warmupStartedRef.current) return;

    warmupStartedRef.current = true;
    let cancelled = false;

    startWarmup(WARMUP_ASSET_PATHS.length);

    void (async () => {
      for (const path of WARMUP_ASSET_PATHS) {
        if (cancelled) return;

        markAssetLoading(path);
        try {
          await warmAsset(path);
          if (cancelled) return;
          markAssetReady(path);
        } catch {
          if (cancelled) return;
          markAssetError(path);
        }
      }

      if (!cancelled) {
        finishWarmup();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [finishWarmup, markAssetError, markAssetLoading, markAssetReady, startWarmup]);

  if (!hasMounted || currentScreen === null || currentCluster === null) {
    return <div style={HYDRATION_PLACEHOLDER_STYLE} />;
  }

  return (
    <div style={SHELL_STYLE}>
      {currentCluster === "startup" ? <StartupScreen /> : null}
      {currentCluster === "menu" ? <MenuShell currentScreen={currentScreen} /> : null}
      {currentCluster === "memory" ? <MemoryShell currentScreen={currentScreen} /> : null}
      <div
        style={{
          ...OVERLAY_STYLE,
          opacity: overlayVisible ? 1 : 0,
          pointerEvents: inputLocked ? "all" : "none",
        }}
      />
    </div>
  );
}
