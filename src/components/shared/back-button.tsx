"use client";

import React, { useCallback } from "react";
import { usePathname } from "vinext/shims/navigation";

import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { useLanguage } from "@/lib/language-context";
import { navigate } from "@/lib/navigate";

const BACK_ROUTES: Record<string, string> = {
  "/menu": "/",
  "/browser": "/menu",
  "/system": "/menu",
  "/memory/work": "/browser",
  "/memory/sns": "/browser",
};

export default function BackButton() {
  const pathname = usePathname();
  const { playBack } = useNavigationSound();
  const { isMobile } = useViewport();
  const { locale } = useLanguage();

  const isJa = locale === "ja";
  const enterIcon = isJa ? "/buttons/circle.png" : "/buttons/x.png";
  const backIcon = isJa ? "/buttons/x.png" : "/buttons/circle.png";
  const backHref = BACK_ROUTES[pathname];

  const handleBack = useCallback(() => {
    if (!backHref) return;
    playBack();
    navigate(backHref);
  }, [playBack, backHref]);

  const handleEnter = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  }, []);

  if (!backHref) return null;

  const size = isMobile ? 22 : 30;
  const containerClassName = isMobile
    ? "fixed bottom-[clamp(12px,3vh,28px)] left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-6 text-[15px] tracking-[0.04em] text-gray-400"
    : "fixed bottom-[clamp(12px,3vh,28px)] left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-9 text-[20px] tracking-[0.04em] text-gray-400";
  const buttonClassName = isMobile
    ? "flex items-center gap-1.5 cursor-pointer border-none bg-transparent p-0 text-inherit [font:inherit] [letter-spacing:inherit]"
    : "flex items-center gap-2.5 cursor-pointer border-none bg-transparent p-0 text-inherit [font:inherit] [letter-spacing:inherit]";
  const iconStyle = { clipPath: "circle(40%)" } as const;

  return (
    <div className={containerClassName}>
      <button type="button" onClick={handleEnter} className={buttonClassName}>
        <img src={enterIcon} alt="" width={size} height={size} className="block" style={iconStyle} />
        <span>Enter</span>
      </button>
      <button type="button" onClick={handleBack} className={buttonClassName}>
        <img src={backIcon} alt="" width={size} height={size} className="block" style={iconStyle} />
        <span>Back</span>
      </button>
    </div>
  );
}
