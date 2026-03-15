"use client";

import React, { memo, useCallback, useRef, useEffect } from "react";

export default memo(function FadeOverlay({ getOpacity }: { getOpacity: () => number }) {
  const divRef = useRef<HTMLDivElement>(null);

  const tick = useCallback(() => {
    if (!divRef.current) return;
    const opacity = getOpacity();
    divRef.current.style.opacity = String(opacity);
  }, [getOpacity]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  return (
    <div
      ref={divRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        opacity: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
});
