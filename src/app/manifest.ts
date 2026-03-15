import { siteDescription, siteName, siteThemeColor } from "../constants/site";

export default function manifest() {
  return {
    name: siteName,
    short_name: "PS2 Startup",
    description: siteDescription,
    start_url: "/",
    display: "standalone" as const,
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
  };
}
