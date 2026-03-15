"use client";

import { useCallback, useEffect, useState } from "react";

function triggerHaptic(): void {
  if (typeof window === "undefined") return;
  if (navigator?.vibrate) {
    navigator.vibrate(5);
    return;
  }
  // iOS: input[switch] trick
  const existing = document.getElementById("_haptic_sw");
  const input =
    (existing instanceof HTMLInputElement ? existing : null) ??
    (() => {
      const el = document.createElement("input");
      el.type = "checkbox";
      el.id = "_haptic_sw";
      el.setAttribute("switch", "");
      el.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
      document.body.appendChild(el);
      const label = document.createElement("label");
      label.htmlFor = "_haptic_sw";
      label.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
      document.body.appendChild(label);
      return el;
    })();
  const label = document.querySelector<HTMLElement>(`label[for="${input.id}"]`);
  label?.click();
}

type Direction = "horizontal" | "vertical";

interface UseMenuNavigationOptions {
  itemCount: number;
  direction: Direction;
  onSelect: (index: number) => void;
  onBack?: () => void;
  initialIndex?: number;
}

export function useMenuNavigation({
  itemCount,
  direction,
  onSelect,
  onBack,
  initialIndex = 0,
}: UseMenuNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const prevKey = direction === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const nextKey = direction === "horizontal" ? "ArrowRight" : "ArrowDown";

  const movePrev = useCallback(() => {
    setActiveIndex((i) => {
      if (i <= 0) return i;
      triggerHaptic();
      return i - 1;
    });
  }, []);

  const moveNext = useCallback(() => {
    setActiveIndex((i) => {
      if (i >= itemCount - 1) return i;
      triggerHaptic();
      return i + 1;
    });
  }, [itemCount]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case prevKey: {
          e.preventDefault();
          movePrev();
          break;
        }
        case nextKey: {
          e.preventDefault();
          moveNext();
          break;
        }
        case "Enter": {
          e.preventDefault();
          triggerHaptic();
          onSelect(activeIndex);
          break;
        }
        case "Escape":
        case "Backspace": {
          if (onBack) {
            e.preventDefault();
            triggerHaptic();
            onBack();
          }
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevKey, nextKey, movePrev, moveNext, onSelect, onBack, activeIndex]);

  const selectByIndex = useCallback(
    (index: number) => {
      triggerHaptic();
      setActiveIndex(index);
      onSelect(index);
    },
    [onSelect],
  );

  return { activeIndex, setActiveIndex, selectByIndex } as const;
}
