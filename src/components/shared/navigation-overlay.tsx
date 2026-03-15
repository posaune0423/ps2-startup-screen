"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "vinext/shims/navigation";

const FADE_MS = 120;

const OVERLAY_STYLE: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "transparent",
  zIndex: 99999,
  transition: `opacity ${FADE_MS}ms ease`,
};

export default function NavigationOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const navigatingRef = useRef(false);
  const pushFrameRef = useRef<number | null>(null);
  const hideFrameRef = useRef<number | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      if (!(e instanceof CustomEvent) || typeof e.detail !== "string") return;
      const href = e.detail;
      queueMicrotask(() => {
        if (e.defaultPrevented) return;
        navigatingRef.current = true;
        setVisible(true);
        if (pushFrameRef.current !== null) {
          window.cancelAnimationFrame(pushFrameRef.current);
        }
        pushFrameRef.current = window.requestAnimationFrame(() => {
          router.push(href);
        });
      });
    }
    window.addEventListener("app:navigate", handler);
    return () => {
      window.removeEventListener("app:navigate", handler);
      if (pushFrameRef.current !== null) {
        window.cancelAnimationFrame(pushFrameRef.current);
      }
    };
  }, [router]);

  useEffect(() => {
    if (!navigatingRef.current) return;
    navigatingRef.current = false;
    if (hideFrameRef.current !== null) {
      window.cancelAnimationFrame(hideFrameRef.current);
    }
    hideFrameRef.current = window.requestAnimationFrame(() => setVisible(false));
    return () => {
      if (hideFrameRef.current !== null) {
        window.cancelAnimationFrame(hideFrameRef.current);
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
