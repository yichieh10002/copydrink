import "server-only";
import { storeFromPublication } from "./menu";
import type { Store, StoreSummary } from "./types";

// This public key can only read published snapshots through the existing RLS policy.
const endpoint =
  process.env.SUPABASE_URL || "https://rdbcwhuhxahekxhrwekd.supabase.co";
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_43Eq9sL1L0opGRsjICs-yw_LkzcL12E";
type Row = { store_key: string; document: unknown; published_at: string };
async function publications(filter?: string): Promise<Row[]> {
  const url = new URL(endpoint + "/rest/v1/menu_publications");
  url.searchParams.set("select", "store_key,document,published_at");
  url.searchParams.set("is_current", "eq.true");
  if (filter) url.searchParams.set("store_key", "eq." + filter);
  const response = await fetch(url, {
    headers: { apikey: publishableKey },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("已發布菜單暫時無法讀取");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error("已發布菜單格式不正確");
  return rows as Row[];
}
export async function getStores(): Promise<Store[]> {
  return (await publications())
    .map(storeFromPublication)
    .filter((s): s is Store => !!s);
}
export async function getStoreSummaries(): Promise<StoreSummary[]> {
  return (await getStores()).map((s) => ({
    key: s.key,
    slug: s.slug,
    name: s.document.brand.name,
    logoUrl: s.document.brand.logoUrl,
    regionCount: s.regions.length,
    drinkCount: s.items.length,
    aliases: s.document.brand.aliases,
    searchAliases: s.document.brand.searchAliases,
    zhuyinAliases: s.document.brand.zhuyinAliases,
  }));
}
export async function getStore(slug: string): Promise<Store | null> {
  // The current schema has no separate public summary table, so resolve the stable slug
  // against the published snapshots. A summary endpoint can replace this later.
  const rows = await publications();
  return (
    rows
      .map(storeFromPublication)
      .find((s): s is Store => !!s && s.slug === slug) || null
  );
}

export async function getWarmNotices(): Promise<
  Array<{ brand: string; note: string }>
> {
  const rows = await publications("site-warm-drink-notices");
  const document = rows[0]?.document as
    | {
        scope?: string;
        kind?: string;
        notices?: Array<{
          brand?: string;
          note?: string;
          enabled?: boolean;
          order?: number;
        }>;
      }
    | undefined;
  if (
    document?.scope !== "site-settings" ||
    document.kind !== "warm-drink-notices"
  )
    return [];
  return (document.notices || [])
    .filter(
      (item) =>
        item.enabled !== false && item.brand?.trim() && item.note?.trim(),
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((item) => ({ brand: item.brand!.trim(), note: item.note!.trim() }));
}
