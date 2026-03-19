import type { Object3D } from "three";

const TEXTURE_KEYS = [
  "alphaMap",
  "aoMap",
  "bumpMap",
  "clearcoatMap",
  "clearcoatNormalMap",
  "clearcoatRoughnessMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "gradientMap",
  "iridescenceMap",
  "iridescenceThicknessMap",
  "lightMap",
  "map",
  "matcap",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "sheenColorMap",
  "sheenRoughnessMap",
  "specularColorMap",
  "specularIntensityMap",
  "thicknessMap",
  "transmissionMap",
] as const;

const releasedScenes = new WeakSet<Object3D>();
const sceneRegistry = new Map<string, Object3D>();

interface DisposableTexture {
  dispose: () => void;
}

interface DisposableMaterial {
  dispose: () => void;
  [key: string]: unknown;
}

interface DisposableMesh extends Object3D {
  geometry?: {
    dispose: () => void;
  };
  material?: DisposableMaterial | DisposableMaterial[];
}

function isDisposableTexture(value: unknown): value is DisposableTexture {
  return typeof value === "object" && value !== null && "dispose" in value && typeof value.dispose === "function";
}

function isDisposableMesh(object: Object3D): object is DisposableMesh {
  return "geometry" in object || "material" in object;
}

function disposeMaterial(material: DisposableMaterial) {
  for (const key of TEXTURE_KEYS) {
    const value: unknown = material[key];
    if (isDisposableTexture(value)) {
      value.dispose();
    }
  }

  material.dispose();
}

export function disposeSceneResources(root: Object3D) {
  root.traverse((object) => {
    if (!isDisposableMesh(object)) return;

    object.geometry?.dispose();

    if (Array.isArray(object.material)) {
      for (const material of object.material) {
        disposeMaterial(material);
      }
      return;
    }

    if (object.material) {
      disposeMaterial(object.material);
    }
  });
}

export function registerGLTFScene(path: string, scene: Object3D) {
  sceneRegistry.set(path, scene);
}

export function clearGLTF(path: string, clear: (path: string) => void) {
  const scene = sceneRegistry.get(path);
  if (scene && !releasedScenes.has(scene)) {
    disposeSceneResources(scene);
    releasedScenes.add(scene);
  }
  sceneRegistry.delete(path);
  clear(path);
}

export function releaseGLTFAsset(path: string, scene: Object3D | null | undefined, clear: (path: string) => void) {
  if (scene && !releasedScenes.has(scene)) {
    disposeSceneResources(scene);
    releasedScenes.add(scene);
  }

  clear(path);
}
