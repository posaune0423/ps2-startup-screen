import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { test } from "vite-plus/test";

const GLB_PATHS = [
  "../../public/3d/memorycard.glb",
  "../../public/3d/icons/cd.glb",
  "../../public/3d/work/velvett.glb",
  "../../public/3d/work/dena.glb",
  "../../public/3d/work/daiko.glb",
  "../../public/3d/work/doom.glb",
  "../../public/3d/sns/linkedin.glb",
  "../../public/3d/sns/twitter.glb",
  "../../public/3d/sns/github.glb",
] as const;

interface GlbJson {
  extensionsUsed?: string[];
  meshes?: Array<{
    primitives?: Array<{
      extensions?: Record<string, unknown>;
    }>;
  }>;
}

function isGlbJson(value: unknown): value is GlbJson {
  return typeof value === "object" && value !== null;
}

function readGlbJson(relativePath: (typeof GLB_PATHS)[number]) {
  const buffer = readFileSync(new URL(relativePath, import.meta.url));

  assert.equal(buffer.toString("utf8", 0, 4), "glTF");
  assert.equal(buffer.readUInt32LE(4), 2);

  const jsonChunkLength = buffer.readUInt32LE(12);
  const jsonChunkType = buffer.toString("utf8", 16, 20);

  assert.equal(jsonChunkType, "JSON");

  const parsed: unknown = JSON.parse(buffer.toString("utf8", 20, 20 + jsonChunkLength));
  assert.ok(isGlbJson(parsed));
  return parsed;
}

test("memory-related GLB assets are Draco compressed", () => {
  for (const path of GLB_PATHS) {
    const json = readGlbJson(path);
    const usesDraco =
      json.extensionsUsed?.includes("KHR_draco_mesh_compression") ||
      json.meshes?.some((mesh) =>
        mesh.primitives?.some((primitive) => primitive.extensions?.KHR_draco_mesh_compression),
      );

    assert.ok(usesDraco, `${path} is missing KHR_draco_mesh_compression`);
  }
});
