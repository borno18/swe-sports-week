import type { MetadataRoute } from "next";
import { sports } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://swe-sports-week.vercel.app";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sports`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/results`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/champions`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/volunteers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/announcements`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const sportRoutes: MetadataRoute.Sitemap = sports.map((sport) => ({
    url: `${baseUrl}/sports/${sport.slug}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...sportRoutes];
}
