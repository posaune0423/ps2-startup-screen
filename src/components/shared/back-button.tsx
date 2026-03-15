"use client";

import React, { useCallback } from "react";
import { usePathname, useRouter } from "vinext/shims/navigation";

import { useNavigationSound } from "@/components/shared/use-navigation-sound";

const HIDDEN_PATHS = new Set(["/"]);

const CONTAINER_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: "clamp(12px, 3vh, 28px)",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  gap: 24,
  color: "gray",
  fontSize: 15,
  fontFamily: "inherit",
  letterSpacing: "0.04em",
};

const HINT_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const IMG_STYLE: React.CSSProperties = { display: "block" };

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { playBack } = useNavigationSound();

  const handleBack = useCallback(() => {
    playBack();
    router.back();
  }, [playBack, router]);

  if (HIDDEN_PATHS.has(pathname)) return null;

  return (
    <div style={CONTAINER_STYLE}>
      <span style={HINT_STYLE}>
        <img src="/buttons/x.png" alt="" width={22} height={22} style={IMG_STYLE} />
        <span>Enter</span>
      </span>
      <button
        type="button"
        onClick={handleBack}
        style={{
          ...HINT_STYLE,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "inherit",
          font: "inherit",
          letterSpacing: "inherit",
        }}
      >
        <img src="/buttons/circle.png" alt="" width={22} height={22} style={IMG_STYLE} />
        <span>Back</span>
      </button>
    </div>
  );
}
