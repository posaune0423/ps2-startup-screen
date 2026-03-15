import { siteUrl } from "../constants/site";

export default function sitemap() {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly" as const,
      priority: 1,
    },
  ];
}
