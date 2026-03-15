import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  // Billboard: expand in screen space from mesh origin
  vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float scaleX = length(vec3(modelMatrix[0].x, modelMatrix[0].y, modelMatrix[0].z));
  float scaleY = length(vec3(modelMatrix[1].x, modelMatrix[1].y, modelMatrix[1].z));
  mvPosition.xy += position.xy * vec2(scaleX, scaleY);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3  uColor;
uniform float uOpacity;
uniform float uNoiseScale;
uniform vec2  uScrollSpeed1;
uniform vec2  uScrollSpeed2;
uniform float uFbmStrength;
uniform float uInnerRadius;  // hollow center threshold (0–1 in UV space)
uniform float uOuterRadius;  // fade-out start (0–1)
uniform float uRingWidth;    // soft blend width

varying vec2 vUv;

// Ashima/stegu simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j  = p - 49.0*floor(p*ns.z*ns.z);
  vec4 x_ = floor(j*ns.z);
  vec4 y_ = floor(j - 7.0*x_);
  vec4 x  = x_*ns.x + ns.yyyy;
  vec4 y  = y_*ns.x + ns.yyyy;
  vec4 h  = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m*m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float fbm(vec3 x) {
  float v = 0.0, a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 5; i++) { v += a*snoise(x); x = x*2.0+shift; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  float t = uTime;

  // Two displaced FBM layers
  vec3 c1 = vec3(uv * uNoiseScale + uScrollSpeed1 * t, t * 0.04);
  vec3 c2 = vec3(uv * uNoiseScale + uScrollSpeed2 * t + 50.0, t * 0.03 + 10.0);
  float d1 = fbm(vec3(uv * 1.5, t * 0.06)) * uFbmStrength;
  float d2 = fbm(vec3(uv * 1.5 + 30.0, t * 0.05)) * uFbmStrength;
  c1.xy += d1; c2.xy += d2;

  float n1 = fbm(c1) * 0.5 + 0.5;
  float n2 = fbm(c2) * 0.5 + 0.5;
  float noise = (n1 + n2) * 0.55;
  // smooth noise into usable alpha range
  float alpha = smoothstep(0.25, 0.75, noise);

  // Ring mask: hollow center + outer fade
  vec2  center = uv - 0.5;
  float dist   = length(center) * 2.0; // 0=center, 1=corner

  float innerMask = smoothstep(uInnerRadius - uRingWidth, uInnerRadius + uRingWidth, dist);
  float outerMask = 1.0 - smoothstep(uOuterRadius - uRingWidth, uOuterRadius + uRingWidth, dist);
  float ring = innerMask * outerMask;

  alpha *= ring * uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export interface RingFogParams {
  color: string;
  opacity: number;
  noiseScale?: number;
  scrollSpeed1?: [number, number];
  scrollSpeed2?: [number, number];
  fbmStrength?: number;
  innerRadius?: number;
  outerRadius?: number;
  ringWidth?: number;
}

export function createRingFogMaterial(params: RingFogParams): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(params.color) },
      uOpacity: { value: params.opacity },
      uNoiseScale: { value: params.noiseScale ?? 2.5 },
      uScrollSpeed1: { value: new THREE.Vector2(...(params.scrollSpeed1 ?? [0.012, -0.008])) },
      uScrollSpeed2: { value: new THREE.Vector2(...(params.scrollSpeed2 ?? [-0.009, 0.011])) },
      uFbmStrength: { value: params.fbmStrength ?? 0.25 },
      uInnerRadius: { value: params.innerRadius ?? 0.25 },
      uOuterRadius: { value: params.outerRadius ?? 0.85 },
      uRingWidth: { value: params.ringWidth ?? 0.18 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
