let audio: HTMLAudioElement | null = null;
let started = false;

export function startAmbientAudio(): void {
  if (started) return;
  started = true;

  audio = new Audio("/sound/ambient.wav");
  audio.loop = true;
  audio.volume = 0.4;
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
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio = null;
  started = false;
}
