"use client";

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
    modelPath: "/3d/sns/twitter.glb",
    href: "https://x.com/home",
  },
  {
    id: "github",
    label: "GitHub",
    modelPath: "/3d/sns/github.glb",
    href: "https://github.com/posaune0423",
  },
];

export default function SnsPage() {
  return <ItemGrid items={SNS_ITEMS} title="SNS" />;
}
