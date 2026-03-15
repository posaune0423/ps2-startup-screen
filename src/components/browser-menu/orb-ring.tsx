"use client";

import React, { useCallback, useEffect, useRef } from "react";

const ORB_COUNT = 7;
const MOBILE_ORB_COUNT = 5;
const RING_RADIUS_RATIO = 0.32;
const TRAIL_LENGTH = 22;
const MOBILE_TRAIL_LENGTH = 10;
const TRAIL_FADE = 0.045;
const MOBILE_TRAIL_FADE = 0.1;
const MOBILE_MAX_DPR = 0.75;
const DESKTOP_MAX_DPR = 1.25;
const MOBILE_FRAME_INTERVAL = 1000 / 30;
const TIME_SPEED = 1.0;
const MOBILE_TIME_SPEED = 0.85;
const GATHER_SPEED = 0.8;
const MOBILE_GATHER_SPEED = 0.7;

const ORB_COLORS = [
  "rgba(117, 217, 235, 0.9)",
  "rgba(140, 200, 255, 0.85)",
  "rgba(100, 180, 240, 0.85)",
  "rgba(117, 217, 235, 0.9)",
  "rgba(160, 210, 255, 0.85)",
  "rgba(117, 217, 235, 0.9)",
  "rgba(130, 195, 245, 0.85)",
];

interface OrbState {
  baseAngle: number;
  currentAngle: number;
  targetAngle: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

function project3D(angle: number, radius: number, rotX: number, rotY: number): { x: number; y: number; z: number } {
  const px = Math.cos(angle) * radius;
  const py = 0;
  const pz = Math.sin(angle) * radius;

  const cosRx = Math.cos(rotX);
  const sinRx = Math.sin(rotX);
  const y1 = py * cosRx - pz * sinRx;
  const z1 = py * sinRx + pz * cosRx;

  const cosRy = Math.cos(rotY);
  const sinRy = Math.sin(rotY);
  const x2 = px * cosRy + z1 * sinRy;
  const z2 = -px * sinRy + z1 * cosRy;

  return { x: x2, y: y1, z: z2 };
}

export default function OrbRing({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const orbCount = compact ? MOBILE_ORB_COUNT : ORB_COUNT;
    const trailLength = compact ? MOBILE_TRAIL_LENGTH : TRAIL_LENGTH;
    const trailFade = compact ? MOBILE_TRAIL_FADE : TRAIL_FADE;
    const dpr = compact ? MOBILE_MAX_DPR : Math.min(window.devicePixelRatio || 1, DESKTOP_MAX_DPR);
    const rect = canvas.getBoundingClientRect();

    const resizeCanvas = () => {
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const ringRadius = Math.min(rect.width, rect.height) * RING_RADIUS_RATIO;

    const orbs: OrbState[] = Array.from({ length: orbCount }, (_, i) => ({
      baseAngle: (i / orbCount) * Math.PI * 2,
      currentAngle: (i / orbCount) * Math.PI * 2,
      targetAngle: (i / orbCount) * Math.PI * 2,
      trail: [],
    }));

    let time = 0;
    let gatherPhase = 0;
    let lastTimestamp = 0;

    function animate(timestamp: number) {
      if (!ctx || !canvas) return;
      if (compact && timestamp - lastTimestamp < MOBILE_FRAME_INTERVAL) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      const dt = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.1) : 1 / 60;
      lastTimestamp = timestamp;

      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      time += dt * (compact ? MOBILE_TIME_SPEED : TIME_SPEED);
      gatherPhase += dt * (compact ? MOBILE_GATHER_SPEED : GATHER_SPEED);

      const gatherAmount = (Math.sin(gatherPhase) + 1) / 2;

      const rotX = Math.sin(time * 0.8) * (compact ? 0.48 : 0.6);
      const rotY = time * (compact ? 0.38 : 0.5);

      for (let i = 0; i < orbCount; i++) {
        const orb = orbs[i];
        const evenSpacing = (i / orbCount) * Math.PI * 2 + time * (compact ? 0.95 : 1.2);
        const clustered = time * (compact ? 0.95 : 1.2) + (i < orbCount / 2 ? 0 : Math.PI);
        orb.currentAngle = evenSpacing * (1 - gatherAmount) + clustered * gatherAmount;

        const proj = project3D(orb.currentAngle, ringRadius, rotX, rotY);
        const scale = 1 + proj.z / (ringRadius * 3);
        const screenX = cx + proj.x * scale;
        const screenY = cy + proj.y * scale;

        orb.trail.unshift({ x: screenX, y: screenY, alpha: 1 });
        if (orb.trail.length > trailLength) {
          orb.trail.pop();
        }

        for (let t = orb.trail.length - 1; t >= 0; t--) {
          const point = orb.trail[t];
          point.alpha = Math.max(0, point.alpha - trailFade);

          if (point.alpha <= 0) continue;

          const orbSize = (compact ? 4.5 : 6 + scale * (compact ? 2.8 : 4)) * (1 - t / trailLength);
          const glowSize = orbSize * 2.25;
          const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, orbSize);

          const color = ORB_COLORS[i % ORB_COLORS.length];
          const baseAlpha = point.alpha * (1 - t / trailLength);
          const glowAlpha = baseAlpha * 0.48;

          if (!compact || t < 3) {
            const glowGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, glowSize);
            glowGradient.addColorStop(0, color.replace(/[\d.]+\)$/, `${glowAlpha.toFixed(2)})`));
            glowGradient.addColorStop(0.65, color.replace(/[\d.]+\)$/, `${(glowAlpha * 0.3).toFixed(2)})`));
            glowGradient.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));

            ctx.beginPath();
            ctx.arc(point.x, point.y, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();
          }

          gradient.addColorStop(0, color.replace(/[\d.]+\)$/, `${(baseAlpha * 0.9).toFixed(2)})`));
          gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${(baseAlpha * 0.4).toFixed(2)})`));
          gradient.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));

          ctx.beginPath();
          ctx.arc(point.x, point.y, orbSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        const mainSize = 8 + scale * 5;
        const mainGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, mainSize);
        mainGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        mainGradient.addColorStop(0.3, ORB_COLORS[i % ORB_COLORS.length]);
        mainGradient.addColorStop(1, "rgba(117, 217, 235, 0)");

        ctx.beginPath();
        ctx.arc(screenX, screenY, mainSize, 0, Math.PI * 2);
        ctx.fillStyle = mainGradient;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [compact]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const size = compact ? "min(144px, 36vw)" : "300px";

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
      }}
    />
  );
}
