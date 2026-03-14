import * as THREE from "three";

export function createGlowTexture(size = 256): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(74, 87, 168, 0.6)");
  gradient.addColorStop(0.3, "rgba(49, 57, 114, 0.35)");
  gradient.addColorStop(0.7, "rgba(26, 31, 69, 0.1)");
  gradient.addColorStop(1, "rgba(26, 31, 69, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
