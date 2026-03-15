"use client";

import { useCallback, useEffect, useState } from "react";

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isPortrait: boolean;
}

const MOBILE_BREAKPOINT = 768;

function getViewport(): ViewportInfo {
  const width = typeof window !== "undefined" ? window.innerWidth : 1920;
  const height = typeof window !== "undefined" ? window.innerHeight : 1080;
  return {
    width,
    height,
    isMobile: width < MOBILE_BREAKPOINT,
    isPortrait: height > width,
  };
}

export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState(getViewport);

  const handleResize = useCallback(() => {
    setViewport(getViewport());
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return viewport;
}
