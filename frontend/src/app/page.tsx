import type { CSSProperties } from "react";
import { StarFourIcon } from "@phosphor-icons/react/dist/ssr/StarFour";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { redirect } from "next/navigation";
import { getStores } from "@/lib/data";
import { StoreDirectory } from "@/components/StoreDirectory";
import { HomeSearch } from "@/components/HomeSearch";
export const dynamic = "force-dynamic";

const MARQUEE_WORDS = [
  "MILK TEA",
  "FRUIT TEA",
  "OOLONG",
  "LATTE",
  "MATCHA",
  "BOBA",
  "FIND · PICK · COPY",
];

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
        <span className="hero-glow hero-glow-a" aria-hidden="true" />
        <span className="hero-glow hero-glow-b" aria-hidden="true" />
        <span className="hero-glow hero-glow-c" aria-hidden="true" />
        <div className="hero-giant" aria-hidden="true">
          COPYDRINK
        </div>
        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="eyebrow">YOUR DAILY DRINK NOTE</span>
            <h1>
              <span className="hero-line">
                <span>今天這杯，</span>
              </span>
              <span className="hero-line">
                <span>
                  照你的<em>口味</em>。
                </span>
              </span>
            </h1>
            <p>找菜單、選口味，複製貼回群組。</p>
            <HomeSearch stores={stores} drinks={drinks} />
            <dl className="hero-stats">
              {(
                [
                  ["收錄品牌", stores.length],
                  ["收錄飲品", drinks.length],
                ] as const
              ).map(([label, count]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <span
                      className="count-up"
                      style={{ "--target": count } as CSSProperties}
                      aria-hidden="true"
                    />
                    <span className="sr-only">{count}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-art" />
            <svg className="hero-badge" viewBox="0 0 120 120">
              <defs>
                <path
                  id="hero-badge-path"
                  d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"
                />
              </defs>
              <circle className="hero-badge-disc" cx="60" cy="60" r="58" />
              <text>
                <textPath href="#hero-badge-path" textLength="270">
                  FIND · PICK · COPY · FIND · PICK · COPY ·
                </textPath>
              </text>
              <StarFourIcon
                className="hero-badge-mark"
                x={43}
                y={43}
                width={34}
                height={34}
                weight="fill"
              />
            </svg>
            <span className="hero-pearl hero-pearl-1" />
            <span className="hero-pearl hero-pearl-2" />
            <span className="hero-pearl hero-pearl-3" />
            <span className="hero-pearl hero-pearl-4" />
            <span className="hero-pearl hero-pearl-5" />
            <span className="hero-chip hero-chip-a">半糖 · 少冰</span>
            <span className="hero-chip hero-chip-b">
              已複製 <CheckIcon size={16} weight="bold" />
            </span>
          </div>
        </div>
      </section>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-band">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <span key={copy}>
                {MARQUEE_WORDS.map((word, index) => (
                  <span key={word} className={index % 2 ? "outline" : ""}>
                    {word}
                    <i>
                      <StarFourIcon size={20} weight="fill" />
                    </i>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
      <section className="home-list">
        <div className="container">
          <div className="section-heading">
            <span className="section-kicker" aria-hidden="true">
              STORES
            </span>
            <h2>探索店家</h2>
            <p>瀏覽熱門手搖飲料品牌，快速查看菜單或一鍵複製訂購文字</p>
          </div>
          <StoreDirectory stores={stores} />
        </div>
      </section>
    </>
  );
}
