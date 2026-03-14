import * as THREE from "three";

export const VAPOR_SPREAD_XZ = 3.8;
export const VAPOR_OPACITY_MULTIPLIER = 0.8;
export const VAPOR_SCALE_X_MULTIPLIER = 0.88;
export const VAPOR_SCALE_Y_MULTIPLIER = 0.68;
export const VAPOR_Y_OFFSET = -0.12;

export interface VaporSpriteDef {
  position: [number, number, number];
  scaleW: number;
  scaleH: number;
  opacity: number;
  color: string;
  noiseScale: number;
  scrollSpeed1: [number, number];
  scrollSpeed2: [number, number];
  fbmStrength: number;
  verticalFade: number;
  blending: THREE.Blending;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function scaleVaporOpacity(opacity: number): number {
  return opacity * VAPOR_OPACITY_MULTIPLIER;
}

export function scaleVaporScale(width: number, height: number): [number, number] {
  return [width * VAPOR_SCALE_X_MULTIPLIER, height * VAPOR_SCALE_Y_MULTIPLIER];
}

export function liftVaporY(baseY: number): number {
  return baseY + VAPOR_Y_OFFSET;
}

export function generateVaporSprites(): VaporSpriteDef[] {
  const rand = seededRandom(42);
  const result: VaporSpriteDef[] = [];

  const groundCount = 40;
  for (let i = 0; i < groundCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.5) * VAPOR_SPREAD_XZ;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const baseY = liftVaporY(0.02 + rand() * 0.15);
    const distNorm = r / VAPOR_SPREAD_XZ;

    const [w, h] = scaleVaporScale(3.5 + rand() * 4.0, 2.5 + rand() * 4.0);
    const centerDensity = 1 - Math.pow(distNorm, 0.7);
    const opacity = scaleVaporOpacity((0.5 + rand() * 0.4) * centerDensity);

    const t = distNorm;
    const ri = Math.round(20 + t * 12);
    const gi = Math.round(24 + t * 16);
    const bi = Math.round(48 + t * 30);
    const color = `rgb(${ri},${gi},${bi})`;

    const speedMul = 0.3 + rand() * 0.5;
    result.push({
      position: [x, baseY, z],
      scaleW: w,
      scaleH: h,
      opacity,
      color,
      noiseScale: 1.5 + rand() * 1.5,
      scrollSpeed1: [(rand() - 0.5) * 0.02 * speedMul, (rand() - 0.5) * 0.015 * speedMul],
      scrollSpeed2: [(rand() - 0.5) * 0.018 * speedMul, (rand() - 0.5) * 0.015 * speedMul],
      fbmStrength: 0.15 + rand() * 0.2,
      verticalFade: 0.6 + rand() * 0.3,
      blending: THREE.AdditiveBlending,
    });
  }

  const vaporCount = 100;
  for (let i = 0; i < vaporCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.55) * VAPOR_SPREAD_XZ;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const baseY = liftVaporY(rand() * 1.2);
    const distNorm = r / VAPOR_SPREAD_XZ;

    const [w, h] = scaleVaporScale(1.5 + rand() * 3.0, 3.0 + rand() * 5.5);
    const centerDensity = 1 - Math.pow(distNorm, 0.6);
    const opacity = scaleVaporOpacity((0.35 + rand() * 0.45) * centerDensity);

    const t = distNorm;
    const ri = Math.round(26 + t * 20);
    const gi = Math.round(30 + t * 24);
    const bi = Math.round(56 + t * 45);
    const color = `rgb(${ri},${gi},${bi})`;

    const speedMul = 0.5 + rand() * 1.0;
    result.push({
      position: [x, baseY, z],
      scaleW: w,
      scaleH: h,
      opacity,
      color,
      noiseScale: 2.0 + rand() * 2.5,
      scrollSpeed1: [(rand() - 0.5) * 0.03 * speedMul, (rand() - 0.5) * 0.02 * speedMul],
      scrollSpeed2: [(rand() - 0.5) * 0.025 * speedMul, (rand() - 0.5) * 0.02 * speedMul],
      fbmStrength: 0.2 + rand() * 0.35,
      verticalFade: 0.65 + rand() * 0.2,
      blending: THREE.AdditiveBlending,
    });
  }

  const upperCount = 40;
  for (let i = 0; i < upperCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.65) * VAPOR_SPREAD_XZ * 0.7;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const baseY = liftVaporY(1.5 + rand() * 2.5);
    const distNorm = r / (VAPOR_SPREAD_XZ * 0.7);

    const [w, h] = scaleVaporScale(1.2 + rand() * 2.5, 2.0 + rand() * 4.0);
    const centerDensity = 1 - Math.pow(distNorm, 0.5);
    const heightFade = 1 - ((baseY - 1.5) / 2.5) * 0.5;
    const opacity = scaleVaporOpacity((0.2 + rand() * 0.3) * centerDensity * heightFade);

    const t = distNorm;
    const ri = Math.round(30 + t * 20);
    const gi = Math.round(34 + t * 24);
    const bi = Math.round(64 + t * 40);
    const color = `rgb(${ri},${gi},${bi})`;

    const speedMul = 0.6 + rand() * 1.0;
    result.push({
      position: [x, baseY, z],
      scaleW: w,
      scaleH: h,
      opacity,
      color,
      noiseScale: 2.5 + rand() * 2.0,
      scrollSpeed1: [(rand() - 0.5) * 0.03 * speedMul, (rand() - 0.5) * 0.02 * speedMul],
      scrollSpeed2: [(rand() - 0.5) * 0.025 * speedMul, (rand() - 0.5) * 0.02 * speedMul],
      fbmStrength: 0.25 + rand() * 0.3,
      verticalFade: 0.5 + rand() * 0.3,
      blending: THREE.AdditiveBlending,
    });
  }

  const wispCount = 30;
  for (let i = 0; i < wispCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.8) * VAPOR_SPREAD_XZ * 0.5;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const baseY = liftVaporY(rand() * 2.0);

    const [w, h] = scaleVaporScale(0.8 + rand() * 1.5, 1.5 + rand() * 3.5);
    const opacity = scaleVaporOpacity(0.4 + rand() * 0.4);
    const color = "#3A4580";

    const speedMul = 0.8 + rand() * 1.2;
    result.push({
      position: [x, baseY, z],
      scaleW: w,
      scaleH: h,
      opacity,
      color,
      noiseScale: 3.0 + rand() * 2.0,
      scrollSpeed1: [(rand() - 0.5) * 0.04 * speedMul, (rand() - 0.5) * 0.025 * speedMul],
      scrollSpeed2: [(rand() - 0.5) * 0.03 * speedMul, (rand() - 0.5) * 0.025 * speedMul],
      fbmStrength: 0.25 + rand() * 0.35,
      verticalFade: 0.7 + rand() * 0.2,
      blending: THREE.AdditiveBlending,
    });
  }

  return result;
}
