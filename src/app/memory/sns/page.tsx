"use client";

import ItemGrid from "@/components/shared/item-grid";
import type { GridItem } from "@/components/shared/item-grid";

const SNS_ITEMS: GridItem[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    modelPath: "",
    href: "https://linkedin.com",
  },
  {
    id: "github",
    label: "GitHub",
    modelPath: "",
    href: "https://github.com",
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    modelPath: "",
    href: "https://x.com",
  },
];

export default function SnsPage() {
  return <ItemGrid items={SNS_ITEMS} />;
}
