import { getSoundEnabled, initializeSoundEnabled } from "./sound-settings";

let audio: HTMLAudioElement | null = null;
let wantsAmbientAudio = false;

export function startAmbientAudio(): void {
  wantsAmbientAudio = true;

  initializeSoundEnabled();
  if (!getSoundEnabled()) return;

  if (!audio) {
    audio = new Audio("/sound/ambient.wav");
    audio.loop = true;
    audio.volume = 0.4;
  }

  audio.play().catch(() => {
    const resume = () => {
      audio?.play().catch(() => {});
      window.removeEventListener("click", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("click", resume);
    window.addEventListener("keydown", resume);
  });
}

export function stopAmbientAudio(): void {
  wantsAmbientAudio = false;

  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio = null;
}

export function playReturnMenuThenAmbient(): void {
  wantsAmbientAudio = true;

  initializeSoundEnabled();
  if (!getSoundEnabled()) return;

  const se = new Audio("/sound/se/return-menu.wav");
  se.volume = 0.5;
  se.onended = () => startAmbientAudio();
  se.play().catch(() => startAmbientAudio());
}

export function syncAmbientAudio(): void {
  initializeSoundEnabled();

  if (!getSoundEnabled()) {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio = null;
    return;
  }

  if (wantsAmbientAudio) {
    startAmbientAudio();
  }
}
