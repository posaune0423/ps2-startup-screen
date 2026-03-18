"use client";

import React from "react";

import ItemGrid from "@/components/shared/item-grid";
import type { GridItem } from "@/components/shared/item-grid";

const SNS_ITEMS: GridItem[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    modelPath: "/3d/sns/linkedin.glb",
    href: "https://www.linkedin.com/in/posaune0423",
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    modelPath: "/3d/sns/twitter_blue_bird.glb",
    href: "https://x.com/home",
  },
  {
    id: "github",
    label: "GitHub",
    modelPath: "/3d/sns/github_octcat.glb",
    href: "https://github.com/posaune0423",
  },
  {
    id: "instagram",
    label: "Instagram",
    modelPath: "/3d/sns/instagram.glb",
    href: "https://www.instagram.com/posaune0131",
  },
];
export const MEMORY_SNS_ITEMS = SNS_ITEMS;

export function SnsScreen({ active = true }: { active?: boolean }) {
  return <ItemGrid items={SNS_ITEMS} screenId="memorySns" title="SNS" active={active} />;
}
