"use client";

import { useCallback, useEffect, useState } from "react";

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
    setActiveIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const moveNext = useCallback(() => {
    setActiveIndex((i) => (i < itemCount - 1 ? i + 1 : i));
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
          onSelect(activeIndex);
          break;
        }
        case "Escape":
        case "Backspace": {
          if (onBack) {
            e.preventDefault();
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
      setActiveIndex(index);
      onSelect(index);
    },
    [onSelect],
  );

  return { activeIndex, setActiveIndex, selectByIndex } as const;
}
