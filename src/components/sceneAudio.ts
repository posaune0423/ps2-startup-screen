interface SeekableSound {
  playing: () => boolean;
  seek: (seconds: number) => void;
}

interface StartSceneSoundArgs {
  elapsed: number;
  hasStarted: boolean;
  hasSyncedPosition: boolean;
  hasRequestedPlayback?: boolean;
  play: () => void;
  sound?: SeekableSound | null;
  soundEnabled?: boolean;
}

interface StartSceneSoundResult {
  hasStarted: boolean;
  hasSyncedPosition: boolean;
  hasRequestedPlayback: boolean;
}

export function startSceneSound({
  elapsed,
  hasStarted,
  hasSyncedPosition,
  hasRequestedPlayback = false,
  play,
  sound,
  soundEnabled = true,
}: StartSceneSoundArgs): StartSceneSoundResult {
  if (!soundEnabled || !sound) {
    return {
      hasStarted,
      hasSyncedPosition,
      hasRequestedPlayback,
    };
  }

  let nextHasStarted = hasStarted;
  let nextHasSyncedPosition = hasSyncedPosition;
  let nextHasRequestedPlayback = hasRequestedPlayback;

  if (!nextHasStarted) {
    nextHasStarted = sound.playing();
  }

  if (!nextHasStarted && !nextHasRequestedPlayback) {
    play();
    nextHasRequestedPlayback = true;
    nextHasStarted = sound.playing();
  }

  if (!nextHasSyncedPosition && nextHasStarted) {
    sound.seek(elapsed);
    nextHasSyncedPosition = true;
  }

  return {
    hasStarted: nextHasStarted,
    hasSyncedPosition: nextHasSyncedPosition,
    hasRequestedPlayback: nextHasRequestedPlayback,
  };
}
