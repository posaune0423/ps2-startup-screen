import * as THREE from "three";

const billboardVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;

  // Billboard: anchor at mesh origin, expand in screen space
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
uniform vec3 uColor;
uniform float uOpacity;
uniform float uNoiseScale;
uniform vec2 uScrollSpeed1;
uniform vec2 uScrollSpeed2;
uniform float uFbmStrength;
uniform float uVerticalFade;  // 0 = no vertical fade, 1 = full bottom-to-top fade

varying vec2 vUv;

// simplex noise — Ashima Arts / stegu
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
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
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 x) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 5; i++) {
    v += a * snoise(x);
    x = x * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

vec4 levelRange(vec4 color, float minInput, float maxInput) {
  return min(max(color - vec4(minInput), vec4(0.0)) / (vec4(maxInput) - vec4(minInput)), vec4(1.0));
}

vec4 gammaCorrect(vec4 color, float gamma) {
  return pow(color, vec4(1.0 / gamma));
}

vec4 levels(vec4 color, float minInput, float gamma, float maxInput) {
  return gammaCorrect(levelRange(color, minInput, maxInput), gamma);
}

void main() {
  vec2 uv = vUv;
  float t = uTime;

  // two scrolling noise layers with FBM displacement
  vec3 coord1 = vec3(uv * uNoiseScale + uScrollSpeed1 * t, t * 0.05);
  vec3 coord2 = vec3(uv * uNoiseScale + uScrollSpeed2 * t + 50.0, t * 0.03 + 10.0);

  float disp1 = fbm(vec3(uv * 2.0, t * 0.08)) * uFbmStrength;
  float disp2 = fbm(vec3(uv * 2.0 + 30.0, t * 0.06 + 5.0)) * uFbmStrength;
  coord1.xy += disp1;
  coord2.xy += disp2;

  float noise1 = fbm(coord1) * 0.5 + 0.5;
  float noise2 = fbm(coord2) * 0.5 + 0.5;

  float combined = (noise1 + noise2) * 0.6;
  float alpha = levels(vec4(combined), 0.2, 0.4, 0.7).r;

  // shape mask — blend between radial circle and vertical vapor
  vec2 center = uv - 0.5;
  float dist = length(center) * 2.0;

  // radial falloff
  float radial = 1.0 - smoothstep(0.3, 1.0, dist);

  // vertical vapor: dense at bottom (uv.y=0), transparent at top (uv.y=1)
  // with horizontal falloff too
  float horizFade = 1.0 - smoothstep(0.2, 0.5, abs(center.x));
  float vertFade = 1.0 - smoothstep(0.0, 0.9, uv.y);
  vertFade *= vertFade; // quadratic falloff for softer top
  float vapor = horizFade * vertFade;

  float shape = mix(radial, vapor, uVerticalFade);
  alpha *= shape;

  alpha *= uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export interface CloudFogParams {
  color: string;
  opacity: number;
  blending: THREE.Blending;
  noiseScale?: number;
  scrollSpeed1?: [number, number];
  scrollSpeed2?: [number, number];
  fbmStrength?: number;
  verticalFade?: number;
}

export function createCloudFogMaterial(params: CloudFogParams): THREE.ShaderMaterial {
  const color = new THREE.Color(params.color);
  return new THREE.ShaderMaterial({
    vertexShader: billboardVertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: color },
      uOpacity: { value: params.opacity },
      uNoiseScale: { value: params.noiseScale ?? 3.0 },
      uScrollSpeed1: {
        value: new THREE.Vector2(...(params.scrollSpeed1 ?? [0.02, -0.015])),
      },
      uScrollSpeed2: {
        value: new THREE.Vector2(...(params.scrollSpeed2 ?? [-0.01, 0.012])),
      },
      uFbmStrength: { value: params.fbmStrength ?? 0.3 },
      uVerticalFade: { value: params.verticalFade ?? 1.0 },
    },
    transparent: true,
    blending: params.blending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
