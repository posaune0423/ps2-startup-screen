"use client";

import React from "react";

import ItemGrid from "@/components/shared/item-grid";
import type { GridItem } from "@/components/shared/item-grid";

const WORK_ITEMS: GridItem[] = [
  {
    id: "velvett",
    label: "Velvett",
    modelPath: "/3d/work/velvett.glb",
    href: "https://velvett.io",
  },
  {
    id: "dena",
    label: "DeNA",
    modelPath: "/3d/work/dena.glb",
    href: "https://dena.com",
  },
  {
    id: "daiko",
    label: "Daiko",
    modelPath: "/3d/work/daiko.glb",
    href: "https://daiko.ai",
  },
  {
    id: "doom",
    label: "DOOM INDEX",
    modelPath: "/3d/work/doom.glb",
    href: "https://doomindex.fun",
  },
];

export default function WorkPage() {
  return <ItemGrid items={WORK_ITEMS} readyRoute="/memory/work" title="Work" />;
}
