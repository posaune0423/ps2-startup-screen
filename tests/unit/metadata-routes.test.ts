import assert from "node:assert/strict";

import { test } from "vite-plus/test";

import manifest from "../../src/app/manifest";
import robots from "../../src/app/robots";
import sitemap from "../../src/app/sitemap";

const siteUrl = "https://ps2.posaune0423.com";

test("sitemap exposes the home page with the canonical site URL", () => {
  assert.deepEqual(sitemap(), [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
  ]);
});

test("robots allows crawling and points to the sitemap", () => {
  assert.deepEqual(robots(), {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  });
});

test("manifest describes the single-page experience and icons", () => {
  assert.deepEqual(manifest(), {
    name: "PS2 Startup Screen",
    short_name: "PS2 Startup",
    description:
      "PlayStation 2 の起動画面（タワーシーン）を Three.js でリアルタイム再現。React Three Fiber によるインタラクティブ 3D デモ。",
    start_url: "/",
    display: "standalone",
    background_color: "#1A1A1A",
    theme_color: "#1A1A1A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  });
});
