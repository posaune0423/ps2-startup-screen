"use client";

import React from "react";

import BrowserMenu from "@/components/BrowserMenu";

export function MenuScreen({ active = true }: { active?: boolean }) {
  return <BrowserMenu active={active} />;
}
