"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { useMenuNavigation } from "@/components/shared/use-menu-navigation";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import type { Locale, TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";

const SELECTED_COLOR = "#75D9EB";
const LOCALES: Locale[] = ["ja", "en"];

interface SystemMenuProps {
  onBack: () => void;
}

export default function SystemMenu({ onBack }: SystemMenuProps) {
  const { playEnter, playSelect } = useNavigationSound();
  const { isMobile, isPortrait } = useViewport();
  const compact = isMobile || isPortrait;
  const { locale, setLocale, t } = useLanguage();

  const [soundEnabled, setSoundEnabled] = useState(true);

  const settings = [
    {
      labelKey: "system.language" as TranslationKey,
      valueKey: `system.language.${locale}` as TranslationKey,
    },
    {
      labelKey: "system.sound" as TranslationKey,
      valueKey: (soundEnabled ? "system.sound.on" : "system.sound.off") as TranslationKey,
    },
  ];

  const handleSelect = useCallback(
    (index: number) => {
      playEnter();
      if (index === 0) {
        const currentIdx = LOCALES.indexOf(locale);
        const nextLocale = LOCALES[(currentIdx + 1) % LOCALES.length];
        setLocale(nextLocale);
      } else {
        setSoundEnabled((prev) => !prev);
      }
    },
    [playEnter, locale, setLocale],
  );

  const { activeIndex, selectByIndex } = useMenuNavigation({
    itemCount: settings.length,
    direction: "vertical",
    onSelect: handleSelect,
    onBack,
  });

  const prevIndexRef = useRef(activeIndex);
  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      playSelect();
      prevIndexRef.current = activeIndex;
    }
  }, [activeIndex, playSelect]);

  const setting = settings[activeIndex];

  return (
    <div
      style={{
        position: "absolute",
        ...(compact
          ? { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
          : { right: "25%", top: "50%", transform: "translateY(-50%)" }),
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <h1
        style={{
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: "clamp(24px, 3vw, 36px)",
          fontWeight: 400,
          color: "#DDE30F",
          letterSpacing: "0.12em",
          marginBottom: "24px",
          whiteSpace: "nowrap",
        }}
      >
        {t("system.title")}
      </h1>

      {/* Up arrow */}
      <button
        type="button"
        onClick={() => selectByIndex((activeIndex - 1 + settings.length) % settings.length)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 16px",
          color: "#555555",
          fontSize: "20px",
          lineHeight: 1,
        }}
      >
        ▲
      </button>

      {/* Active item */}
      <button
        type="button"
        onClick={() => handleSelect(activeIndex)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: "clamp(28px, 3.5vw, 42px)",
            fontWeight: 400,
            letterSpacing: "0.05em",
            color: SELECTED_COLOR,
            whiteSpace: "nowrap",
          }}
        >
          {t(setting.labelKey)}
        </span>
        <span
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: "clamp(18px, 2.2vw, 28px)",
            fontWeight: 400,
            letterSpacing: "0.08em",
            color: "#FFFFFF",
            whiteSpace: "nowrap",
          }}
        >
          {t(setting.valueKey)}
        </span>
      </button>

      {/* Down arrow */}
      <button
        type="button"
        onClick={() => selectByIndex((activeIndex + 1) % settings.length)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 16px",
          color: "#555555",
          fontSize: "20px",
          lineHeight: 1,
        }}
      >
        ▼
      </button>
    </div>
  );
}
