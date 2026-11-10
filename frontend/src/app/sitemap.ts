import type { MetadataRoute } from "next";
import { getStoreSummaries } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  const stores = await getStoreSummaries();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...stores.map((s) => ({
      url: `${base}/stores/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
