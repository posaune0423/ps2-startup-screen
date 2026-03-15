import * as THREE from "three";

interface RadialGradientStop {
  offset: number;
  color: string;
}

interface RadialGradientTextureOptions {
  size: number;
  stops: readonly RadialGradientStop[];
}

function createRadialGradientTexture({ size, stops }: RadialGradientTextureOptions): THREE.Texture {
  const half = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  stops.forEach(({ offset, color }) => {
    gradient.addColorStop(offset, color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createGlowTexture(size = 256): THREE.Texture {
  return createRadialGradientTexture({
    size,
    stops: [
      { offset: 0, color: "rgba(74, 87, 168, 0.6)" },
      { offset: 0.3, color: "rgba(49, 57, 114, 0.35)" },
      { offset: 0.7, color: "rgba(26, 31, 69, 0.1)" },
      { offset: 1, color: "rgba(26, 31, 69, 0)" },
    ],
  });
}

export function createCursorTexture(size = 128): THREE.Texture {
  return createRadialGradientTexture({
    size,
    stops: [
      { offset: 0, color: "rgba(255, 255, 255, 0.6)" },
      { offset: 0.3, color: "rgba(255, 255, 255, 0.25)" },
      { offset: 1, color: "rgba(255, 255, 255, 0)" },
    ],
  });
}

export function createTrailHeadTexture(size = 64): THREE.Texture {
  return createRadialGradientTexture({
    size,
    stops: [
      { offset: 0, color: "rgba(255,255,255,1)" },
      { offset: 0.15, color: "rgba(255,255,255,0.8)" },
      { offset: 0.4, color: "rgba(255,255,255,0.2)" },
      { offset: 1, color: "rgba(255,255,255,0)" },
    ],
  });
}
