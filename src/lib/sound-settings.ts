"use client";

import { useEffect } from "react";

import { useAppStore } from "./app-store";

export function getSoundEnabled(): boolean {
  return useAppStore.getState().soundEnabled;
}

export function setSoundEnabled(nextSoundEnabled: boolean): void {
  useAppStore.getState().setSoundEnabled(nextSoundEnabled);
}

export function initializeSoundEnabled(): void {
  useAppStore.getState().hydrateSettings();
}

export function useSoundSettings() {
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const setAppSoundEnabled = useAppStore((state) => state.setSoundEnabled);

  useEffect(() => {
    initializeSoundEnabled();
  }, []);

  return {
    soundEnabled,
    setSoundEnabled: setAppSoundEnabled,
  } as const;
}
