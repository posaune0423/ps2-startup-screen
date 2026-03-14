"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CONFIG } from "./config";
import { getSpeedMultiplier } from "./timeline";

interface TrailParams {
  color: THREE.Color;
  yBase: number;
  radiusX: number;
  radiusZ: number;
  freqX: number;
  freqZ: number;
  phaseX: number;
  phaseZ: number;
  yAmp: number;
  yFreq: number;
}

interface TrailRuntime {
  points: THREE.Vector3[];
  position: THREE.Vector3;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function createGlowSprite(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.15, "rgba(255,255,255,0.8)");
  g.addColorStop(0.4, "rgba(255,255,255,0.2)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function Trail({
  params,
  runtime,
  trailLength,
  elapsedRef,
  speed,
  headTexture,
}: {
  params: TrailParams;
  runtime: TrailRuntime;
  trailLength: number;
  elapsedRef: React.RefObject<number>;
  speed: number;
  headTexture: THREE.Texture;
}) {
  const { geometry, material, lineObject } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(trailLength * 3);
    const colors = new Float32Array(trailLength * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat, lineObject: new THREE.Line(geo, mat) };
  }, [trailLength]);

  const headSpriteMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: headTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [headTexture],
  );

  const haloSpriteMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: headTexture,
        color: params.color,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [headTexture, params.color],
  );

  const headSpriteRef = useRef<THREE.Sprite>(null);
  const haloSpriteRef = useRef<THREE.Sprite>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    const elapsed = elapsedRef.current ?? 0;
    const speedMul = getSpeedMultiplier(elapsed);

    timeRef.current += delta * speed * speedMul;
    const t = timeRef.current;

    runtime.position.x = Math.sin(t * params.freqX + params.phaseX) * params.radiusX;
    runtime.position.z = Math.sin(t * params.freqZ + params.phaseZ) * params.radiusZ;
    runtime.position.y = params.yBase + Math.sin(t * params.yFreq) * params.yAmp;

    runtime.points.unshift(runtime.position.clone());
    if (runtime.points.length > trailLength) {
      runtime.points.length = trailLength;
    }

    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const colArray = colAttr.array as Float32Array;

    const c = params.color;
    const len = runtime.points.length;

    for (let j = 0; j < trailLength; j++) {
      if (j < len) {
        posArray[j * 3] = runtime.points[j].x;
        posArray[j * 3 + 1] = runtime.points[j].y;
        posArray[j * 3 + 2] = runtime.points[j].z;

        const fade = len > 1 ? 1 - j / (len - 1) : 1;
        colArray[j * 3] = c.r * fade;
        colArray[j * 3 + 1] = c.g * fade;
        colArray[j * 3 + 2] = c.b * fade;
      } else {
        const last = runtime.points[len - 1] || runtime.position;
        posArray[j * 3] = last.x;
        posArray[j * 3 + 1] = last.y;
        posArray[j * 3 + 2] = last.z;
        colArray[j * 3] = 0;
        colArray[j * 3 + 1] = 0;
        colArray[j * 3 + 2] = 0;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geometry.setDrawRange(0, Math.min(len, trailLength));

    const { accelStart, duration: dur } = CONFIG.timeline;
    const alphaDim =
      elapsed > accelStart ? Math.max(0, 1 - (elapsed - accelStart) / (dur - accelStart)) : 1;
    material.opacity = 0.9 * alphaDim;

    if (headSpriteRef.current) {
      headSpriteRef.current.position.copy(runtime.position);
      headSpriteMat.opacity = 1.0 * alphaDim;
    }
    if (haloSpriteRef.current) {
      haloSpriteRef.current.position.copy(runtime.position);
      haloSpriteMat.opacity = 0.6 * alphaDim;
    }
  });

  return (
    <group>
      <primitive object={lineObject} />
      <sprite
        ref={headSpriteRef}
        material={headSpriteMat}
        scale={[0.08, 0.08, 1]}
        renderOrder={4}
      />
      <sprite ref={haloSpriteRef} material={haloSpriteMat} scale={[0.2, 0.2, 1]} renderOrder={3} />
    </group>
  );
}

export default function ParticleTrails({ elapsedRef }: { elapsedRef: React.RefObject<number> }) {
  const { count, trailLength, speed, colors, yRange, xzRange } = CONFIG.particle;

  const headTexture = useMemo(() => createGlowSprite(), []);

  const { paramsList, runtimes } = useMemo(() => {
    const rand = seededRandom(789);
    const ps: TrailParams[] = [];
    const rs: TrailRuntime[] = [];

    for (let i = 0; i < count; i++) {
      const yBase = yRange[0] + rand() * (yRange[1] - yRange[0]);

      ps.push({
        color: new THREE.Color(colors[i % colors.length]),
        yBase,
        radiusX: (0.5 + rand() * 0.5) * xzRange,
        radiusZ: (0.5 + rand() * 0.5) * xzRange,
        freqX: 0.3 + rand() * 0.6,
        freqZ: 0.2 + rand() * 0.5,
        phaseX: rand() * Math.PI * 2,
        phaseZ: rand() * Math.PI * 2,
        yAmp: 0.15 + rand() * 0.3,
        yFreq: 0.4 + rand() * 0.4,
      });

      rs.push({
        points: [],
        position: new THREE.Vector3(0, yBase, 0),
      });
    }

    return { paramsList: ps, runtimes: rs };
  }, [count, colors, yRange, xzRange]);

  return (
    <group renderOrder={3}>
      {paramsList.map((params, i) => (
        <Trail
          key={i}
          params={params}
          runtime={runtimes[i]}
          trailLength={trailLength}
          elapsedRef={elapsedRef}
          speed={speed}
          headTexture={headTexture}
        />
      ))}
    </group>
  );
}
