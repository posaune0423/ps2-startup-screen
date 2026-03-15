import assert from "node:assert/strict";

import { test } from "vite-plus/test";

import manifest from "../../src/app/manifest";
import robots from "../../src/app/robots";
import sitemap from "../../src/app/sitemap";
import { siteDescription, siteName, siteShortName, siteThemeColor } from "../../src/constants/site";

const siteUrl = "https://posaune0423.com";

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
    name: siteName,
    short_name: siteShortName,
    description: siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: siteThemeColor,
    theme_color: siteThemeColor,
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
