export const APP_SCREEN_IDS = ["startup", "menu", "browser", "memoryWork", "memorySns", "music", "system"] as const;

export type AppScreenId = (typeof APP_SCREEN_IDS)[number];
export type AppScreenCluster = "startup" | "menu" | "memory";

export type ActiveIndexScreenId = Exclude<AppScreenId, "startup" | "music">;

export const SCREEN_PATHS: Record<AppScreenId, string> = {
  startup: "/",
  menu: "/menu",
  browser: "/browser",
  memoryWork: "/memory/work",
  memorySns: "/memory/sns",
  music: "/memory/music",
  system: "/system",
};

export const SCREEN_ASSETS: Record<AppScreenId, readonly string[]> = {
  startup: [],
  menu: [],
  browser: ["/3d/memorycard.glb", "/3d/icons/cd.glb"],
  memoryWork: [
    "/3d/memorycard.glb",
    "/3d/work/velvett.glb",
    "/3d/work/dena.glb",
    "/3d/work/daiko.glb",
    "/3d/work/doom.glb",
  ],
  memorySns: [
    "/3d/memorycard.glb",
    "/3d/sns/linkedin.glb",
    "/3d/sns/twitter_blue_bird.glb",
    "/3d/sns/github_octcat.glb",
    "/3d/sns/instagram.glb",
  ],
  music: ["/3d/icons/cd.glb"],
  system: [],
};

export const WARMUP_ASSET_PATHS = Array.from(new Set(Object.values(SCREEN_ASSETS).flat()));

export const MENU_SHELL_SCREEN_IDS = ["menu", "system"] as const;
export const MEMORY_SHELL_SCREEN_IDS = ["browser", "memoryWork", "memorySns", "music"] as const;
const MENU_SHELL_SCREEN_SET = new Set<AppScreenId>(MENU_SHELL_SCREEN_IDS);
const MEMORY_SHELL_SCREEN_SET = new Set<AppScreenId>(MEMORY_SHELL_SCREEN_IDS);

const SCREEN_BY_PATH: Record<string, AppScreenId> = {
  "/": "startup",
  "/menu": "menu",
  "/browser": "browser",
  "/memory/work": "memoryWork",
  "/memory/sns": "memorySns",
  "/memory/music": "music",
  "/system": "system",
};

export function getScreenFromPath(pathname: string): AppScreenId {
  return SCREEN_BY_PATH[pathname] ?? "startup";
}

export function getPathFromScreen(screenId: AppScreenId): string {
  return SCREEN_PATHS[screenId];
}

export function isMenuShellScreen(screenId: AppScreenId): boolean {
  return MENU_SHELL_SCREEN_SET.has(screenId);
}

export function isMemoryShellScreen(screenId: AppScreenId): boolean {
  return MEMORY_SHELL_SCREEN_SET.has(screenId);
}

export function getScreenCluster(screenId: AppScreenId): AppScreenCluster {
  if (screenId === "startup") return "startup";
  if (isMenuShellScreen(screenId)) return "menu";
  return "memory";
}
