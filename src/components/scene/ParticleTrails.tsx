"use client";

import { useFrame } from "@react-three/fiber";
import React, { memo, useRef, useMemo } from "react";
import * as THREE from "three";

import { createTrailHeadTexture } from "@/lib/glowTexture";

import { CONFIG } from "./config";
import { getSpeedMultiplier } from "./timeline";

interface TrailParams {
  id: string;
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
  ring: Float32Array;
  head: number;
  count: number;
  position: THREE.Vector3;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const HEAD_SCALE: [number, number, number] = [0.08, 0.08, 1];
const HALO_SCALE: [number, number, number] = [0.2, 0.2, 1];

const Trail = memo(function Trail({
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
  const { geometry, material, lineObject, positionAttribute, colorAttribute, positionArray, colorArray } =
    useMemo(() => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(trailLength * 3);
      const colors = new Float32Array(trailLength * 3);
      const linePositionAttribute = new THREE.BufferAttribute(positions, 3);
      const lineColorAttribute = new THREE.BufferAttribute(colors, 3);
      geo.setAttribute("position", linePositionAttribute);
      geo.setAttribute("color", lineColorAttribute);
      geo.setDrawRange(0, 0);

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      return {
        geometry: geo,
        material: mat,
        lineObject: new THREE.Line(geo, mat),
        positionAttribute: linePositionAttribute,
        colorAttribute: lineColorAttribute,
        positionArray: positions,
        colorArray: colors,
      };
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

    const pos = runtime.position;
    pos.x = Math.sin(t * params.freqX + params.phaseX) * params.radiusX;
    pos.z = Math.sin(t * params.freqZ + params.phaseZ) * params.radiusZ;
    pos.y = params.yBase + Math.sin(t * params.yFreq) * params.yAmp;

    const ring = runtime.ring;
    runtime.head = (runtime.head - 1 + trailLength) % trailLength;
    const h = runtime.head;
    ring[h * 3] = pos.x;
    ring[h * 3 + 1] = pos.y;
    ring[h * 3 + 2] = pos.z;
    if (runtime.count < trailLength) runtime.count++;

    const c = params.color;
    const len = runtime.count;
    const invLen = len > 1 ? 1 / (len - 1) : 0;

    for (let j = 0; j < len; j++) {
      const idx = (h + j) % trailLength;
      const off = j * 3;
      const src = idx * 3;
      positionArray[off] = ring[src];
      positionArray[off + 1] = ring[src + 1];
      positionArray[off + 2] = ring[src + 2];

      const fade = 1 - j * invLen;
      colorArray[off] = c.r * fade;
      colorArray[off + 1] = c.g * fade;
      colorArray[off + 2] = c.b * fade;
    }

    for (let j = len; j < trailLength; j++) {
      const off = j * 3;
      positionArray[off] = pos.x;
      positionArray[off + 1] = pos.y;
      positionArray[off + 2] = pos.z;
      colorArray[off] = 0;
      colorArray[off + 1] = 0;
      colorArray[off + 2] = 0;
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    geometry.setDrawRange(0, len);

    const { accelStart, duration: dur } = CONFIG.timeline;
    const alphaDim = elapsed > accelStart ? Math.max(0, 1 - (elapsed - accelStart) / (dur - accelStart)) : 1;
    material.opacity = 0.9 * alphaDim;

    if (headSpriteRef.current) {
      headSpriteRef.current.position.copy(pos);
      headSpriteMat.opacity = alphaDim;
    }
    if (haloSpriteRef.current) {
      haloSpriteRef.current.position.copy(pos);
      haloSpriteMat.opacity = 0.6 * alphaDim;
    }
  });

  return (
    <group>
      <primitive object={lineObject} />
      <sprite ref={headSpriteRef} material={headSpriteMat} scale={HEAD_SCALE} renderOrder={4} />
      <sprite ref={haloSpriteRef} material={haloSpriteMat} scale={HALO_SCALE} renderOrder={3} />
    </group>
  );
});

export default memo(function ParticleTrails({ elapsedRef }: { elapsedRef: React.RefObject<number> }) {
  const { count, trailLength, speed, colors, yRange, xzRange } = CONFIG.particle;

  const headTexture = useMemo(() => createTrailHeadTexture(), []);

  const { paramsList, runtimes } = useMemo(() => {
    const rand = seededRandom(789);
    const ps: TrailParams[] = [];
    const rs: TrailRuntime[] = [];

    for (let i = 0; i < count; i++) {
      const yBase = yRange[0] + rand() * (yRange[1] - yRange[0]);

      ps.push({
        id: `trail-${i}`,
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
        ring: new Float32Array(trailLength * 3),
        head: 0,
        count: 0,
        position: new THREE.Vector3(0, yBase, 0),
      });
    }

    return { paramsList: ps, runtimes: rs };
  }, [count, colors, yRange, xzRange, trailLength]);

  return (
    <group renderOrder={3}>
      {paramsList.map((params, i) => (
        <Trail
          key={params.id}
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
});
