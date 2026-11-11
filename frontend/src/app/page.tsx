import { redirect } from "next/navigation";
import { getStores } from "@/lib/data";
import { StoreDirectory } from "@/components/StoreDirectory";
import { HomeSearch } from "@/components/HomeSearch";
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const published = await getStores();
  const stores = published
    .map((s) => ({
      key: s.key,
      slug: s.slug,
      name: s.document.brand.name,
      logoUrl: s.document.brand.logoUrl,
      regionCount: s.regions.length,
      drinkCount: s.items.length,
      aliases: s.document.brand.aliases,
      searchAliases: s.document.brand.searchAliases,
      zhuyinAliases: s.document.brand.zhuyinAliases,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
  const drinks = published.flatMap((s) =>
    s.items.map((i) => ({
      id: i.id,
      name: i.name,
      storeName: s.document.brand.name,
      slug: s.slug,
      category:
        s.document.brand.categories?.find((c) => c.id === i.categoryId)
          ?.label || i.menuCategory,
      note: i.note,
      logoUrl: s.document.brand.logoUrl,
      searchTerms: [
        ...(i.tags || []),
        ...(s.document.brand.categories?.find((c) => c.id === i.categoryId)
          ?.tags || []),
      ],
    })),
  );
  const { brand } = await searchParams;
  const legacy =
    brand && stores.find((s) => s.name === brand || s.aliases?.includes(brand));
  if (legacy) redirect(`/stores/${legacy.slug}`);
  return (
    <>
      <section className="home-hero">
        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="eyebrow">YOUR DAILY DRINK NOTE</span>
            <h1>
              今天這杯，
              <br />
              照你的口味。
            </h1>
            <p>找菜單、選口味，複製貼回群組。</p>
            <HomeSearch stores={stores} drinks={drinks} />
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="hero-art-note">FIND · PICK · COPY</span>
          </div>
        </div>
      </section>
      <section className="home-list container">
        <div className="section-heading">
          <h2>探索店家</h2>
          <p>瀏覽熱門手搖飲料品牌，快速查看菜單或一鍵複製訂購文字</p>
        </div>
        <StoreDirectory stores={stores} />
      </section>
    </>
  );
}
