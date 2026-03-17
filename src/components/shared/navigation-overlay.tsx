"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "vinext/shims/navigation";

import { resetRouteReady, waitForRouteReady } from "@/lib/route-transition-ready";

const FADE_MS = 120;

interface ViewTransition {
  finished: Promise<void>;
}

interface ViewTransitionCapability {
  startViewTransition?: (update: () => Promise<void> | void) => ViewTransition;
}

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
  const paintFrameRef = useRef<number | null>(null);
  const paintSettleFrameRef = useRef<number | null>(null);
  const pathResolveRef = useRef<(() => void) | null>(null);

  function getStartViewTransition() {
    const doc = document as Document & ViewTransitionCapability;
    return typeof doc.startViewTransition === "function" ? doc.startViewTransition.bind(doc) : null;
  }

  function clearPendingResolve() {
    if (paintFrameRef.current !== null) {
      window.cancelAnimationFrame(paintFrameRef.current);
      paintFrameRef.current = null;
    }
    if (paintSettleFrameRef.current !== null) {
      window.cancelAnimationFrame(paintSettleFrameRef.current);
      paintSettleFrameRef.current = null;
    }
    if (pathResolveRef.current) {
      pathResolveRef.current();
      pathResolveRef.current = null;
    }
  }

  useEffect(() => {
    function navigateWithFallback(href: string) {
      navigatingRef.current = true;
      setVisible(true);
      if (pushFrameRef.current !== null) {
        window.cancelAnimationFrame(pushFrameRef.current);
      }
      pushFrameRef.current = window.requestAnimationFrame(() => {
        router.push(href);
      });
    }

    function navigateWithViewTransition(href: string) {
      const startViewTransition = getStartViewTransition();
      if (!startViewTransition) {
        navigateWithFallback(href);
        return;
      }

      clearPendingResolve();
      resetRouteReady(href);

      navigatingRef.current = true;
      startViewTransition(
        async () =>
          await new Promise<void>((resolve) => {
            pathResolveRef.current = resolve;
            router.push(href);
          }),
      );
    }

    function handler(e: Event) {
      if (!(e instanceof CustomEvent) || typeof e.detail !== "string") return;
      const href = e.detail;
      queueMicrotask(() => {
        if (e.defaultPrevented) return;
        if (href === pathname) return;
        navigateWithViewTransition(href);
      });
    }
    window.addEventListener("app:navigate", handler);
    return () => {
      window.removeEventListener("app:navigate", handler);
      if (pushFrameRef.current !== null) {
        window.cancelAnimationFrame(pushFrameRef.current);
      }
      clearPendingResolve();
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!navigatingRef.current) return;
    navigatingRef.current = false;

    if (pathResolveRef.current) {
      const resolvePath = pathResolveRef.current;
      void waitForRouteReady(pathname).then(() => {
        if (pathResolveRef.current !== resolvePath) return;
        paintFrameRef.current = window.requestAnimationFrame(() => {
          paintFrameRef.current = null;
          if (pathResolveRef.current !== resolvePath) return;
          paintSettleFrameRef.current = window.requestAnimationFrame(() => {
            paintSettleFrameRef.current = null;
            if (pathResolveRef.current !== resolvePath) return;
            resolvePath();
            pathResolveRef.current = null;
          });
        });
      });
    }

    if (getStartViewTransition()) {
      setVisible(false);
      return () => {
        if (paintFrameRef.current !== null) {
          window.cancelAnimationFrame(paintFrameRef.current);
        }
        if (paintSettleFrameRef.current !== null) {
          window.cancelAnimationFrame(paintSettleFrameRef.current);
        }
      };
    }

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
