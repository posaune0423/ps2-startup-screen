"use client";

import { useCallback, useEffect } from "react";

import type { ActiveIndexScreenId } from "@/lib/app-screen";
import { useAppStore } from "@/lib/app-store";

function triggerHaptic(): void {
  if (typeof window === "undefined") return;
  if (navigator?.vibrate) {
    navigator.vibrate(5);
    return;
  }
  // iOS: input[switch] trick
  const existing = document.getElementById("_haptic_sw");
  if (existing && !(existing instanceof HTMLInputElement)) {
    existing.remove();
    const strayLabel = document.querySelector(`label[for="${existing.id}"]`);
    strayLabel?.remove();
  }
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
  screenId: ActiveIndexScreenId;
  itemCount: number;
  direction: Direction;
  onSelect: (index: number) => void;
  onBack?: () => void;
  onMove?: () => void;
  initialIndex?: number;
  enabled?: boolean;
}

export function useMenuNavigation({
  screenId,
  itemCount,
  direction,
  onSelect,
  onBack,
  onMove,
  initialIndex = 0,
  enabled = true,
}: UseMenuNavigationOptions) {
  const activeIndex = useAppStore((state) => state.screenState[screenId].activeIndex);
  const setScreenActiveIndex = useAppStore((state) => state.setScreenActiveIndex);
  const inputLocked = useAppStore((state) => state.inputLocked);

  const prevKey = direction === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const nextKey = direction === "horizontal" ? "ArrowRight" : "ArrowDown";

  const setActiveIndex = useCallback(
    (next: number | ((current: number) => number)) => {
      const current = useAppStore.getState().screenState[screenId].activeIndex;
      const nextIndex = typeof next === "function" ? next(current) : next;
      const clampedIndex = Math.max(0, Math.min(itemCount - 1, nextIndex));
      setScreenActiveIndex(screenId, clampedIndex);
    },
    [itemCount, screenId, setScreenActiveIndex],
  );

  useEffect(() => {
    if (activeIndex >= itemCount) {
      setScreenActiveIndex(screenId, Math.max(0, itemCount - 1));
      return;
    }
    if (activeIndex < 0) {
      setScreenActiveIndex(screenId, initialIndex);
    }
  }, [activeIndex, initialIndex, itemCount, screenId, setScreenActiveIndex]);

  const movePrev = useCallback(() => {
    if (activeIndex <= 0) return;
    setScreenActiveIndex(screenId, activeIndex - 1);
    triggerHaptic();
    onMove?.();
  }, [activeIndex, onMove, screenId, setScreenActiveIndex]);

  const moveNext = useCallback(() => {
    if (activeIndex >= itemCount - 1) return;
    setScreenActiveIndex(screenId, activeIndex + 1);
    triggerHaptic();
    onMove?.();
  }, [activeIndex, itemCount, onMove, screenId, setScreenActiveIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!enabled || inputLocked) return;

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
  }, [activeIndex, enabled, inputLocked, moveNext, movePrev, nextKey, onBack, onSelect, prevKey]);

  const selectByIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(itemCount - 1, index));
      triggerHaptic();
      setScreenActiveIndex(screenId, clampedIndex);
      onSelect(clampedIndex);
    },
    [itemCount, onSelect, screenId, setScreenActiveIndex],
  );

  return { activeIndex, setActiveIndex, selectByIndex } as const;
}
