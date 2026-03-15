"use client";

import React, { useCallback, useEffect } from "react";
import { useRouter } from "vinext/shims/navigation";

import MenuList from "@/components/browser-menu/menu-list";
import OrbRing from "@/components/browser-menu/orb-ring";
import { navigateWithTransition } from "@/components/shared/navigate-with-transition";
import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { startAmbientAudio } from "@/lib/ambient-audio";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";

const MENU_ITEMS = [
  { labelKey: "menu.browser" as TranslationKey, href: "/browser" },
  { labelKey: "menu.systemConfiguration" as TranslationKey, href: "/system" },
] as const;

export default function BrowserMenu() {
  const router = useRouter();
  const { playEnter } = useNavigationSound();
  const { isMobile, isPortrait } = useViewport();
  const { t } = useLanguage();
  const compact = isMobile || isPortrait;

  useEffect(() => {
    startAmbientAudio();
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      playEnter();
      navigateWithTransition(router, MENU_ITEMS[index].href);
    },
    [router, playEnter],
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
