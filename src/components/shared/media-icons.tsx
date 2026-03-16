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
  seekForward: 86, // ▶▶
  seekBack: 86, // ◀◀  perfect mirror of seekForward
  next: 68, // ▶▶| single connected path (VW=68, symmetric with previous)
  previous: 68, // |◀◀ single connected path (VW=68, mirror of next)
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

    // ▶▶  notch at x=40 (depth≈10px).  VW=86
    seekForward: <path d="M 3,13 L 40,23 L 40,13 L 83,24 L 40,35 L 40,25 L 3,35 Z" {...S} />,

    // ◀◀  exact mirror of seekForward (x → 86-x). notch at x=46.  VW=86
    seekBack: <path d="M 83,13 L 46,23 L 46,13 L 3,24 L 46,35 L 46,25 L 83,35 Z" {...S} />,

    // ▶▶|  single connected path — ▶▶ chevrons + bar as one outline.
    // Bar left edge at x=56 = ▶▶ apex → path visits (56,24) twice, creating a
    // "pinch" where the two chevron diagonals meet the bar's left-center.
    // VW=68: tri1(4-28), notch(28), tri2(28-56), bar(56-64), margins 4+4
    next: (
      <path d="M 4,13 L 28,22 L 28,13 L 56,24 L 56,4 L 64,4 L 64,44 L 56,44 L 56,24 L 28,35 L 28,26 L 4,35 Z" {...S} />
    ),

    // |◀◀  exact mirror of next (x → 68-x).
    // Bar right edge at x=12 = ◀◀ apex.  VW=68
    previous: (
      <path d="M 64,13 L 40,22 L 40,13 L 12,24 L 12,4 L 4,4 L 4,44 L 12,44 L 12,24 L 40,35 L 40,26 L 64,35 Z" {...S} />
    ),
  };

  return (
    <span aria-hidden="true" className={className} style={{ display: "inline-flex", transition: "filter 120ms ease" }}>
      <svg {...svgProps}>{shapes[name]}</svg>
    </span>
  );
}
