"use client";

import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MediaControlIcon } from "@/components/shared/media-icons";
import { useNavigationSound } from "@/components/shared/use-navigation-sound";
import { useViewport } from "@/components/shared/use-viewport";
import { MUSIC_TRACKS } from "@/constants/music";
import { useYoutubeMusicPlayer } from "@/hooks/use-youtube-music-player";
import { stopAmbientAudio } from "@/lib/ambient-audio";
import { formatElapsedTime } from "@/lib/youtube";
import type { MusicTrack } from "@/constants/music";

const GRID_COLUMNS = { desktop: 5, mobile: 3 } as const;
const PLAYER_TRANSITION_MS = 760;
const PLAYER_CUBE_SIZE = { desktop: 220, mobile: 176 } as const;
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
  settled: boolean;
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

export default function MusicPage() {
  const { playEnter, playSelect } = useNavigationSound();
  const { isMobile, isPortrait } = useViewport();
  const compact = isMobile || isPortrait;
  const columnCount = compact ? GRID_COLUMNS.mobile : GRID_COLUMNS.desktop;
  const playerCubeSize = compact ? PLAYER_CUBE_SIZE.mobile : PLAYER_CUBE_SIZE.desktop;
  const [cursorIndex, setCursorIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "player" | "transition">("grid");
  const [transitionCube, setTransitionCube] = useState<TransitionCubeState | null>(null);
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
    stopAmbientAudio();
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current === null) return;
    window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  const completeTransition = useCallback(() => {
    clearTransitionTimer();
    setTransitionCube(null);
    setViewMode("player");
  }, [clearTransitionTimer]);

  const handleActivateTrack = useCallback(
    (index: number) => {
      const selectedTrack = MUSIC_TRACKS[index];
      if (!selectedTrack) return;

      playEnter();
      selectTrack(index, true);
      setCursorIndex(index);

      const source = trackButtonRefs.current[index];
      const target = playerDockRef.current;

      if (!source || !target) {
        startTransition(() => {
          setViewMode("player");
        });
        return;
      }

      clearTransitionTimer();
      startTransition(() => {
        setViewMode("transition");
        setTransitionCube({
          fromRect: toViewportRect(source.getBoundingClientRect()),
          settled: false,
          toRect: toViewportRect(target.getBoundingClientRect()),
          track: selectedTrack,
        });
      });

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setTransitionCube((current) =>
            current && current.track.id === selectedTrack.id ? { ...current, settled: true } : current,
          );
        });
      });

      transitionTimerRef.current = window.setTimeout(completeTransition, PLAYER_TRANSITION_MS);
    },
    [clearTransitionTimer, completeTransition, playEnter, selectTrack],
  );

  const moveCursor = useCallback(
    (nextIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(nextIndex, MUSIC_TRACKS.length - 1));
      setCursorIndex((previousIndex) => {
        if (previousIndex === clampedIndex) return previousIndex;
        playSelect();
        return clampedIndex;
      });
    },
    [playSelect],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (viewMode === "transition") {
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

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          seekBy(-10);
          break;
        case "ArrowRight":
          event.preventDefault();
          seekBy(10);
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
          if (errorMessage) {
            retry();
            return;
          }
          if (playerState === "playing") {
            pause();
            return;
          }
          play();
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
    playerState,
    prevTrack,
    retry,
    seekBy,
    viewMode,
  ]);

  return (
    <div
      style={{
        background:
          "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.18), transparent 18%), linear-gradient(180deg, #D0D0CE 0%, #B7B7B4 54%, #A5A5A2 100%)",
        color: "#FFFFFF",
        height: "100dvh",
        overflow: "hidden",
        position: "relative",
        width: "100vw",
      }}
    >
      <style>{`
        @keyframes music-cube-twist-walk {
          0% {
            transform: translate3d(0, 8px, 0) rotateX(-28deg) rotateY(-34deg) rotateZ(-16deg);
          }
          25% {
            transform: translate3d(0, -2px, 0) rotateX(54deg) rotateY(8deg) rotateZ(18deg);
          }
          50% {
            transform: translate3d(0, 7px, 0) rotateX(146deg) rotateY(54deg) rotateZ(8deg);
          }
          75% {
            transform: translate3d(0, -4px, 0) rotateX(236deg) rotateY(102deg) rotateZ(-18deg);
          }
          100% {
            transform: translate3d(0, 8px, 0) rotateX(332deg) rotateY(146deg) rotateZ(-16deg);
          }
        }
      `}</style>

      <div ref={playerHostRef} style={{ height: 0, left: -9999, position: "absolute", top: -9999, width: 0 }} />

      <div
        style={{
          alignItems: "flex-start",
          display: "flex",
          justifyContent: viewMode === "grid" ? "space-between" : "flex-end",
          left: 0,
          padding: compact ? "20px 24px 0" : "28px 52px 0",
          pointerEvents: "none",
          position: "absolute",
          right: 0,
          top: 0,
          zIndex: 20,
        }}
      >
        {viewMode === "grid" ? (
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
            display: "grid",
            gap: compact ? "18px 22px" : "22px 28px",
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            left: "50%",
            maxWidth: compact ? "min(92vw, 440px)" : "min(76vw, 980px)",
            opacity: viewMode === "grid" ? 1 : 0,
            paddingTop: compact ? "118px" : "144px",
            pointerEvents: viewMode === "grid" ? "auto" : "none",
            position: "absolute",
            top: 0,
            transform: `translate3d(-50%, ${viewMode === "grid" ? "0" : "24px"}, 0)`,
            transition: "opacity 220ms ease, transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
            width: "100%",
          }}
        >
          {MUSIC_TRACKS.map((track, index) => {
            const hiddenForTravel = transitionCube?.track.id === track.id;

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
                  transition: "opacity 120ms linear",
                }}
              >
                <TrackCube
                  boxSize={compact ? 82 : 98}
                  color={track.accentColor}
                  isCursor={index === cursorIndex}
                  isSpinning={false}
                  number={track.number}
                />
              </button>
            );
          })}
        </div>

        <div
          style={{
            alignItems: "center",
            display: "grid",
            gap: compact ? "26px" : "52px",
            gridTemplateColumns: compact ? "1fr" : "minmax(240px, 360px) minmax(320px, 440px)",
            inset: 0,
            opacity: viewMode === "grid" ? 0 : 1,
            padding: compact ? "120px 26px 98px" : "112px 64px 108px",
            pointerEvents: viewMode === "player" ? "auto" : "none",
            position: "absolute",
            transform: `translate3d(0, ${viewMode === "grid" ? "24px" : "0"}, 0)`,
            transition: "opacity 360ms ease, transform 620ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: compact ? 220 : 320 }}>
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
              gap: compact ? "18px" : "22px",
              justifyContent: "center",
            }}
          >
            <div
              className="ps2-text"
              style={{
                color: "#D7CF2B",
                fontSize: compact ? "clamp(34px, 8vw, 50px)" : "clamp(40px, 3.8vw, 60px)",
                fontWeight: 700,
                transformOrigin: "left center",
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
                transformOrigin: "left center",
              }}
            >
              {formatElapsedTime(currentSeconds)}
            </div>

            <div style={{ alignItems: "center", display: "flex", gap: compact ? "10px" : "14px" }}>
              <TransportButton aria-label="Previous track" onClick={prevTrack}>
                <MediaControlIcon name="previous" />
              </TransportButton>
              <TransportButton aria-label="Seek backward 10 seconds" onClick={() => seekBy(-10)}>
                <MediaControlIcon name="seekBack" />
              </TransportButton>
              <TransportButton aria-label="Seek forward 10 seconds" onClick={() => seekBy(10)}>
                <MediaControlIcon name="seekForward" />
              </TransportButton>
              <TransportButton aria-label="Next track" onClick={nextTrack}>
                <MediaControlIcon name="next" />
              </TransportButton>
              <TransportButton aria-label="Play" onClick={errorMessage ? retry : play}>
                <MediaControlIcon active={playerState === "playing"} name="play" />
              </TransportButton>
              <TransportButton aria-label="Pause" onClick={pause}>
                <MediaControlIcon name="pause" />
              </TransportButton>
              <TransportButton aria-label="Stop" onClick={stop}>
                <MediaControlIcon name="stop" />
              </TransportButton>
            </div>
          </div>
        </div>
      </div>

      {transitionCube ? <TransitioningTrackCube track={transitionCube.track} transitionCube={transitionCube} /> : null}

      <div aria-live="polite" style={SR_ONLY_STYLE}>
        {liveRegionMessage}
      </div>
    </div>
  );
}

function TransitioningTrackCube({
  track,
  transitionCube,
}: {
  track: MusicTrack;
  transitionCube: TransitionCubeState;
}) {
  const currentRect = transitionCube.settled ? transitionCube.toRect : transitionCube.fromRect;

  return (
    <div
      style={{
        filter: transitionCube.settled ? "drop-shadow(0 16px 22px rgba(0,0,0,0.18))" : "drop-shadow(0 10px 16px rgba(0,0,0,0.16))",
        height: currentRect.height,
        left: currentRect.left,
        pointerEvents: "none",
        position: "fixed",
        top: currentRect.top,
        transition: `left ${PLAYER_TRANSITION_MS}ms cubic-bezier(0.2, 0.9, 0.2, 1), top ${PLAYER_TRANSITION_MS}ms cubic-bezier(0.2, 0.9, 0.2, 1), width ${PLAYER_TRANSITION_MS}ms cubic-bezier(0.2, 0.9, 0.2, 1), height ${PLAYER_TRANSITION_MS}ms cubic-bezier(0.2, 0.9, 0.2, 1), filter 420ms ease`,
        width: currentRect.width,
        zIndex: 18,
      }}
    >
      <TrackCube boxSize={currentRect.width} color={track.accentColor} isCursor={false} isSpinning number={track.number} />
    </div>
  );
}

function TransportButton({
  "aria-label": ariaLabel,
  children,
  onClick,
}: {
  "aria-label": string;
  children: React.ReactNode;
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
        cursor: "pointer",
        display: "inline-flex",
        justifyContent: "center",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function TrackCube({
  boxSize,
  color,
  isCursor,
  isSpinning,
  number,
}: {
  boxSize: number;
  color: string;
  isCursor: boolean;
  isSpinning: boolean;
  number: number;
}) {
  const sizeValue = `${boxSize}px`;
  const halfSize = `calc(${sizeValue} / 2)`;

  return (
    <div
      style={{
        filter: isCursor ? "drop-shadow(0 0 18px rgba(255,255,255,0.58))" : "none",
        height: sizeValue,
        perspective: "960px",
        position: "relative",
        transform: isCursor ? "translate3d(0, -6px, 0)" : "translate3d(0, 0, 0)",
        transformStyle: "preserve-3d",
        transition: "transform 320ms ease, filter 260ms ease",
        width: sizeValue,
      }}
    >
      <div
        style={{
          animation: isSpinning ? "music-cube-twist-walk 5.8s linear infinite" : undefined,
          height: "100%",
          position: "relative",
          transform: "rotateX(-32deg) rotateY(22deg)",
          transformStyle: "preserve-3d",
          width: "100%",
        }}
      >
        {/* front */}
        <CubeFace
          background={`linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.06) 46%, rgba(0,0,0,0.28) 100%), ${color}`}
          transform={`translateZ(${halfSize})`}
        />
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
        >
          <span
            className="ps2-text"
            style={{
              color: "#F3F8FF",
              fontSize: "clamp(20px, 2.6vw, 34px)",
              fontWeight: 700,
              left: "16%",
              position: "absolute",
              textShadow:
                "0 0 4px rgba(0,0,0,0.4), 1px 1px 0 rgba(0,0,0,0.28), -1px 1px 0 rgba(0,0,0,0.2), 0 1px 0 rgba(0,0,0,0.24)",
              top: "12%",
            }}
          >
            {number}
          </span>
        </CubeFace>
        {/* bottom */}
        <CubeFace
          background={`linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.28) 100%), ${color}`}
          transform={`rotateX(-90deg) translateZ(${halfSize})`}
        />
      </div>
    </div>
  );
}

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
        backdropFilter: "blur(0.3px)",
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
