import assert from "node:assert/strict";

import { test } from "vite-plus/test";

import { MUSIC_TRACKS } from "../../src/constants/music";
import { formatElapsedTime, parseYoutubeTrackSource } from "../../src/lib/youtube";

test("music constants define the requested ten tracks in order", () => {
  assert.equal(MUSIC_TRACKS.length, 10);
  assert.deepEqual(
    MUSIC_TRACKS.map((track) => track.number),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.deepEqual(
    MUSIC_TRACKS.map((track) => track.title),
    [
      "あの夏へ",
      "無伴奏チェロ組曲",
      "ベートーベン7",
      "Believe me",
      "憧れの非日常",
      "Deux Danses",
      "I'm Getting Sentimental Over You",
      "白虎野の娘",
      "Welcome トゥ 混沌",
      "ロビンソン",
    ],
  );
});

test("music constants keep artist metadata free of markdown artifacts", () => {
  assert.equal(MUSIC_TRACKS[5]?.artist, "Gabriel Masson");
  assert.ok(MUSIC_TRACKS.every((track) => !/^\s*#\s+/.test(track.artist)));
});

test("youtube parser extracts the video id and requested start times from authored track URLs", () => {
  assert.deepEqual(parseYoutubeTrackSource(MUSIC_TRACKS[0].youtubeUrl), {
    startSeconds: 0,
    videoId: "6f1vVBjftA4",
  });
  assert.deepEqual(parseYoutubeTrackSource(MUSIC_TRACKS[4].youtubeUrl), {
    startSeconds: 68,
    videoId: "O_Om4naEK-Y",
  });
  assert.deepEqual(parseYoutubeTrackSource(MUSIC_TRACKS[5].youtubeUrl), {
    startSeconds: 0,
    videoId: "OHtIKIs2u-I",
  });
  assert.deepEqual(parseYoutubeTrackSource(MUSIC_TRACKS[7].youtubeUrl), {
    startSeconds: 10,
    videoId: "x07HqlAufR4",
  });
});

test("elapsed time formatter keeps the PS2 music screen wording", () => {
  assert.equal(formatElapsedTime(0), "00 min. 00sec.");
  assert.equal(formatElapsedTime(73), "01 min. 13sec.");
});
