import type { MetadataRoute } from "next";

const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { en: base, es: `${base}/es` };
  return [
    { url: base, changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: `${base}/es`, changeFrequency: "monthly", priority: 0.9, alternates: { languages } },
  ];
}
