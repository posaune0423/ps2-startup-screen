"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "ps2-sound-enabled";

let soundEnabled = true;

const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function readStoredSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function initializeSoundEnabled(): void {
  const nextSoundEnabled = readStoredSoundEnabled();
  if (soundEnabled === nextSoundEnabled) return;
  soundEnabled = nextSoundEnabled;
  notifyListeners();
}

export function getSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(nextSoundEnabled: boolean): void {
  soundEnabled = nextSoundEnabled;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, nextSoundEnabled ? "on" : "off");
  }

  notifyListeners();
}

function subscribeSoundEnabled(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSoundSettings() {
  useEffect(() => {
    initializeSoundEnabled();
  }, []);

  const currentSoundEnabled = useSyncExternalStore(subscribeSoundEnabled, getSoundEnabled, () => true);

  const updateSoundEnabled = useCallback((nextSoundEnabled: boolean) => {
    setSoundEnabled(nextSoundEnabled);
  }, []);

  return {
    soundEnabled: currentSoundEnabled,
    setSoundEnabled: updateSoundEnabled,
  } as const;
}
