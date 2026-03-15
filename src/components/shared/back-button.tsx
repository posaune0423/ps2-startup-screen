"use client";

import React, { useCallback } from "react";
import { usePathname, useRouter } from "vinext/shims/navigation";

import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";

const BACK_ROUTES: Record<string, string> = {
  "/menu": "/",
  "/browser": "/menu",
  "/system": "/menu",
  "/memory/work": "/browser",
  "/memory/sns": "/browser",
};

const CONTAINER_BASE: React.CSSProperties = {
  position: "fixed",
  bottom: "clamp(12px, 3vh, 28px)",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  color: "gray",
  fontFamily: "inherit",
  letterSpacing: "0.04em",
};

const HINT_BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const IMG_STYLE: React.CSSProperties = {
  display: "block",
  clipPath: "circle(50%)",
};

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { playBack } = useNavigationSound();
  const { isMobile } = useViewport();

  const backHref = BACK_ROUTES[pathname];

  const handleBack = useCallback(() => {
    if (!backHref) return;
    playBack();
    router.push(backHref);
  }, [playBack, router, backHref]);

  if (!backHref) return null;

  const size = isMobile ? 22 : 30;
  const fontSize = isMobile ? 15 : 20;
  const gap = isMobile ? 6 : 10;
  const sectionGap = isMobile ? 24 : 36;

  const containerStyle = { ...CONTAINER_BASE, gap: sectionGap, fontSize };
  const hintStyle = { ...HINT_BASE, gap };

  return (
    <div style={containerStyle}>
      <span style={hintStyle}>
        <img src="/buttons/x.png" alt="" width={size} height={size} style={IMG_STYLE} />
        <span>Enter</span>
      </span>
      <button
        type="button"
        onClick={handleBack}
        style={{
          ...hintStyle,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "inherit",
          font: "inherit",
          fontSize: "inherit",
          letterSpacing: "inherit",
        }}
      >
        <img src="/buttons/circle.png" alt="" width={size} height={size} style={IMG_STYLE} />
        <span>Back</span>
      </button>
    </div>
  );
}
