"use client";

import ItemGrid from "@/components/shared/item-grid";
import type { GridItem } from "@/components/shared/item-grid";

const WORK_ITEMS: GridItem[] = [
  {
    id: "company-1",
    label: "Company 1",
    modelPath: "",
    href: "https://example.com",
  },
  {
    id: "company-2",
    label: "Company 2",
    modelPath: "",
    href: "https://example.com",
  },
  {
    id: "company-3",
    label: "Company 3",
    modelPath: "",
    href: "https://example.com",
  },
];

export default function WorkPage() {
  return <ItemGrid items={WORK_ITEMS} />;
}
