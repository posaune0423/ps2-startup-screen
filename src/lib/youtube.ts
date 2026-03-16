export interface ParsedYoutubeTrackSource {
  startSeconds: number;
  videoId: string;
}

export const HIDDEN_YOUTUBE_PLAYER_DIMENSION = 200;

function parseTimeValue(value: string | null): number {
  if (!value) return 0;

  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  const matches = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!matches) return 0;

  const [, hours, minutes, seconds] = matches;
  const totalSeconds =
    Number.parseInt(hours ?? "0", 10) * 3600 +
    Number.parseInt(minutes ?? "0", 10) * 60 +
    Number.parseInt(seconds ?? "0", 10);

  return Number.isFinite(totalSeconds) ? totalSeconds : 0;
}

export function parseYoutubeTrackSource(youtubeUrl: string): ParsedYoutubeTrackSource {
  const url = new URL(youtubeUrl);
  const hostname = url.hostname.replace(/^www\./, "");

  let videoId = "";
  if (hostname === "youtu.be") {
    videoId = url.pathname.slice(1);
  } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    videoId = url.searchParams.get("v") ?? "";
  }

  if (!videoId) {
    throw new Error(`Unsupported YouTube URL: ${youtubeUrl}`);
  }

  const startSeconds = parseTimeValue(url.searchParams.get("t") ?? url.searchParams.get("start"));

  return { startSeconds, videoId };
}

export function formatElapsedTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const remainingSeconds = String(safeSeconds % 60).padStart(2, "0");

  return `${minutes} min. ${remainingSeconds}sec.`;
}

export function getYoutubeErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case 2:
      return "The requested YouTube video is invalid.";
    case 5:
      return "This YouTube video cannot be played in the current browser.";
    case 153:
      return "This YouTube video could not be initialized by the embedded player.";
    case 100:
      return "This YouTube video is unavailable.";
    case 101:
    case 150:
      return "This YouTube video does not allow embedded playback.";
    default:
      return "An unknown YouTube playback error occurred.";
  }
}
