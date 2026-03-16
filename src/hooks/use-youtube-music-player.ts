"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MusicTrack } from "@/constants/music";
import { getSoundEnabled, initializeSoundEnabled } from "@/lib/sound-settings";
import { getYoutubeErrorMessage, parseYoutubeTrackSource } from "@/lib/youtube";

type YoutubePlayerState = "buffering" | "ended" | "error" | "idle" | "loading" | "paused" | "playing" | "ready";

interface YoutubePlayerNamespace {
  Player: new (
    element: HTMLElement,
    config: {
      events: {
        onError?: (event: { data: number }) => void;
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
      height: string;
      playerVars?: Record<string, number | string>;
      width: string;
    },
  ) => YoutubePlayerInstance;
}

interface YoutubePlayerInstance {
  cueVideoById: (options: { startSeconds?: number; videoId: string }) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (options: { startSeconds?: number; videoId: string }) => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  stopVideo: () => void;
}

declare global {
  interface Window {
    YT?: YoutubePlayerNamespace;
    onYouTubeIframeAPIReady?: (() => void) | undefined;
  }
}

let youtubeApiPromise: Promise<YoutubePlayerNamespace> | null = null;

async function loadYoutubeIframeApi(): Promise<YoutubePlayerNamespace> {
  if (typeof window === "undefined") {
    throw new TypeError("YouTube playback is only available in the browser.");
  }

  if (window.YT?.Player) {
    return window.YT;
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YoutubePlayerNamespace>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[data-youtube-iframe-api="true"]');
    const previousReady = window.onYouTubeIframeAPIReady;
    let settled = false;
    let timeoutId = 0;

    const restoreReadyHandler = () => {
      if (window.onYouTubeIframeAPIReady === handleReady) {
        window.onYouTubeIframeAPIReady = previousReady;
      }
    };

    const detachScriptErrorHandler = () => {
      script?.removeEventListener("error", handleScriptError);
    };

    const removeFailedScript = () => {
      if (!script || window.YT?.Player) return;
      detachScriptErrorHandler();
      script.remove();
      script = null;
    };

    const rejectLoad = (error: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      youtubeApiPromise = null;
      restoreReadyHandler();
      removeFailedScript();
      reject(error);
    };

    const resolveLoad = () => {
      if (settled) return;
      if (window.YT?.Player) {
        settled = true;
        window.clearTimeout(timeoutId);
        restoreReadyHandler();
        detachScriptErrorHandler();
        resolve(window.YT);
        return;
      }
      rejectLoad(new Error("YouTube API loaded without exposing window.YT.Player."));
    };

    function handleReady() {
      try {
        previousReady?.();
      } finally {
        resolveLoad();
      }
    }

    window.onYouTubeIframeAPIReady = handleReady;

    const handleScriptError = () => {
      rejectLoad(new Error("Failed to load the YouTube IFrame API."));
    };

    if (!script) {
      script = document.createElement("script");
      script.async = true;
      script.src = "https://www.youtube.com/iframe_api";
      script.dataset.youtubeIframeApi = "true";
      document.head.appendChild(script);
    }

    script.addEventListener("error", handleScriptError, { once: true });

    timeoutId = window.setTimeout(() => {
      if (!window.YT?.Player) {
        rejectLoad(new Error("Timed out while loading the YouTube IFrame API."));
      }
    }, 10000);
  });

  return youtubeApiPromise;
}

function clampTrackIndex(index: number, tracks: readonly MusicTrack[]): number {
  if (tracks.length === 0) return 0;
  return Math.max(0, Math.min(index, tracks.length - 1));
}

export function useYoutubeMusicPlayer(tracks: readonly MusicTrack[]) {
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YoutubePlayerInstance | null>(null);
  const pendingSelectionRef = useRef<{ autoplay: boolean; index: number } | null>(null);
  const activeTrackIndexRef = useRef(0);
  const currentSecondsRef = useRef(0);
  const durationSecondsRef = useRef(0);
  const isReadyRef = useRef(false);
  const suppressEndedRef = useRef(false);
  const tracksRef = useRef(tracks);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [playerState, setPlayerState] = useState<YoutubePlayerState>("loading");

  const activeTrack = useMemo(
    () => tracks[clampTrackIndex(activeTrackIndex, tracks)] ?? null,
    [activeTrackIndex, tracks],
  );

  useEffect(() => {
    activeTrackIndexRef.current = activeTrackIndex;
  }, [activeTrackIndex]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const publishProgress = useCallback((nextCurrentSeconds: number, nextDurationSeconds: number) => {
    if (nextCurrentSeconds !== currentSecondsRef.current) {
      currentSecondsRef.current = nextCurrentSeconds;
      setCurrentSeconds(nextCurrentSeconds);
    }

    if (nextDurationSeconds !== durationSecondsRef.current) {
      durationSecondsRef.current = nextDurationSeconds;
      setDurationSeconds(nextDurationSeconds);
    }
  }, []);

  const syncProgress = useCallback(() => {
    const player = playerRef.current;
    const active = activeTrack;
    if (!player || !active) return;

    try {
      const parsedTrack = parseYoutubeTrackSource(active.youtubeUrl);
      const absoluteCurrentTime = player.getCurrentTime() || 0;
      const absoluteDuration = player.getDuration() || 0;
      const nextCurrentSeconds = Math.floor(Math.max(0, absoluteCurrentTime - parsedTrack.startSeconds));
      const nextDurationSeconds = Math.floor(Math.max(0, absoluteDuration - parsedTrack.startSeconds));

      publishProgress(nextCurrentSeconds, nextDurationSeconds);
    } catch {
      // Ignore transient YouTube API timing failures during teardown/buffering.
    }
  }, [activeTrack, publishProgress]);

  const applyTrackSelection = useCallback(
    (index: number, autoplay: boolean) => {
      const nextIndex = clampTrackIndex(index, tracks);
      const nextTrack = tracks[nextIndex];
      if (!nextTrack) return;

      initializeSoundEnabled();
      setActiveTrackIndex(nextIndex);
      publishProgress(0, 0);
      setErrorMessage(null);

      if (!getSoundEnabled()) {
        setNoticeMessage("Sound is off. Turn it on in System Configuration to play music.");
        setPlayerState("paused");
        return;
      }

      const player = playerRef.current;

      try {
        const parsed = parseYoutubeTrackSource(nextTrack.youtubeUrl);

        if (!player || !isReadyRef.current) {
          pendingSelectionRef.current = { autoplay, index: nextIndex };
          setNoticeMessage("Loading YouTube player...");
          setPlayerState("loading");
          return;
        }

        setNoticeMessage(autoplay ? `Preparing Track ${nextTrack.number}...` : `Queued Track ${nextTrack.number}.`);
        setPlayerState("loading");
        suppressEndedRef.current = false;

        if (autoplay) {
          player.loadVideoById(parsed);
        } else {
          player.cueVideoById(parsed);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to send the selected track to YouTube.");
        setPlayerState("error");
      }
    },
    [publishProgress, tracks],
  );

  const applyTrackSelectionRef = useRef(applyTrackSelection);

  useEffect(() => {
    applyTrackSelectionRef.current = applyTrackSelection;
  }, [applyTrackSelection]);

  const runPlayerCommand = useCallback(
    (
      command: (player: YoutubePlayerInstance, parsedTrack: ReturnType<typeof parseYoutubeTrackSource>) => void,
      fallbackError: string,
    ) => {
      const player = playerRef.current;
      if (!player || !activeTrack) {
        setNoticeMessage("Select a track to start playback.");
        return;
      }

      initializeSoundEnabled();
      if (!getSoundEnabled()) {
        setNoticeMessage("Sound is off. Turn it on in System Configuration to play music.");
        setPlayerState("paused");
        return;
      }

      try {
        command(player, parseYoutubeTrackSource(activeTrack.youtubeUrl));
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : fallbackError);
        setPlayerState("error");
      }
    },
    [activeTrack],
  );

  const selectTrack = useCallback(
    (index: number, autoplay = true) => {
      applyTrackSelection(index, autoplay);
    },
    [applyTrackSelection],
  );

  const play = useCallback(() => {
    runPlayerCommand((player, parsedTrack) => {
      if (playerState === "idle" || playerState === "ended") {
        player.loadVideoById(parsedTrack);
        return;
      }
      player.playVideo();
    }, "Failed to resume YouTube playback.");
  }, [playerState, runPlayerCommand]);

  const pause = useCallback(() => {
    runPlayerCommand((player) => {
      player.pauseVideo();
      setNoticeMessage("Playback paused.");
      setPlayerState("paused");
    }, "Failed to pause the current track.");
  }, [runPlayerCommand]);

  const stop = useCallback(() => {
    runPlayerCommand((player, parsedTrack) => {
      suppressEndedRef.current = true;
      player.stopVideo();
      player.cueVideoById(parsedTrack);
      publishProgress(0, 0);
      setNoticeMessage("Playback stopped.");
      setPlayerState("idle");
    }, "Failed to stop the current track.");
  }, [publishProgress, runPlayerCommand]);

  const seekBy = useCallback(
    (seconds: number) => {
      runPlayerCommand((player, parsedTrack) => {
        const logicalCurrentTime = Math.max(0, player.getCurrentTime() - parsedTrack.startSeconds);
        const nextTime = Math.max(0, logicalCurrentTime + seconds);
        player.seekTo(parsedTrack.startSeconds + nextTime, true);
        syncProgress();
      }, "Failed to seek within the current track.");
    },
    [runPlayerCommand, syncProgress],
  );

  const prevTrack = useCallback(() => {
    const nextIndex = clampTrackIndex(activeTrackIndex - 1, tracks);
    if (nextIndex === activeTrackIndex) {
      setNoticeMessage("Already on the first track.");
      return;
    }

    applyTrackSelection(nextIndex, true);
  }, [activeTrackIndex, applyTrackSelection, tracks]);

  const nextTrack = useCallback(() => {
    const nextIndex = clampTrackIndex(activeTrackIndex + 1, tracks);
    if (nextIndex === activeTrackIndex) {
      setNoticeMessage("Already on the last track.");
      return;
    }

    applyTrackSelection(nextIndex, true);
  }, [activeTrackIndex, applyTrackSelection, tracks]);

  const retry = useCallback(() => {
    applyTrackSelection(activeTrackIndex, true);
  }, [activeTrackIndex, applyTrackSelection]);

  useEffect(() => {
    const host = playerHostRef.current;
    if (!host) return;

    let disposed = false;

    loadYoutubeIframeApi()
      .then((YT) => {
        if (disposed || !playerHostRef.current) return;

        playerRef.current = new YT.Player(playerHostRef.current, {
          events: {
            onError: (event) => {
              setErrorMessage(getYoutubeErrorMessage(event.data));
              setNoticeMessage(null);
              setPlayerState("error");
            },
            onReady: () => {
              isReadyRef.current = true;
              setIsReady(true);
              setNoticeMessage("YouTube player ready.");
              setPlayerState("ready");

              if (pendingSelectionRef.current) {
                const pending = pendingSelectionRef.current;
                pendingSelectionRef.current = null;
                applyTrackSelectionRef.current(pending.index, pending.autoplay);
              }
            },
            onStateChange: (event) => {
              switch (event.data) {
                case -1:
                  setPlayerState("loading");
                  break;
                case 0:
                  if (suppressEndedRef.current) {
                    suppressEndedRef.current = false;
                    setPlayerState("idle");
                    setNoticeMessage("Playback stopped.");
                    break;
                  }

                  if (activeTrackIndexRef.current < tracksRef.current.length - 1) {
                    const upcomingTrack = tracksRef.current[activeTrackIndexRef.current + 1];
                    if (upcomingTrack) {
                      setNoticeMessage(`Advancing to Track ${upcomingTrack.number}...`);
                      applyTrackSelectionRef.current(activeTrackIndexRef.current + 1, true);
                      break;
                    }
                  }

                  setPlayerState("ended");
                  setNoticeMessage("Track finished.");
                  break;
                case 1:
                  setPlayerState("playing");
                  setNoticeMessage(null);
                  break;
                case 2:
                  setPlayerState("paused");
                  break;
                case 3:
                  setPlayerState("buffering");
                  setNoticeMessage("Buffering YouTube playback...");
                  break;
                case 5:
                  setPlayerState("ready");
                  break;
                default:
                  break;
              }
            },
          },
          height: "0",
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          width: "0",
        });
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Failed to initialize the YouTube player.");
        setPlayerState("error");
      });

    return () => {
      disposed = true;
      isReadyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const intervalId = window.setInterval(syncProgress, 250);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReady, syncProgress]);

  return {
    activeTrack,
    activeTrackIndex,
    currentSeconds,
    durationSeconds,
    errorMessage,
    isReady,
    nextTrack,
    noticeMessage,
    pause,
    play,
    playerHostRef,
    playerState,
    prevTrack,
    retry,
    seekBy,
    selectTrack,
    stop,
  } as const;
}
