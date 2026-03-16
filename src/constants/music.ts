"use client";

export interface MusicTrack {
  id: string;
  number: number;
  title: string;
  artist: string;
  youtubeUrl: string;
  accentColor: string;
}

const TRACK_COLORS = [
  "#52C83E",
  "#4CC64E",
  "#46C268",
  "#40BC84",
  "#3AB69E",
  "#36A8B8",
  "#3580C2",
  "#385FC2",
  "#5A46C4",
  "#7C4FC6",
] as const;

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    accentColor: TRACK_COLORS[0],
    artist: "久石譲",
    id: "track-1",
    number: 1,
    title: "あの夏へ",
    youtubeUrl: "https://www.youtube.com/watch?v=TK1Ij_-mank",
  },
  {
    accentColor: TRACK_COLORS[1],
    artist: "ミッッシャ・マイスキー",
    id: "track-2",
    number: 2,
    title: "無伴奏チェロ組曲",
    youtubeUrl: "https://www.youtube.com/watch?v=mGQLXRTl3Z0",
  },
  {
    accentColor: TRACK_COLORS[2],
    artist: "カルロス・クライバー",
    id: "track-3",
    number: 3,
    title: "ベートーベン7",
    youtubeUrl: "https://www.youtube.com/watch?v=QYVHvaFI6LM",
  },
  {
    accentColor: TRACK_COLORS[3],
    artist: "Abo Takeshi",
    id: "track-4",
    number: 4,
    title: "Believe me",
    youtubeUrl: "https://www.youtube.com/watch?v=758vUmu7F-Y",
  },
  {
    accentColor: TRACK_COLORS[4],
    artist: "吉森信",
    id: "track-5",
    number: 5,
    title: "憧れの非日常",
    youtubeUrl: "https://www.youtube.com/watch?v=O_Om4naEK-Y",
  },
  {
    accentColor: TRACK_COLORS[5],
    artist: "Gabriel Masson",
    id: "track-6",
    number: 6,
    title: "Deux Danses",
    youtubeUrl: "https://www.youtube.com/watch?v=OHtIKIs2u-I",
  },
  {
    accentColor: TRACK_COLORS[6],
    artist: "Tommy Dorsey",
    id: "track-7",
    number: 7,
    title: "I'm Getting Sentimental Over You",
    youtubeUrl: "https://www.youtube.com/watch?v=cKQc-cbAvdQ",
  },
  {
    accentColor: TRACK_COLORS[7],
    artist: "平沢進",
    id: "track-8",
    number: 8,
    title: "白虎野の娘",
    youtubeUrl: "https://www.youtube.com/watch?v=x07HqlAufR4",
  },
  {
    accentColor: TRACK_COLORS[8],
    artist: "(K)NoW_NAME",
    id: "track-9",
    number: 9,
    title: "Welcome トゥ 混沌",
    youtubeUrl: "https://www.youtube.com/watch?v=iH_YJde1yps",
  },
  {
    accentColor: TRACK_COLORS[9],
    artist: "Spitz",
    id: "track-10",
    number: 10,
    title: "ロビンソン",
    youtubeUrl: "https://www.youtube.com/watch?v=51CH3dPaWXc",
  },
];
