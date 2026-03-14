import { CONFIG } from "./config";

const { duration, accelStart, rushStart } = CONFIG.timeline;

export type Phase = "calm" | "accel" | "rush";

export function getProgress(elapsed: number): number {
  return Math.min(elapsed / duration, 1.0);
}

export function getPhase(elapsed: number): Phase {
  if (elapsed < accelStart) return "calm";
  if (elapsed < rushStart) return "accel";
  return "rush";
}

export function getFadeFactor(elapsed: number): number {
  if (elapsed < accelStart) return 1.0;
  if (elapsed < rushStart) {
    const t = (elapsed - accelStart) / (rushStart - accelStart);
    return lerp(smoothstep(t), 1.0, 0.7);
  }
  const t = Math.min((elapsed - rushStart) / (duration - rushStart), 1.0);
  return lerp(smoothstep(t), 0.7, 0.0);
}

export function getSpeedMultiplier(elapsed: number): number {
  if (elapsed < accelStart) return 1.0;
  if (elapsed < rushStart) {
    const t = (elapsed - accelStart) / (rushStart - accelStart);
    return lerp(easeInCubic(t), 1.0, 1.5);
  }
  const t = (elapsed - rushStart) / (duration - rushStart);
  return lerp(t, 1.5, 2.5);
}

export function getCameraParams(elapsed: number) {
  const { camera } = CONFIG;

  if (elapsed < accelStart) {
    const t = elapsed / accelStart;
    const slow = t * t * 0.15;
    return {
      angularSpeed: camera.calmSpeed,
      height: lerp(slow, camera.startHeight, camera.endHeight),
    };
  }

  const t = Math.min((elapsed - accelStart) / (duration - accelStart), 1.0);
  const eased = t * t * (3 - 2 * t);
  const zoomBase = lerp(0.15, camera.startHeight, camera.endHeight);
  return {
    angularSpeed: lerp(eased, camera.calmSpeed, camera.rushSpeed),
    height: lerp(eased, zoomBase, camera.endHeight),
  };
}

export function lerp(t: number, a: number, b: number): number {
  return a + (b - a) * t;
}

export function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function easeInCubic(t: number): number {
  return t * t * t;
}
