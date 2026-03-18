"use client";

import React from "react";

interface MenuItem {
  label: string;
  href: string;
}

interface MenuListProps {
  items: MenuItem[];
  activeIndex: number;
  onItemClick: (index: number) => void;
}

const SELECTED_COLOR = "#47B6E1";
const UNSELECTED_COLOR = "#8A8A9A";

export default function MenuList({ items, activeIndex, onItemClick }: MenuListProps) {
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
            <span className="ps2-text">{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
