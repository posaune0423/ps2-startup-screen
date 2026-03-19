"use client";

import { useCallback } from "react";

import { getSoundEnabled, initializeSoundEnabled } from "@/lib/sound-settings";

const SE_PATHS = {
  select: "/sound/se/select.m4a",
  enter: "/sound/se/enter.m4a",
  back: "/sound/se/back.m4a",
} as const;

const seCache: Record<string, HTMLAudioElement> = {};

function playOnce(path: string): void {
  initializeSoundEnabled();
  if (!getSoundEnabled()) return;

  let audio = seCache[path];
  if (!audio) {
    audio = new Audio(path);
    audio.volume = 0.5;
    seCache[path] = audio;
  }

  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function useNavigationSound() {
  const playSelect = useCallback(() => {
    playOnce(SE_PATHS.select);
  }, []);

  const playEnter = useCallback(() => {
    playOnce(SE_PATHS.enter);
  }, []);

  const playBack = useCallback(() => {
    playOnce(SE_PATHS.back);
  }, []);

  return { playSelect, playEnter, playBack } as const;
}
