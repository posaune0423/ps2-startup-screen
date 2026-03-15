"use client";

import React, { memo, useMemo } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.999, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorBright;
uniform vec3 uColorMid;
uniform vec3 uColorDark;

varying vec2 vUv;

void main() {
  float d = distance(vUv, vec2(0.0, 1.0));
  float t = smoothstep(0.0, 1.5, d);

  vec3 col = mix(uColorBright, uColorMid, smoothstep(0.0, 0.5, t));
  col = mix(col, uColorDark, smoothstep(0.4, 1.0, t));

  gl_FragColor = vec4(col, 1.0);
}
`;

export default memo(function Ps2BrowserBg() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColorBright: { value: new THREE.Color("#B0B0AE") },
        uColorMid: { value: new THREE.Color("#8A8A88") },
        uColorDark: { value: new THREE.Color("#5C5C5A") },
      },
      depthWrite: false,
      depthTest: false,
    });
  }, []);

  return <mesh renderOrder={-1} frustumCulled={false} material={material} geometry={geometry} />;
});
