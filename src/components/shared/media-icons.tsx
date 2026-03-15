"use client";

import React from "react";

export type MediaControlIconName = "next" | "pause" | "play" | "previous" | "seekBack" | "seekForward" | "stop";

interface MediaControlIconProps {
  active?: boolean;
  className?: string;
  name: MediaControlIconName;
}

export function MediaControlIcon({ active = false, className, name }: MediaControlIconProps) {
  const stroke = "#F4F7FB";
  const fill = active ? "#53EAF0" : "transparent";
  const common = {
    fill: "none",
    stroke,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    strokeWidth: 2.8,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 28 28"
      width="28"
      height="28"
      style={{ display: "block", overflow: "visible" }}
    >
      {name === "previous" ? (
        <>
          <path d="M7 6v16" {...common} />
          <path d="M21 6L12 14l9 8V6Z" fill={fill} stroke={stroke} strokeLinejoin="round" strokeWidth={2.8} />
          <path d="M14 6L5 14l9 8V6Z" fill={fill} stroke={stroke} strokeLinejoin="round" strokeWidth={2.8} />
        </>
      ) : null}
      {name === "seekBack" ? (
        <>
          <path d="M21 6L12 14l9 8V6Z" fill={fill} stroke={stroke} strokeLinejoin="round" strokeWidth={2.8} />
          <path d="M14 6L5 14l9 8V6Z" fill={fill} stroke={stroke} strokeLinejoin="round" strokeWidth={2.8} />
        </>
      ) : null}
      {name === "seekForward" ? (
        <>
          <path d="M7 6l9 8-9 8V6Z" fill={fill} stroke={stroke} strokeLinejoin="round" strokeWidth={2.8} />
          <path d="M14 6l9 8-9 8V6Z" fill={fill} stroke={stroke} strokeLinejoin="round" strokeWidth={2.8} />
        </>
      ) : null}
      {name === "next" ? (
        <>
          <path d="M21 6v16" {...common} />
          <path d="M7 6l9 8-9 8V6Z" fill={fill} stroke={stroke} strokeLinejoin="round" strokeWidth={2.8} />
          <path d="M14 6l9 8-9 8V6Z" fill={fill} stroke={stroke} strokeLinejoin="round" strokeWidth={2.8} />
        </>
      ) : null}
      {name === "play" ? (
        <path d="M8 5l14 9-14 9V5Z" fill={fill || "#53EAF0"} stroke={stroke} strokeLinejoin="round" strokeWidth={2.8} />
      ) : null}
      {name === "pause" ? (
        <>
          <path
            d="M8 6h4v16H8z"
            fill={fill === "transparent" ? stroke : fill}
            stroke={stroke}
            strokeLinejoin="round"
            strokeWidth={2.4}
          />
          <path
            d="M16 6h4v16h-4z"
            fill={fill === "transparent" ? stroke : fill}
            stroke={stroke}
            strokeLinejoin="round"
            strokeWidth={2.4}
          />
        </>
      ) : null}
      {name === "stop" ? (
        <rect
          x="7"
          y="7"
          width="14"
          height="14"
          fill={fill === "transparent" ? "rgba(244,247,251,0.08)" : fill}
          stroke={stroke}
          strokeLinejoin="round"
          strokeWidth={2.8}
        />
      ) : null}
    </svg>
  );
}
