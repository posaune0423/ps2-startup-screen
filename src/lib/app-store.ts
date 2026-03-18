"use client";

import { create } from "zustand";

import type { ActiveIndexScreenId, AppScreenId } from "./app-screen";
import { getScreenFromPath } from "./app-screen";
import type { Locale } from "./i18n";

const LOCALE_STORAGE_KEY = "ps2-locale";
const SOUND_STORAGE_KEY = "ps2-sound-enabled";

export type TransitionPhase = "idle" | "leaving" | "entering";
export type TransitionReason = "boot" | "user" | "auto" | "history" | "deep-link";
export type AssetStatus = "idle" | "loading" | "ready" | "error";
export type TransitionPreset = "startupFade" | "orbMenu" | "browserSlide" | "memoryDive" | "systemBloom";

export interface MusicScreenState {
  cursorIndex: number;
  viewMode: "grid" | "player" | "transition" | "returning";
  transportIndex: number;
}

interface ActiveIndexState {
  activeIndex: number;
}

interface ScreenStateMap {
  startup: Record<string, never>;
  menu: ActiveIndexState;
  browser: ActiveIndexState;
  memoryWork: ActiveIndexState;
  memorySns: ActiveIndexState;
  music: MusicScreenState;
  system: ActiveIndexState;
}

interface WarmupState {
  phase: "idle" | "warming" | "complete" | "partial";
  assets: Record<string, AssetStatus>;
  completedCount: number;
  totalCount: number;
  startedAt: number | null;
  finishedAt: number | null;
}

interface AppStore {
  currentScreen: AppScreenId;
  targetScreen: AppScreenId | null;
  phase: TransitionPhase;
  reason: TransitionReason;
  inputLocked: boolean;
  transitionPreset: TransitionPreset;
  locale: Locale;
  soundEnabled: boolean;
  settingsHydrated: boolean;
  screenState: ScreenStateMap;
  warmup: WarmupState;
  hydrateSettings: () => void;
  setLocale: (locale: Locale) => void;
  setSoundEnabled: (enabled: boolean) => void;
  syncScreenFromPath: (pathname: string, reason?: TransitionReason) => void;
  beginNavigation: (targetScreen: AppScreenId, reason: TransitionReason) => void;
  commitNavigation: (targetScreen: AppScreenId) => void;
  completeNavigation: () => void;
  setScreenActiveIndex: (screenId: ActiveIndexScreenId, nextIndex: number) => void;
  resetScreenState: (screenId: AppScreenId) => void;
  setMusicState: (patch: Partial<MusicScreenState>) => void;
  startWarmup: (totalCount: number) => void;
  markAssetLoading: (path: string) => void;
  markAssetReady: (path: string) => void;
  markAssetError: (path: string) => void;
  finishWarmup: () => void;
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "ja";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" ? "en" : "ja";
}

function readStoredSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
}

function createDefaultScreenState(): ScreenStateMap {
  return {
    startup: {},
    menu: { activeIndex: 0 },
    browser: { activeIndex: 0 },
    memoryWork: { activeIndex: 0 },
    memorySns: { activeIndex: 0 },
    music: { cursorIndex: 0, viewMode: "grid", transportIndex: 4 },
    system: { activeIndex: 0 },
  };
}

function createPreset(screenId: AppScreenId): TransitionPreset {
  switch (screenId) {
    case "startup":
      return "startupFade";
    case "menu":
      return "orbMenu";
    case "browser":
      return "browserSlide";
    case "memoryWork":
    case "memorySns":
    case "music":
      return "memoryDive";
    case "system":
      return "systemBloom";
  }
}

const INITIAL_SCREEN = getScreenFromPath(typeof window === "undefined" ? "/" : window.location.pathname);

export const useAppStore = create<AppStore>((set, get) => ({
  currentScreen: INITIAL_SCREEN,
  targetScreen: null,
  phase: "idle",
  reason: "boot",
  inputLocked: false,
  transitionPreset: createPreset(INITIAL_SCREEN),
  locale: "ja",
  soundEnabled: true,
  settingsHydrated: false,
  screenState: createDefaultScreenState(),
  warmup: {
    phase: "idle",
    assets: {},
    completedCount: 0,
    totalCount: 0,
    startedAt: null,
    finishedAt: null,
  },
  hydrateSettings: () => {
    if (get().settingsHydrated) return;
    const locale = readStoredLocale();
    const soundEnabled = readStoredSoundEnabled();
    set({
      locale,
      soundEnabled,
      settingsHydrated: true,
    });
  },
  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
    set({ locale });
  },
  setSoundEnabled: (enabled) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "on" : "off");
    }
    set({ soundEnabled: enabled });
  },
  syncScreenFromPath: (pathname, reason = "user") => {
    const screenId = getScreenFromPath(pathname);
    set({
      currentScreen: screenId,
      targetScreen: null,
      phase: "idle",
      reason,
      inputLocked: false,
      transitionPreset: createPreset(screenId),
    });
  },
  beginNavigation: (targetScreen, reason) =>
    set({
      targetScreen,
      phase: "leaving",
      reason,
      inputLocked: true,
      transitionPreset: createPreset(targetScreen),
    }),
  commitNavigation: (targetScreen) =>
    set({
      currentScreen: targetScreen,
      targetScreen,
      phase: "entering",
      inputLocked: true,
      transitionPreset: createPreset(targetScreen),
    }),
  completeNavigation: () =>
    set({
      targetScreen: null,
      phase: "idle",
      inputLocked: false,
    }),
  setScreenActiveIndex: (screenId, nextIndex) =>
    set((state) => ({
      screenState: {
        ...state.screenState,
        [screenId]: {
          ...state.screenState[screenId],
          activeIndex: nextIndex,
        },
      },
    })),
  resetScreenState: (screenId) =>
    set((state) => ({
      screenState: {
        ...state.screenState,
        [screenId]: createDefaultScreenState()[screenId],
      },
    })),
  setMusicState: (patch) =>
    set((state) => ({
      screenState: {
        ...state.screenState,
        music: {
          ...state.screenState.music,
          ...patch,
        },
      },
    })),
  startWarmup: (totalCount) =>
    set({
      warmup: {
        phase: "warming",
        assets: {},
        completedCount: 0,
        totalCount,
        startedAt: Date.now(),
        finishedAt: null,
      },
    }),
  markAssetLoading: (path) =>
    set((state) => {
      const current = state.warmup.assets[path];
      if (current === "ready" || current === "error") return state;
      return {
        warmup: {
          ...state.warmup,
          assets: {
            ...state.warmup.assets,
            [path]: "loading",
          },
        },
      };
    }),
  markAssetReady: (path) =>
    set((state) => {
      const current = state.warmup.assets[path];
      const wasSettled = current === "ready" || current === "error";
      return {
        warmup: {
          ...state.warmup,
          assets: {
            ...state.warmup.assets,
            [path]: "ready",
          },
          completedCount: wasSettled ? state.warmup.completedCount : state.warmup.completedCount + 1,
        },
      };
    }),
  markAssetError: (path) =>
    set((state) => {
      const current = state.warmup.assets[path];
      const wasSettled = current === "ready" || current === "error";
      return {
        warmup: {
          ...state.warmup,
          assets: {
            ...state.warmup.assets,
            [path]: "error",
          },
          completedCount: wasSettled ? state.warmup.completedCount : state.warmup.completedCount + 1,
        },
      };
    }),
  finishWarmup: () =>
    set((state) => {
      const hasErrors = Object.values(state.warmup.assets).some((status) => status === "error");
      return {
        warmup: {
          ...state.warmup,
          phase: hasErrors ? "partial" : "complete",
          finishedAt: Date.now(),
        },
      };
    }),
}));
