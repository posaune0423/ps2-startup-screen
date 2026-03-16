"use client";

import React from "react";

export type MediaControlIconName = "next" | "pause" | "play" | "previous" | "seekBack" | "seekForward" | "stop";

interface MediaControlIconProps {
  active?: boolean;
  className?: string;
  name: MediaControlIconName;
  /** Rendered height in px. Width scales from per-icon viewBox ratio. */
  size?: number;
}

// ─── design tokens ────────────────────────────────────────────────────────────
const FILL = { normal: "white", active: "#00DDFF" };
const STROKE = { normal: "#252525", active: "#004E5E" };
const SW = 3.8; // stroke-width in viewBox units
const ROUND = { strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

// ─── per-icon viewBox widths (height is always 48) ───────────────────────────
// Wider viewBox → wider rendered icon at the same height.
const VH = 48;
const VW: Record<MediaControlIconName, number> = {
  play: 72, // ▶  wide triangle
  pause: 48, // ‖  ~1:1
  stop: 48, // □  ~1:1
  seekForward: 86, // ▶▶ very acute wide triangles
  seekBack: 86, // ◀◀ very acute wide triangles
  next: 70, // ▶▶| acute triangles + bar (bar flush against triangles)
  previous: 78, // |◀◀ bar + acute triangles (bar flush against triangles)
};

// ─── component ───────────────────────────────────────────────────────────────
export function MediaControlIcon({ active = false, className, name, size = 32 }: MediaControlIconProps) {
  const fill = active ? FILL.active : FILL.normal;
  const stroke = active ? STROKE.active : STROKE.normal;
  const vw = VW[name];
  const h = size;
  const w = Math.round((size * vw) / VH);

  const svgProps = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${vw} ${VH}`,
    width: w,
    height: h,
    "aria-hidden": true as const,
  };

  // shared props for filled shapes
  const S = { fill, stroke, strokeWidth: SW, ...ROUND };

  const shapes: Record<MediaControlIconName, React.ReactNode> = {
    // ▶  single wide triangle — base flush left, apex near right edge
    play: <polygon points="7,3 69,24 7,45" {...S} />,

    // ‖  two bars — ~1:1 overall (VW=48)
    pause: (
      <>
        <rect x="5" y="5" width="16" height="38" rx="5" {...S} />
        <rect x="27" y="5" width="16" height="38" rx="5" {...S} />
      </>
    ),

    // □  rounded square — 1:1 (VW=48)
    stop: <rect x="5" y="5" width="38" height="38" rx="8" {...S} />,

    // ▶▶  single connected outline — notch at x=40 where the two chevrons meet
    // tri1: (3,13)→(44,24)→(3,35), tri2: (40,13)→(83,24)→(40,35), overlap x=40-44
    // notch on tri1 at x=40: top y≈23, bottom y≈25
    seekForward: <path d="M 3,13 L 40,23 L 40,13 L 83,24 L 40,35 L 40,25 L 3,35 Z" {...S} />,

    // ◀◀  single connected outline — notch at x=44 where the two chevrons meet
    // tri1: (44,13)→(3,24)→(44,35), tri2: (83,13)→(40,24)→(83,35), overlap x=40-44
    // notch on tri2 at x=44: top y≈23, bottom y≈25
    seekBack: <path d="M 83,13 L 44,23 L 44,13 L 3,24 L 44,35 L 44,25 L 83,35 Z" {...S} />,

    // ▶▶|  connected ▶▶ outline, bar moved flush (gap≈2 → strokes touch)
    // VW=70: tri1(4-28), notch(28), tri2(28-56), gap≈2, bar(58-66), margins 4+4
    next: (
      <>
        <path d="M 4,13 L 28,22 L 28,13 L 56,24 L 28,35 L 28,26 L 4,35 Z" {...S} />
        <rect x="58" y="4" width="8" height="40" rx="3" {...S} />
      </>
    ),

    // |◀◀  bar flush against triangles (bar right edge = triangle leftmost x)
    // VW=78: bar(8-16), triangles shifted so leftmost=16, rightmost=70, margins 8+8
    previous: (
      <>
        <rect x="8" y="4" width="8" height="40" rx="3" {...S} />
        <path d="M 70,13 L 44,23 L 44,13 L 16,24 L 44,35 L 44,25 L 70,35 Z" {...S} />
      </>
    ),
  };

  return (
    <span aria-hidden="true" className={className} style={{ display: "inline-flex", transition: "filter 120ms ease" }}>
      <svg {...svgProps}>{shapes[name]}</svg>
    </span>
  );
}
