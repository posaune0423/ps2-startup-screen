"use client";

import React from "react";

export type MediaControlIconName = "next" | "pause" | "play" | "previous" | "seekBack" | "seekForward" | "stop";

interface MediaControlIconProps {
  active?: boolean;
  className?: string;
  name: MediaControlIconName;
}

const FILL_NORMAL = "white";
const FILL_ACTIVE = "#00DDFF";
const STROKE_NORMAL = "#3A3A3A";
const STROKE_ACTIVE = "#006080";
const STROKE_WIDTH = 2.5;

// viewBox: 0 0 56 44 (wider than tall)
const VIEW_W = 56;
const VIEW_H = 44;

export function MediaControlIcon({ active = false, className, name }: MediaControlIconProps) {
  const fill = active ? FILL_ACTIVE : FILL_NORMAL;
  const stroke = active ? STROKE_ACTIVE : STROKE_NORMAL;
  const shared = { fill, stroke, strokeWidth: STROKE_WIDTH, strokeLinejoin: "round" as const };

  const svgProps = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    width: VIEW_W,
    height: VIEW_H,
    "aria-hidden": true as const,
  };

  const icon: Record<MediaControlIconName, React.ReactElement> = {
    // ▶ single right-pointing triangle
    play: (
      <svg {...svgProps}>
        <polygon points="6,2 54,22 6,42" {...shared} />
      </svg>
    ),

    // ‖ two vertical bars
    pause: (
      <svg {...svgProps}>
        <rect x="6" y="4" width="17" height="36" {...shared} />
        <rect x="33" y="4" width="17" height="36" {...shared} />
      </svg>
    ),

    // ■ filled rectangle
    stop: (
      <svg {...svgProps}>
        <rect x="6" y="4" width="44" height="36" {...shared} />
      </svg>
    ),

    // ▶▶ two right-pointing triangles
    seekForward: (
      <svg {...svgProps}>
        <polygon points="4,3 26,22 4,41" {...shared} />
        <polygon points="28,3 50,22 28,41" {...shared} />
      </svg>
    ),

    // ◀◀ two left-pointing triangles
    seekBack: (
      <svg {...svgProps}>
        <polygon points="52,3 30,22 52,41" {...shared} />
        <polygon points="28,3 6,22 28,41" {...shared} />
      </svg>
    ),

    // ▶▶| two right triangles + right bar (rect with stroke)
    next: (
      <svg {...svgProps}>
        <polygon points="4,3 20,22 4,41" {...shared} />
        <polygon points="22,3 38,22 22,41" {...shared} />
        <rect x="42" y="3" width="10" height="38" rx="1.5" {...shared} />
      </svg>
    ),

    // |◀◀ left bar (rect with stroke) + two left triangles
    previous: (
      <svg {...svgProps}>
        <rect x="4" y="3" width="10" height="38" rx="1.5" {...shared} />
        <polygon points="34,3 18,22 34,41" {...shared} />
        <polygon points="52,3 36,22 52,41" {...shared} />
      </svg>
    ),
  };

  return (
    <span aria-hidden="true" className={className} style={{ display: "inline-flex" }}>
      {icon[name]}
    </span>
  );
}
