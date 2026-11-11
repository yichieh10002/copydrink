import { redirect } from "next/navigation";
import { getStores, getWarmNotices } from "@/lib/data";
import { StoreCard } from "@/components/StoreCard";
import { HomeSearch } from "@/components/HomeSearch";
import { HomeTools } from "@/features/home/HomeTools";
import { availableCups, effectiveGroups } from "@/lib/menu";
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const published = await getStores();
  const stores = published.map((s) => ({
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
  const notices = await getWarmNotices();
  const quickStores = published.map((s) => {
    const groups = s.document.brand.optionGroups || [];
    const labels = (role: string) =>
      groups.find((g) => g.role === role)?.choices.map((c) => c.label) || [];
    return {
      name: s.document.brand.name,
      slug: s.slug,
      items: s.items.map((i) => {
        const cups = availableCups(i, s.regions[0]?.id || "");
        const groups = cups[0] ? effectiveGroups(s.document, i, cups[0]) : [];
        const labels = (role: string) =>
          groups.find((g) => g.role === role)?.choices.map((c) => c.label) ||
          [];
        const customGroups = Array.from(
          cups
            .flatMap((cup) => effectiveGroups(s.document, i, cup))
            .filter((group) => group.role === "custom")
            .reduce((all, group) => {
              const prior = all.get(group.id);
              if (!prior) {
                all.set(group.id, { ...group, choices: [...group.choices] });
              } else {
                for (const choice of group.choices)
                  if (!prior.choices.some((item) => item.id === choice.id))
                    prior.choices.push(choice);
              }
              return all;
            }, new Map<string, ReturnType<typeof effectiveGroups>[number]>()),
        ).map(([, group]) => group);
        return {
          id: i.id,
          name: i.name,
          sizes: [...new Set(i.cups.map((c) => c.size))],
          sugars: labels("sweetness"),
          ices: labels("temperature"),
          toppings: labels("topping"),
          customGroups,
        };
      }),
      sugars: labels("sweetness"),
      ices: labels("temperature"),
      toppings: labels("topping"),
    };
  });
  const { brand } = await searchParams;
  const legacy =
    brand && stores.find((s) => s.name === brand || s.aliases?.includes(brand));
  if (legacy) redirect(`/stores/${legacy.slug}`);
  return (
    <>
      <section className="home-hero">
        <div className="hero-scene" aria-hidden="true" />
        <div className="container">
          <span className="eyebrow">YOUR DAILY DRINK NOTE</span>
          <h1>今天這杯，照你的口味。</h1>
          <p>找菜單、選口味，複製貼回群組。</p>
          <HomeSearch stores={stores} drinks={drinks} />
        </div>
      </section>
      <section className="home-list container">
        <HomeTools stores={quickStores} notices={notices} />
        <div className="section-heading">
          <h2>探索店家</h2>
          <p>選一家，看看今天想喝的那杯。</p>
        </div>
        <div className="store-grid">
          {stores.map((store) => (
            <StoreCard store={store} key={store.key} />
          ))}
        </div>
      </section>
    </>
  );
}
