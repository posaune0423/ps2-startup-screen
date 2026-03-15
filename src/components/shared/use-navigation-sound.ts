"use client";

import type { RefObject } from "react";
import { useCallback, useRef } from "react";

import { getSoundEnabled, initializeSoundEnabled } from "@/lib/sound-settings";

const SE_PATHS = {
  select: "/sound/se/select.wav",
  enter: "/sound/se/enter.wav",
  back: "/sound/se/back.wav",
} as const;

function playOnce(audioRef: RefObject<HTMLAudioElement | null>, path: string): void {
  initializeSoundEnabled();
  if (!getSoundEnabled()) return;

  if (!audioRef.current) {
    audioRef.current = new Audio(path);
    audioRef.current.volume = 0.5;
  }

  const audio = audioRef.current;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function useNavigationSound() {
  const selectRef = useRef<HTMLAudioElement | null>(null);
  const enterRef = useRef<HTMLAudioElement | null>(null);
  const backRef = useRef<HTMLAudioElement | null>(null);

  const playSelect = useCallback(() => {
    playOnce(selectRef, SE_PATHS.select);
  }, []);

  const playEnter = useCallback(() => {
    playOnce(enterRef, SE_PATHS.enter);
  }, []);

  const playBack = useCallback(() => {
    playOnce(backRef, SE_PATHS.back);
  }, []);

  return { playSelect, playEnter, playBack } as const;
}
