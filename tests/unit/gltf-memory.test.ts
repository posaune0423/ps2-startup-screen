import assert from "node:assert/strict";

import * as THREE from "three";
import { test } from "vite-plus/test";

import { disposeSceneResources, releaseGLTFAsset } from "../../src/lib/gltf-memory";

test("disposeSceneResources releases mesh geometry, materials, and texture maps", () => {
  const texture = new THREE.Texture();
  let textureDisposed = 0;
  texture.dispose = () => {
    textureDisposed += 1;
  };

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  let geometryDisposed = 0;
  geometry.dispose = () => {
    geometryDisposed += 1;
  };

  const material = new THREE.MeshStandardMaterial();
  material.map = texture;
  let materialDisposed = 0;
  material.dispose = () => {
    materialDisposed += 1;
  };

  const mesh = new THREE.Mesh(geometry, material);
  const root = new THREE.Group();
  root.add(mesh);

  disposeSceneResources(root);

  assert.equal(geometryDisposed, 1);
  assert.equal(materialDisposed, 1);
  assert.equal(textureDisposed, 1);
});

test("releaseGLTFAsset is safe to call more than once for the same scene", () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  let geometryDisposed = 0;
  geometry.dispose = () => {
    geometryDisposed += 1;
  };

  const material = new THREE.MeshStandardMaterial();
  let materialDisposed = 0;
  material.dispose = () => {
    materialDisposed += 1;
  };

  const mesh = new THREE.Mesh(geometry, material);
  const root = new THREE.Group();
  root.add(mesh);

  let clearCalls = 0;
  const clear = () => {
    clearCalls += 1;
  };

  releaseGLTFAsset("/3d/work/velvett.glb", root, clear);
  releaseGLTFAsset("/3d/work/velvett.glb", root, clear);

  assert.equal(geometryDisposed, 1);
  assert.equal(materialDisposed, 1);
  assert.equal(clearCalls, 2);
});
