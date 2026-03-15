"use client";

import React, { useCallback } from "react";
import { usePathname, useRouter } from "vinext/shims/navigation";

import { useNavigationSound } from "@/components/shared/use-navigation-sound";

const HIDDEN_PATHS = new Set(["/"]);

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { playBack } = useNavigationSound();

  const handleClick = useCallback(() => {
    playBack();
    router.back();
  }, [playBack, router]);

  if (HIDDEN_PATHS.has(pathname)) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        position: "fixed",
        bottom: "clamp(16px, 3vh, 32px)",
        right: "clamp(16px, 3vw, 32px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(0, 0, 0, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: 8,
        padding: "8px 18px 8px 12px",
        cursor: "pointer",
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: 14,
        fontFamily: "inherit",
        letterSpacing: "0.05em",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        transition: "opacity 0.15s",
      }}
    >
      <img src="/buttons/circle.png" alt="" width={28} height={28} style={{ display: "block" }} />
      <span>Back</span>
    </button>
  );
}
