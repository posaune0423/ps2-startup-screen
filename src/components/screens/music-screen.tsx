"use client";

import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { MediaControlIcon } from "@/components/shared/media-icons";
import { SHOW_THREE_SCENE_HELPER, ThreeSceneHelperPanel } from "@/components/shared/three-scene-helper-panel";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { MUSIC_TRACKS } from "@/constants/music";
import type { MusicTrack } from "@/constants/music";
import { useYoutubeMusicPlayer } from "@/hooks/use-youtube-music-player";
import { stopAmbientAudio } from "@/lib/ambient-audio";
import { useAppStore } from "@/lib/app-store";
import { formatElapsedTime, HIDDEN_YOUTUBE_PLAYER_DIMENSION } from "@/lib/youtube";

const GRID_COLUMNS = { desktop: 5, mobile: 4 } as const;
const PLAYER_TRANSITION_MS = 900;
const PLAYER_CUBE_SIZE = { desktop: 188, mobile: 128 } as const;
const GRID_LAYOUT = {
  desktop: {
    boxSize: 98,
    gapX: 28,
    gapY: 46,
  },
  mobile: {
    boxSize: 64,
    gapX: 14,
    gapY: 32,
  },
} as const;
const GRID_CAMERA_TILT = "rotateX(38deg)";
const GRID_CAMERA = {
  desktop: {
    perspective: "1600px",
    perspectiveOrigin: "50% 36%",
    transform: GRID_CAMERA_TILT,
  },
  mobile: {
    perspective: "1200px",
    perspectiveOrigin: "50% 32%",
    transform: "rotateX(34deg) scale(0.98)",
  },
} as const;
const PLAYER_CAMERA = {
  perspective: "1160px",
  perspectiveOrigin: "50% 36%",
  transform: GRID_CAMERA_TILT,
} as const;
const SR_ONLY_STYLE = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
} as const satisfies React.CSSProperties;

interface CubeRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

interface TransitionCubeState {
  fromRect: CubeRect;
  gridPerspective?: string;
  gridPerspectiveOrigin?: string;
  returning?: boolean;
  returnSpinAngle?: number;
  settled: boolean;
  spinOffset: number;
  toRect: CubeRect;
  track: MusicTrack;
}

function toViewportRect(rect: DOMRect): CubeRect {
  return {
    height: rect.height,
    left: rect.left,
    top: rect.top,
    width: rect.width,
  };
}

function createLiveRegionMessage({
  errorMessage,
  isReady,
  noticeMessage,
  playerState,
}: {
  errorMessage: string | null;
  isReady: boolean;
  noticeMessage: string | null;
  playerState: string;
}) {
  if (errorMessage) return errorMessage;
  if (noticeMessage) return noticeMessage;
  return isReady ? `Player state ${playerState}.` : "Player booting.";
}

export function MusicScreen({
  active = true,
  transparentBackground = false,
}: {
  active?: boolean;
  transparentBackground?: boolean;
}) {
  const { playEnter, playSelect } = useNavigationSound();
  const { isMobile, isPortrait } = useViewport();
  const compact = isMobile || isPortrait;
  const columnCount = compact ? GRID_COLUMNS.mobile : GRID_COLUMNS.desktop;
  const gridLayout = compact ? GRID_LAYOUT.mobile : GRID_LAYOUT.desktop;
  const gridCamera = compact ? GRID_CAMERA.mobile : GRID_CAMERA.desktop;
  const playerCubeSize = compact ? PLAYER_CUBE_SIZE.mobile : PLAYER_CUBE_SIZE.desktop;
  const cursorIndex = useAppStore((state) => state.screenState.music.cursorIndex);
  const viewMode = useAppStore((state) => state.screenState.music.viewMode);
  const transportIndex = useAppStore((state) => state.screenState.music.transportIndex);
  const setMusicState = useAppStore((state) => state.setMusicState);
  const [transitionCube, setTransitionCube] = useState<TransitionCubeState | null>(null);
  const [enteredCount, setEnteredCount] = useState(0);
  const {
    activeTrackIndex,
    currentSeconds,
    errorMessage,
    isReady,
    noticeMessage,
    playerHostRef,
    playerState,
    nextTrack,
    pause,
    play,
    prevTrack,
    retry,
    seekBy,
    selectTrack,
    stop,
  } = useYoutubeMusicPlayer(MUSIC_TRACKS);
  const trackButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const playerDockRef = useRef<HTMLDivElement | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const spinStartTimeRef = useRef(0);
  const playerSpinOffsetRef = useRef(0);
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  useEffect(() => {
    if (!active) setEnteredCount(0);
  }, [active]);

  const currentTrack = MUSIC_TRACKS[viewMode === "grid" ? cursorIndex : activeTrackIndex] ?? MUSIC_TRACKS[0];
  const activeTrack = MUSIC_TRACKS[activeTrackIndex] ?? MUSIC_TRACKS[0];
  const liveRegionMessage = useMemo(
    () =>
      createLiveRegionMessage({
        errorMessage,
        isReady,
        noticeMessage,
        playerState,
      }),
    [errorMessage, isReady, noticeMessage, playerState],
  );

  useEffect(() => {
    if (!active) return;
    stopAmbientAudio();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    if (enteredCount >= MUSIC_TRACKS.length) return;
    const timer = window.setTimeout(() => {
      setEnteredCount((c) => c + 1);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [enteredCount, active]);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current === null) return;
    window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
  }, []);

  const handleBackToGrid = useCallback(() => {
    stop();

    const source = playerDockRef.current;
    const targetIndex = activeTrackIndex;
    const track = MUSIC_TRACKS[targetIndex];

    if (!source || !track) {
      setMusicState({ transportIndex: 4, viewMode: "grid" });
      return;
    }

    clearTransitionTimer();

    const sourceRect = toViewportRect(source.getBoundingClientRect());
    const elapsedMs = performance.now() - spinStartTimeRef.current;
    let spinAngle = ((elapsedMs / 14000) * 360) % 360;
    if (spinAngle > 180) spinAngle -= 360;

    flushSync(() => {
      setMusicState({ viewMode: "returning", cursorIndex: targetIndex });
      setTransitionCube({
        fromRect: sourceRect,
        gridPerspective: gridCamera.perspective,
        gridPerspectiveOrigin: gridCamera.perspectiveOrigin,
        returning: true,
        returnSpinAngle: spinAngle,
        settled: false,
        spinOffset: 0,
        toRect: sourceRect,
        track,
      });
    });

    const targetButton = trackButtonRefs.current[targetIndex];
    if (!targetButton) {
      setTransitionCube(null);
      setMusicState({ transportIndex: 4, viewMode: "grid" });
      return;
    }
    const targetRect = toViewportRect(targetButton.getBoundingClientRect());

    window.requestAnimationFrame(() => {
      setTransitionCube((current) =>
        current && current.track.id === track.id ? { ...current, toRect: targetRect, settled: true } : current,
      );

      transitionTimerRef.current = window.setTimeout(() => {
        clearTransitionTimer();
        setTransitionCube(null);
        setMusicState({ transportIndex: 4, viewMode: "grid" });
      }, PLAYER_TRANSITION_MS + 60);
    });
  }, [
    activeTrackIndex,
    clearTransitionTimer,
    gridCamera.perspective,
    gridCamera.perspectiveOrigin,
    setMusicState,
    stop,
  ]);

  useEffect(() => {
    function interceptBack(e: Event) {
      if (!active) return;
      if (viewModeRef.current !== "player") return;
      e.preventDefault();
      handleBackToGrid();
    }
    window.addEventListener("app:navigate", interceptBack);
    return () => window.removeEventListener("app:navigate", interceptBack);
  }, [active, handleBackToGrid]);

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  const completeTransition = useCallback(() => {
    clearTransitionTimer();
    playerSpinOffsetRef.current = performance.now() - spinStartTimeRef.current;
    setTransitionCube(null);
    setMusicState({ viewMode: "player" });
  }, [clearTransitionTimer, setMusicState]);

  const handleActivateTrack = useCallback(
    (index: number) => {
      const selectedTrack = MUSIC_TRACKS[index];
      if (!selectedTrack) return;

      playEnter();
      selectTrack(index, true);
      setMusicState({ cursorIndex: index });

      const source = trackButtonRefs.current[index];
      const target = playerDockRef.current;

      if (!source || !target) {
        startTransition(() => {
          setMusicState({ viewMode: "player" });
        });
        return;
      }

      clearTransitionTimer();
      spinStartTimeRef.current = performance.now();

      const fromRect = toViewportRect(source.getBoundingClientRect());

      flushSync(() => {
        setMusicState({ viewMode: "transition" });
        setTransitionCube({
          fromRect,
          settled: false,
          spinOffset: 0,
          toRect: fromRect,
          track: selectedTrack,
        });
      });

      const toRect = toViewportRect(target.getBoundingClientRect());

      window.requestAnimationFrame(() => {
        setTransitionCube((current) =>
          current && current.track.id === selectedTrack.id ? { ...current, toRect, settled: true } : current,
        );
      });

      transitionTimerRef.current = window.setTimeout(completeTransition, PLAYER_TRANSITION_MS + 60);
    },
    [clearTransitionTimer, completeTransition, playEnter, selectTrack, setMusicState],
  );

  const moveCursor = useCallback(
    (nextIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(nextIndex, MUSIC_TRACKS.length - 1));
      if (cursorIndex !== clampedIndex) {
        playSelect();
      }
      setMusicState({ cursorIndex: clampedIndex });
      return clampedIndex;
    },
    [cursorIndex, playSelect, setMusicState],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!active) return;
      if (viewMode === "transition" || viewMode === "returning") {
        return;
      }

      if (viewMode === "grid") {
        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            moveCursor(cursorIndex - 1);
            break;
          case "ArrowRight":
            event.preventDefault();
            moveCursor(cursorIndex + 1);
            break;
          case "ArrowUp":
            event.preventDefault();
            moveCursor(cursorIndex - columnCount);
            break;
          case "ArrowDown":
            event.preventDefault();
            moveCursor(cursorIndex + columnCount);
            break;
          case "Enter":
            event.preventDefault();
            handleActivateTrack(cursorIndex);
            break;
        }
        return;
      }

      const transportActions = [
        prevTrack,
        () => seekBy(-10),
        () => seekBy(10),
        nextTrack,
        errorMessage ? retry : play,
        pause,
        stop,
      ];
      const TRANSPORT_COUNT = transportActions.length;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          setMusicState({
            transportIndex: transportIndex > 0 ? transportIndex - 1 : transportIndex,
          });
          if (transportIndex > 0) playSelect();
          break;
        case "ArrowRight":
          event.preventDefault();
          setMusicState({
            transportIndex: transportIndex < TRANSPORT_COUNT - 1 ? transportIndex + 1 : transportIndex,
          });
          if (transportIndex < TRANSPORT_COUNT - 1) playSelect();
          break;
        case "ArrowUp":
          event.preventDefault();
          prevTrack();
          break;
        case "ArrowDown":
          event.preventDefault();
          nextTrack();
          break;
        case "Enter":
          event.preventDefault();
          transportActions[transportIndex]?.();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    columnCount,
    cursorIndex,
    errorMessage,
    handleActivateTrack,
    moveCursor,
    nextTrack,
    pause,
    play,
    playSelect,
    playerState,
    prevTrack,
    retry,
    seekBy,
    setMusicState,
    stop,
    transportIndex,
    viewMode,
    active,
  ]);

  return (
    <div
      style={{
        background: transparentBackground
          ? "transparent"
          : "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.18), transparent 18%), linear-gradient(180deg, #D0D0CE 0%, #B7B7B4 54%, #A5A5A2 100%)",
        color: "#FFFFFF",
        height: "100dvh",
        overflow: "hidden",
        position: "relative",
        width: "100vw",
      }}
    >
      <style>{`
        @keyframes music-cube-twist-walk {
          0%   { transform: rotate3d(1, 1, 0.75, 0deg); }
          100% { transform: rotate3d(1, 1, 0.75, 360deg); }
        }
      `}</style>

      <div
        ref={playerHostRef}
        style={{
          height: HIDDEN_YOUTUBE_PLAYER_DIMENSION,
          left: -9999,
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          top: -9999,
          width: HIDDEN_YOUTUBE_PLAYER_DIMENSION,
        }}
      />

      <div
        style={{
          alignItems: "flex-start",
          display: "flex",
          justifyContent: viewMode === "grid" || viewMode === "returning" ? "space-between" : "flex-end",
          left: 0,
          padding: compact ? "16px 20px 0" : "28px 52px 0",
          pointerEvents: "none",
          position: "absolute",
          right: 0,
          top: 0,
          zIndex: 20,
        }}
      >
        {viewMode === "grid" || viewMode === "returning" ? (
          <div
            className="ps2-text"
            style={{
              color: "#F1F5FA",
              fontSize: compact ? "clamp(22px, 5.2vw, 34px)" : "clamp(28px, 2.8vw, 42px)",
              fontWeight: 700,
              letterSpacing: "0.01em",
              transformOrigin: "left center",
            }}
          >
            Audio CD
          </div>
        ) : null}
        <div
          className="ps2-text"
          style={{
            color: "#D7CF2B",
            fontSize: compact ? "clamp(26px, 6vw, 38px)" : "clamp(34px, 3.1vw, 50px)",
            fontWeight: 700,
            letterSpacing: "0.02em",
            textAlign: "right",
            transformOrigin: "right center",
          }}
        >
          Track {currentTrack.number}
        </div>
      </div>

      <div style={{ inset: 0, position: "absolute" }}>
        <div
          style={{
            left: "50%",
            maxWidth: compact ? "min(92vw, 440px)" : "min(76vw, 980px)",
            opacity: viewMode === "grid" || viewMode === "returning" ? 1 : 0,
            paddingTop: compact ? "28vh" : "22vh",
            pointerEvents: viewMode === "grid" ? "auto" : "none",
            position: "absolute",
            top: 0,
            transform:
              viewMode === "grid" || viewMode === "returning"
                ? "translateX(-50%)"
                : "translateX(-50%) translateY(24px)",
            transition:
              viewMode === "returning"
                ? `opacity ${PLAYER_TRANSITION_MS}ms ease-out`
                : "opacity 220ms ease, transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              perspective: gridCamera.perspective,
              perspectiveOrigin: gridCamera.perspectiveOrigin,
              width: "100%",
            }}
          >
            <div
              style={{
                position: "relative",
                transform: gridCamera.transform,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: `${gridLayout.gapY}px ${gridLayout.gapX}px`,
                  gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  transformStyle: "preserve-3d",
                }}
              >
                {MUSIC_TRACKS.map((track, index) => {
                  const isTravelTarget = transitionCube?.track.id === track.id;
                  const returningSettled =
                    isTravelTarget && transitionCube?.returning === true && transitionCube?.settled;
                  const hiddenForTravel = isTravelTarget && !returningSettled;

                  return (
                    <button
                      key={track.id}
                      ref={(node) => {
                        trackButtonRefs.current[index] = node;
                      }}
                      type="button"
                      onClick={() => handleActivateTrack(index)}
                      style={{
                        alignItems: "center",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "center",
                        opacity: hiddenForTravel ? 0 : 1,
                        padding: 0,
                        transformStyle: "preserve-3d",
                        transition: returningSettled ? `opacity 0s linear ${RETURN_CROSSFADE_DELAY_MS}ms` : undefined,
                      }}
                    >
                      <TrackCube
                        boxSize={gridLayout.boxSize}
                        color={track.accentColor}
                        entered={index < enteredCount}
                        isCursor={index === cursorIndex}
                        isSpinning={false}
                        number={track.number}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: compact ? "72px" : "64px",
            inset: 0,
            justifyContent: compact ? "center" : "center",
            opacity: viewMode === "player" || viewMode === "transition" ? 1 : 0,
            padding: compact ? "0 26px 48px" : "80px 64px 108px",
            pointerEvents: viewMode === "player" ? "auto" : "none",
            position: "absolute",
            transform: `translateY(${viewMode === "player" || viewMode === "transition" || viewMode === "returning" ? "0" : "24px"})`,
            transition:
              viewMode === "returning"
                ? `opacity ${PLAYER_TRANSITION_MS}ms ease-out`
                : "opacity 360ms ease, transform 620ms cubic-bezier(0.22, 1, 0.36, 1)",
            flexDirection: compact ? "column" : "row",
          }}
        >
          <div
            style={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: compact ? 0 : 280 }}
          >
            <div
              ref={playerDockRef}
              style={{
                alignItems: "center",
                display: "flex",
                height: playerCubeSize,
                justifyContent: "center",
                position: "relative",
                width: playerCubeSize,
              }}
            >
              {viewMode === "player" && !transitionCube ? (
                <TrackCube
                  boxSize={playerCubeSize}
                  color={activeTrack.accentColor}
                  isCursor={false}
                  isSpinning
                  number={activeTrack.number}
                  spinOffset={playerSpinOffsetRef.current}
                />
              ) : (
                <div
                  style={{
                    borderRadius: "16px",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
                    height: "100%",
                    opacity: 0.12,
                    width: "100%",
                  }}
                />
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: compact ? "12px" : "22px",
              justifyContent: "center",
            }}
          >
            <div
              className="ps2-text"
              style={{
                color: "#D7CF2B",
                fontSize: compact ? "clamp(34px, 8vw, 50px)" : "clamp(40px, 3.8vw, 60px)",
                fontWeight: 700,
                letterSpacing: "0.02em",
                lineHeight: 1.1,
                transformOrigin: "left center",
                whiteSpace: "nowrap",
              }}
            >
              Track {currentTrack.number}
            </div>

            <div
              className="ps2-text"
              style={{
                color: "#F6F8FB",
                fontSize: compact ? "clamp(28px, 6.8vw, 42px)" : "clamp(36px, 3.4vw, 56px)",
                fontWeight: 700,
                letterSpacing: "0.02em",
                lineHeight: 1.1,
                transformOrigin: "left center",
                whiteSpace: "nowrap",
              }}
            >
              {formatElapsedTime(currentSeconds)}
            </div>

            <div style={{ alignItems: "center", display: "flex", gap: compact ? "8px" : "12px" }}>
              <TransportButton aria-label="Previous track" isCursor={transportIndex === 0} onClick={prevTrack}>
                <MediaControlIcon active={transportIndex === 0} name="previous" size={compact ? 22 : 28} />
              </TransportButton>
              <TransportButton
                aria-label="Seek backward 10 seconds"
                isCursor={transportIndex === 1}
                onClick={() => seekBy(-10)}
              >
                <MediaControlIcon active={transportIndex === 1} name="seekBack" size={compact ? 22 : 28} />
              </TransportButton>
              <TransportButton
                aria-label="Seek forward 10 seconds"
                isCursor={transportIndex === 2}
                onClick={() => seekBy(10)}
              >
                <MediaControlIcon active={transportIndex === 2} name="seekForward" size={compact ? 22 : 28} />
              </TransportButton>
              <TransportButton aria-label="Next track" isCursor={transportIndex === 3} onClick={nextTrack}>
                <MediaControlIcon active={transportIndex === 3} name="next" size={compact ? 22 : 28} />
              </TransportButton>
              <TransportButton aria-label="Play" isCursor={transportIndex === 4} onClick={errorMessage ? retry : play}>
                <MediaControlIcon active={transportIndex === 4} name="play" size={compact ? 22 : 28} />
              </TransportButton>
              <TransportButton aria-label="Pause" isCursor={transportIndex === 5} onClick={pause}>
                <MediaControlIcon active={transportIndex === 5} name="pause" size={compact ? 22 : 28} />
              </TransportButton>
              <TransportButton aria-label="Stop" isCursor={transportIndex === 6} onClick={stop}>
                <MediaControlIcon active={transportIndex === 6} name="stop" size={compact ? 22 : 28} />
              </TransportButton>
            </div>
          </div>
        </div>
      </div>

      {SHOW_THREE_SCENE_HELPER ? <MusicGridDebugPanel columnCount={columnCount} /> : null}

      {transitionCube ? <TransitioningTrackCube track={transitionCube.track} transitionCube={transitionCube} /> : null}

      <div aria-live="polite" style={SR_ONLY_STYLE}>
        {liveRegionMessage}
      </div>
    </div>
  );
}

const RETURN_EASING = `cubic-bezier(0.2, 0.9, 0.2, 1)`;
const RETURN_CROSSFADE_DELAY_MS = Math.round(PLAYER_TRANSITION_MS * 0.88);
const RETURN_CROSSFADE_MS = 60;

function TransitioningTrackCube({ track, transitionCube }: { track: MusicTrack; transitionCube: TransitionCubeState }) {
  const currentRect = transitionCube.settled ? transitionCube.toRect : transitionCube.fromRect;
  const isReturning = transitionCube.returning === true;

  const fadeOut = isReturning && transitionCube.settled;

  return (
    <div
      style={{
        filter: transitionCube.settled
          ? "drop-shadow(0 16px 22px rgba(0,0,0,0.18))"
          : "drop-shadow(0 10px 16px rgba(0,0,0,0.16))",
        height: currentRect.height,
        left: currentRect.left,
        opacity: fadeOut ? 0 : 1,
        pointerEvents: "none",
        position: "fixed",
        top: currentRect.top,
        transition: `left ${PLAYER_TRANSITION_MS}ms ${RETURN_EASING}, top ${PLAYER_TRANSITION_MS}ms ${RETURN_EASING}, width ${PLAYER_TRANSITION_MS}ms ${RETURN_EASING}, height ${PLAYER_TRANSITION_MS}ms ${RETURN_EASING}, filter 420ms ease${fadeOut ? `, opacity ${RETURN_CROSSFADE_MS}ms ease ${RETURN_CROSSFADE_DELAY_MS}ms` : ""}`,
        width: currentRect.width,
        zIndex: 18,
      }}
    >
      {isReturning ? (
        <div
          style={{
            height: "100%",
            perspective: transitionCube.settled
              ? (transitionCube.gridPerspective ?? "1600px")
              : PLAYER_CAMERA.perspective,
            perspectiveOrigin: transitionCube.settled
              ? (transitionCube.gridPerspectiveOrigin ?? "50% 36%")
              : PLAYER_CAMERA.perspectiveOrigin,
            transition: `perspective ${PLAYER_TRANSITION_MS}ms ${RETURN_EASING}, perspective-origin ${PLAYER_TRANSITION_MS}ms ${RETURN_EASING}`,
            width: "100%",
          }}
        >
          <div
            style={{
              height: "100%",
              transform: PLAYER_CAMERA.transform,
              transformStyle: "preserve-3d",
              width: "100%",
            }}
          >
            <div
              style={{
                height: "100%",
                transform: transitionCube.settled
                  ? "rotate3d(1, 1, 0.75, 0deg)"
                  : `rotate3d(1, 1, 0.75, ${transitionCube.returnSpinAngle ?? 0}deg)`,
                transformStyle: "preserve-3d",
                transition: `transform ${PLAYER_TRANSITION_MS}ms ${RETURN_EASING}`,
                width: "100%",
              }}
            >
              <TrackCube
                boxSize={currentRect.width}
                color={track.accentColor}
                isCursor={false}
                isSpinning={false}
                number={track.number}
              />
            </div>
          </div>
        </div>
      ) : (
        <TrackCube
          boxSize={currentRect.width}
          color={track.accentColor}
          isCursor={false}
          isSpinning
          number={track.number}
          spinOffset={transitionCube.spinOffset}
        />
      )}
    </div>
  );
}

function MusicGridDebugPanel({ columnCount }: { columnCount: number }) {
  const rows = Math.ceil(MUSIC_TRACKS.length / columnCount);
  const debugCubes = useMemo(() => {
    const stepX = 1.35;
    const stepY = 1.7;
    const size = 0.88;
    const xOffset = ((columnCount - 1) * stepX) / 2;
    const yOffset = ((rows - 1) * stepY) / 2;

    return MUSIC_TRACKS.map((track, index) => {
      const column = index % columnCount;
      const row = Math.floor(index / columnCount);

      return {
        color: track.accentColor,
        position: [column * stepX - xOffset, row * stepY - yOffset, size / 2] as const,
      };
    });
  }, [columnCount, rows]);

  return (
    <ThreeSceneHelperPanel
      axesSize={4}
      cameraPosition={[3.2, -3.5, 8.5]}
      cameraUp={[0, 0, 1]}
      lookAt={[0, -0.5, 0]}
      panelStyle={{ bottom: "88px", left: "20px" }}
      plane="xy"
      size={12}
      divisions={12}
    >
      {debugCubes.map((cube) => (
        <mesh key={`${cube.color}-${cube.position.join("-")}`} position={cube.position}>
          <boxGeometry args={[0.88, 0.88, 0.88]} />
          <meshStandardMaterial color={cube.color} opacity={0.7} transparent />
        </mesh>
      ))}
    </ThreeSceneHelperPanel>
  );
}

function TransportButton({
  "aria-label": ariaLabel,
  children,
  isCursor = false,
  onClick,
}: {
  "aria-label": string;
  children: React.ReactNode;
  isCursor?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        alignItems: "center",
        background: "transparent",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        display: "inline-flex",
        filter: isCursor ? "drop-shadow(0 0 8px rgba(255,255,255,0.9))" : "none",
        justifyContent: "center",
        outline: "none",
        padding: "4px",
        transform: isCursor ? "scale(1.12)" : "scale(1)",
        transition: "transform 140ms ease, filter 140ms ease",
      }}
    >
      {children}
    </button>
  );
}

const TrackCube = React.memo(function TrackCube({
  boxSize,
  color,
  entered = true,
  isCursor,
  isSpinning,
  number,
  spinOffset = 0,
}: {
  boxSize: number;
  color: string;
  entered?: boolean;
  isCursor: boolean;
  isSpinning: boolean;
  number: number;
  spinOffset?: number;
}) {
  const sizeValue = `${boxSize}px`;
  const halfSize = `calc(${sizeValue} / 2)`;

  const enteredTransform = isCursor ? `translate3d(0, -6px, ${halfSize})` : `translate3d(0, 0, ${halfSize})`;
  const transform = entered ? enteredTransform : `translate3d(0, 30px, ${halfSize}) scale(0)`;

  return (
    <div
      style={{
        boxShadow: isCursor ? "0 0 22px 6px rgba(255,255,255,0.5)" : "none",
        height: sizeValue,
        perspective: isSpinning ? PLAYER_CAMERA.perspective : undefined,
        perspectiveOrigin: isSpinning ? PLAYER_CAMERA.perspectiveOrigin : undefined,
        position: "relative",
        transform,
        transition: "transform 600ms cubic-bezier(0.33, 1, 0.68, 1), box-shadow 260ms ease",
        transformStyle: "preserve-3d",
        willChange: isCursor || isSpinning ? "transform" : undefined,
        width: sizeValue,
      }}
    >
      <div
        style={{
          height: "100%",
          position: "relative",
          transform: isSpinning ? PLAYER_CAMERA.transform : undefined,
          transformStyle: "preserve-3d",
          width: "100%",
        }}
      >
        <div
          style={{
            animation: isSpinning ? "music-cube-twist-walk 14s linear infinite" : undefined,
            animationDelay: isSpinning && spinOffset > 0 ? `${-spinOffset}ms` : undefined,
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            willChange: isSpinning ? "transform" : undefined,
            width: "100%",
          }}
        >
          {/* front (+Z) */}
          <CubeFace
            background={`linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.06) 46%, rgba(0,0,0,0.28) 100%), ${color}`}
            transform={`translateZ(${halfSize})`}
          >
            <span
              className="ps2-text"
              style={{
                color: "#F3F8FF",
                fontSize: `${Math.round(boxSize * 0.42)}px`,
                fontWeight: 700,
                left: "50%",
                position: "absolute",
                textShadow:
                  "0 0 6px rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.35), -1px 1px 0 rgba(0,0,0,0.25), 0 2px 0 rgba(0,0,0,0.3)",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {number}
            </span>
          </CubeFace>
          {/* back */}
          <CubeFace
            background={`linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.18) 100%), ${color}`}
            transform={`rotateY(180deg) translateZ(${halfSize})`}
          />
          {/* right */}
          <CubeFace
            background={`linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.38) 100%), ${color}`}
            transform={`rotateY(90deg) translateZ(${halfSize})`}
          />
          {/* left */}
          <CubeFace
            background={`linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%), ${color}`}
            transform={`rotateY(-90deg) translateZ(${halfSize})`}
          />
          {/* top */}
          <CubeFace
            background={`linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 54%, rgba(0,0,0,0.18) 100%), ${color}`}
            transform={`rotateX(90deg) translateZ(${halfSize})`}
          />
          {/* bottom */}
          <CubeFace
            background={`linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.28) 100%), ${color}`}
            transform={`rotateX(-90deg) translateZ(${halfSize})`}
          />
        </div>
      </div>
    </div>
  );
});

function CubeFace({
  background,
  children,
  transform,
}: {
  background: string;
  children?: React.ReactNode;
  transform: string;
}) {
  return (
    <div
      style={{
        backfaceVisibility: "hidden",
        background,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), 0 10px 16px rgba(0,0,0,0.08)",
        height: "100%",
        inset: 0,
        position: "absolute",
        transform,
        transformOrigin: "center center",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}
