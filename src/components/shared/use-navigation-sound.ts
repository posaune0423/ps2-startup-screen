"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";

import { getSoundEnabled, initializeSoundEnabled } from "@/lib/sound-settings";

const SE_PATHS = {
  select: "/sound/se/select.m4a",
  enter: "/sound/se/enter.m4a",
  back: "/sound/se/back.m4a",
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

function disposeAudio(ref: RefObject<HTMLAudioElement | null>) {
  if (!ref.current) return;
  ref.current.pause();
  ref.current.src = "";
  ref.current = null;
}

export function useNavigationSound() {
  const selectRef = useRef<HTMLAudioElement | null>(null);
  const enterRef = useRef<HTMLAudioElement | null>(null);
  const backRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      disposeAudio(selectRef);
      disposeAudio(enterRef);
      disposeAudio(backRef);
    };
  }, []);

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
