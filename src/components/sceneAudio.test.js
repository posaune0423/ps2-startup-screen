import assert from "node:assert/strict";
import test from "node:test";
import { startSceneSound } from "./sceneAudio.ts";

void test("starts playback and syncs to the current elapsed time on first run", () => {
  let playCalls = 0;
  const seekCalls = [];

  const nextState = startSceneSound({
    elapsed: 2.4,
    hasStarted: false,
    hasSyncedPosition: false,
    play: () => {
      playCalls += 1;
    },
    sound: {
      playing: () => true,
      seek: (seconds) => {
        seekCalls.push(seconds);
      },
    },
  });

  assert.equal(playCalls, 1);
  assert.deepEqual(seekCalls, [2.4]);
  assert.deepEqual(nextState, {
    hasStarted: true,
    hasSyncedPosition: true,
  });
});

void test("does not replay or reseek once startup audio is already running", () => {
  let playCalls = 0;
  const seekCalls = [];

  const nextState = startSceneSound({
    elapsed: 4.8,
    hasStarted: true,
    hasSyncedPosition: true,
    play: () => {
      playCalls += 1;
    },
    sound: {
      playing: () => true,
      seek: (seconds) => {
        seekCalls.push(seconds);
      },
    },
  });

  assert.equal(playCalls, 0);
  assert.deepEqual(seekCalls, []);
  assert.deepEqual(nextState, {
    hasStarted: true,
    hasSyncedPosition: true,
  });
});

void test("does not mark startup audio as started before the sound is ready", () => {
  let playCalls = 0;

  const nextState = startSceneSound({
    elapsed: 1.2,
    hasStarted: false,
    hasSyncedPosition: false,
    play: () => {
      playCalls += 1;
    },
    sound: null,
  });

  assert.equal(playCalls, 0);
  assert.deepEqual(nextState, {
    hasStarted: false,
    hasSyncedPosition: false,
  });
});

void test("keeps click fallback available when a play attempt does not start playback", () => {
  let playCalls = 0;
  const seekCalls = [];

  const nextState = startSceneSound({
    elapsed: 3.1,
    hasStarted: false,
    hasSyncedPosition: false,
    play: () => {
      playCalls += 1;
    },
    sound: {
      playing: () => false,
      seek: (seconds) => {
        seekCalls.push(seconds);
      },
    },
  });

  assert.equal(playCalls, 1);
  assert.deepEqual(seekCalls, [3.1]);
  assert.deepEqual(nextState, {
    hasStarted: false,
    hasSyncedPosition: true,
  });
});
