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

export function createFogTexture(size = 512, initialSeed = 123): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const half = size / 2;

  let seed = initialSeed;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let i = 0; i < 18; i++) {
    const cx = half + (rand() - 0.5) * size * 0.7;
    const cy = half + (rand() - 0.5) * size * 0.7;
    const r = size * (0.12 + rand() * 0.3);
    const a = 0.08 + rand() * 0.12;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(55, 62, 105, ${a})`);
    g.addColorStop(0.5, `rgba(40, 46, 85, ${a * 0.4})`);
    g.addColorStop(1, "rgba(30, 35, 60, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  for (let i = 0; i < 4000; i++) {
    const dx = (rand() - 0.5) * 2;
    const dy = (rand() - 0.5) * 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) continue;

    const x = half + dx * half * 0.9;
    const y = half + dy * half * 0.9;
    const falloff = 1 - dist;
    const r2 = 0.8 + rand() * 3.0;
    const a = (0.08 + rand() * 0.15) * falloff * falloff;

    ctx.beginPath();
    ctx.arc(x, y, r2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(70, 78, 130, ${a})`;
    ctx.fill();
  }

  for (let i = 0; i < 600; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = rand() * half * 0.85;
    const cx = half + Math.cos(angle) * dist;
    const cy = half + Math.sin(angle) * dist;
    const falloff = 1 - dist / (half * 0.85);
    const len = 4 + rand() * 12;
    const wispAngle = angle + (rand() - 0.5) * 1.5;
    const a = (0.06 + rand() * 0.1) * falloff;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(wispAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, len, 0.8 + rand() * 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(60, 68, 115, ${a})`;
    ctx.fill();
    ctx.restore();
  }

  const vignette = ctx.createRadialGradient(half, half, size * 0.15, half, half, half);
  vignette.addColorStop(0, "rgba(255,255,255,1)");
  vignette.addColorStop(0.5, "rgba(255,255,255,0.85)");
  vignette.addColorStop(0.75, "rgba(255,255,255,0.4)");
  vignette.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createSmokeParticleTexture(size = 64): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const half = size / 2;

  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, "rgba(255,255,255,0.4)");
  g.addColorStop(0.3, "rgba(255,255,255,0.15)");
  g.addColorStop(0.7, "rgba(255,255,255,0.03)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createDenseFogTexture(size = 128): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const half = size / 2;

  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, "rgba(255,255,255,1.0)");
  g.addColorStop(0.15, "rgba(255,255,255,0.7)");
  g.addColorStop(0.4, "rgba(255,255,255,0.3)");
  g.addColorStop(0.7, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
