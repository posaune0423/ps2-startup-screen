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
    description: "Decentralized fashion platform connecting creators and collectors through blockchain technology.",
    tags: ["RWA", "Solidity", "NFT"],
    period: "2024 –",
  },
  {
    id: "dena",
    label: "DeNA",
    modelPath: "/3d/work/dena.glb",
    href: "https://dena.com",
    description: "Large-scale mobile gaming and internet services platform serving millions of users.",
    tags: ["Dify", "Go", "Next.js"],
    period: "2023 – 2024",
  },
  {
    id: "daiko",
    label: "Daiko",
    modelPath: "/3d/work/daiko.glb",
    href: "https://daiko.ai",
    description: "AI-powered productivity tool that streamlines workflows and automates repetitive tasks.",
    tags: ["Solana", "LLM", "Rust"],
    period: "2023",
  },
  {
    id: "doom",
    label: "DOOM INDEX",
    modelPath: "/3d/work/doom.glb",
    href: "https://doomindex.fun",
    description: "Real-time market sentiment tracker visualizing the state of crypto markets.",
    tags: ["FLUX", "Rust", "Cloudflare Workers"],
    period: "2024",
  },
];
export const MEMORY_WORK_ITEMS = WORK_ITEMS;

export function WorkScreen({ active = true }: { active?: boolean }) {
  return <ItemGrid items={WORK_ITEMS} screenId="memoryWork" title="Work" active={active} />;
}
