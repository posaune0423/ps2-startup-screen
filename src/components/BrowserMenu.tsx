"use client";

import { useGLTF } from "@react-three/drei";
import React, { useCallback, useEffect } from "react";
import { useRouter } from "vinext/shims/navigation";

import MenuList from "@/components/browser-menu/menu-list";
import OrbRing from "@/components/browser-menu/orb-ring";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { startAmbientAudio } from "@/lib/ambient-audio";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import { navigate } from "@/lib/navigate";

const MENU_ITEMS = [
  { labelKey: "menu.browser" as TranslationKey, href: "/browser" },
  { labelKey: "menu.systemConfiguration" as TranslationKey, href: "/system" },
] as const;
const BROWSER_ROUTE_MODEL_PATHS = ["/3d/memorycard.glb", "/3d/icons/cd.glb"] as const;

export default function BrowserMenu() {
  const { playEnter } = useNavigationSound();
  const { isMobile, isPortrait } = useViewport();
  const { t } = useLanguage();
  const router = useRouter();
  const compact = isMobile || isPortrait;

  useEffect(() => {
    startAmbientAudio();
  }, []);

  useEffect(() => {
    for (const modelPath of BROWSER_ROUTE_MODEL_PATHS) {
      useGLTF.preload(modelPath);
    }
  }, []);

  useEffect(() => {
    for (const item of MENU_ITEMS) {
      router.prefetch(item.href);
    }
  }, [router]);

  const handleSelect = useCallback(
    (index: number) => {
      const item = MENU_ITEMS[index];
      if (!item) return;
      playEnter();
      navigate(item.href);
    },
    [playEnter],
  );

  const { activeIndex, selectByIndex } = useMenuNavigation({
    itemCount: MENU_ITEMS.length,
    direction: "vertical",
    onSelect: handleSelect,
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100dvh",
        background: "#000000",
        display: "flex",
        flexDirection: compact ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? "clamp(16px, 4vh, 48px)" : 0,
        overflow: "hidden",
      }}
    >
      <div
        style={
          compact
            ? { flexShrink: 0 }
            : {
                position: "absolute",
                left: "25%",
                top: "50%",
                transform: "translateY(-50%)",
              }
        }
      >
        <OrbRing compact={compact} />
      </div>

      <div
        style={
          compact
            ? {
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }
            : {
                position: "absolute",
                right: "25%",
                top: "50%",
                transform: "translateY(-50%)",
                width: "min(42vw, 640px)",
                display: "flex",
                justifyContent: "flex-end",
              }
        }
      >
        <MenuList
          items={MENU_ITEMS.map((item) => ({ label: t(item.labelKey), href: item.href }))}
          activeIndex={activeIndex}
          onItemClick={selectByIndex}
        />
      </div>
    </div>
  );
}
