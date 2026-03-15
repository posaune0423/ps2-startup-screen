"use client";

import React, { useEffect, useRef } from "react";

import { useNavigationSound } from "@/components/shared/use-navigation-sound";

interface MenuItem {
  label: string;
  href: string;
}

interface MenuListProps {
  items: MenuItem[];
  activeIndex: number;
  onItemClick: (index: number) => void;
}

const SELECTED_COLOR = "#75D9EB";
const UNSELECTED_COLOR = "#4D4D4D";

export default function MenuList({ items, activeIndex, onItemClick }: MenuListProps) {
  const { playSelect } = useNavigationSound();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    playSelect();
  }, [activeIndex, playSelect]);

  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      {items.map((item, i) => (
        <li key={item.href}>
          <button
            type="button"
            onClick={() => onItemClick(i)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 400,
              letterSpacing: "0.05em",
              color: i === activeIndex ? SELECTED_COLOR : UNSELECTED_COLOR,
              transition: "color 0.2s ease",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
