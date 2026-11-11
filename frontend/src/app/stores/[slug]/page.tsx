import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/data";
import { StoreInfo } from "@/components/StoreInfo";
import { MenuExperience } from "@/features/menu/MenuExperience";
import { StoreSelectionProvider } from "@/features/menu/StoreSelection";
export const dynamic = "force-dynamic";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ drink?: string; focusDrink?: string }>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params,
    store = await getStore(slug);
  if (!store)
    return { title: "找不到店家", robots: { index: false, follow: false } };
  const name = store.document.brand.name;
  return {
    title: `${name} Menu`,
    description: `${name}菜單：${store.items.length} 款飲品，查看各地區價格、杯型與客製選項，複製飲料文字。`,
    alternates: siteUrl
      ? { canonical: `${siteUrl}/stores/${store.slug}` }
      : undefined,
    openGraph: {
      title: `${name} 菜單｜copydrink`,
      description: `查看${name}飲品與地區價格。`,
      type: "website",
    },
  };
}
export default async function StorePage({ params, searchParams }: Props) {
  const { slug } = await params,
    store = await getStore(slug);
  if (!store) notFound();
  const { drink, focusDrink } = await searchParams;
  return (
    <StoreSelectionProvider
      initialItem={store.items.find((item) => item.id === drink) || null}
    >
      <section className="store-hero">
        <div className="container">
          {store.document.brand.tags?.length ? (
            <div className="hero-tags">
              {store.document.brand.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
          <StoreInfo store={store} />
        </div>
      </section>
      <MenuExperience store={store} focusDrink={focusDrink} />
    </StoreSelectionProvider>
  );
}
