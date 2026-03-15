type SeekableSound = {
  playing: () => boolean;
  seek: (seconds: number) => void;
};

type StartSceneSoundArgs = {
  elapsed: number;
  hasStarted: boolean;
  hasSyncedPosition: boolean;
  play: () => void;
  sound?: SeekableSound | null;
};

type StartSceneSoundResult = {
  hasStarted: boolean;
  hasSyncedPosition: boolean;
};

export function startSceneSound({
  elapsed,
  hasStarted,
  hasSyncedPosition,
  play,
  sound,
}: StartSceneSoundArgs): StartSceneSoundResult {
  if (!sound) {
    return {
      hasStarted,
      hasSyncedPosition,
    };
  }

  let nextHasStarted = hasStarted;
  let nextHasSyncedPosition = hasSyncedPosition;

  if (!nextHasStarted) {
    play();
    nextHasStarted = sound.playing();
  }

  if (!nextHasStarted) {
    nextHasStarted = sound.playing();
  }

  if (!nextHasSyncedPosition) {
    sound.seek(elapsed);
    nextHasSyncedPosition = true;
  }

  return {
    hasStarted: nextHasStarted,
    hasSyncedPosition: nextHasSyncedPosition,
  };
}
