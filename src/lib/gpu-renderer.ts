import * as THREE from "three";
import type { WebGPURenderer } from "three/webgpu";

let _webgpuSupported: boolean | null = null;
let _modulePromise: Promise<{ WebGPURenderer: typeof WebGPURenderer }> | null = null;

async function probeWebGPU(): Promise<boolean> {
  if (_webgpuSupported !== null) return _webgpuSupported;
  try {
    if (typeof navigator === "undefined" || !navigator.gpu) {
      _webgpuSupported = false;
      return false;
    }
    const adapter = await navigator.gpu.requestAdapter();
    _webgpuSupported = adapter !== null;
  } catch {
    _webgpuSupported = false;
  }
  return _webgpuSupported;
}

async function loadModule() {
  if (!_modulePromise) {
    _modulePromise = import("three/webgpu") as unknown as Promise<{
      WebGPURenderer: typeof WebGPURenderer;
    }>;
  }
  return _modulePromise;
}

/**
 * Pre-warm WebGPU detection and module loading.
 * Call early in app lifecycle so the first Canvas mount is faster.
 */
export function warmupGPU(): void {
  void probeWebGPU().then(async (ok) => {
    if (ok) await loadModule();
  });
}

function isHTMLCanvas(v: unknown): v is HTMLCanvasElement {
  return typeof HTMLCanvasElement !== "undefined" && v instanceof HTMLCanvasElement;
}

function toWebGLParams(defaults: Record<string, unknown>): THREE.WebGLRendererParameters {
  const params: THREE.WebGLRendererParameters = {};
  if (isHTMLCanvas(defaults.canvas)) params.canvas = defaults.canvas;
  if (typeof defaults.antialias === "boolean") params.antialias = defaults.antialias;
  if (typeof defaults.alpha === "boolean") params.alpha = defaults.alpha;
  if (typeof defaults.powerPreference === "string")
    params.powerPreference = defaults.powerPreference as THREE.WebGLRendererParameters["powerPreference"];
  return params;
}

/**
 * Async renderer factory for R3F's `gl` prop.
 * Returns WebGPURenderer when available, otherwise WebGLRenderer.
 */
export async function createGPURenderer(defaults: Record<string, unknown>) {
  const supported = await probeWebGPU();
  if (supported && isHTMLCanvas(defaults.canvas)) {
    try {
      const mod = await loadModule();
      const renderer = new mod.WebGPURenderer({
        canvas: defaults.canvas,
        antialias: typeof defaults.antialias === "boolean" ? defaults.antialias : true,
        alpha: typeof defaults.alpha === "boolean" ? defaults.alpha : true,
        powerPreference:
          typeof defaults.powerPreference === "string" ? (defaults.powerPreference as GPUPowerPreference) : undefined,
      });
      await renderer.init();
      return renderer;
    } catch {
      // WebGPU init failed — fall through to WebGL
    }
  }
  return new THREE.WebGLRenderer(toWebGLParams(defaults));
}
