"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "vinext/shims/navigation";

const FADE_MS = 150;

const OVERLAY_STYLE: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "#000",
  zIndex: 99999,
  transition: `opacity ${FADE_MS}ms ease`,
};

export default function NavigationOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const navigatingRef = useRef(false);
  const pushTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      if (!(e instanceof CustomEvent) || typeof e.detail !== "string") return;
      const href = e.detail;
      navigatingRef.current = true;
      setVisible(true);
      if (pushTimeoutRef.current !== null) {
        window.clearTimeout(pushTimeoutRef.current);
      }
      pushTimeoutRef.current = window.setTimeout(() => {
        router.push(href);
      }, FADE_MS);
    }
    window.addEventListener("app:navigate", handler);
    return () => {
      window.removeEventListener("app:navigate", handler);
      if (pushTimeoutRef.current !== null) {
        window.clearTimeout(pushTimeoutRef.current);
      }
    };
  }, [router]);

  useEffect(() => {
    if (!navigatingRef.current) return;
    navigatingRef.current = false;
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => setVisible(false), 50);
    return () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [pathname]);

  return (
    <div
      style={{
        ...OVERLAY_STYLE,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "all" : "none",
      }}
    />
  );
}
