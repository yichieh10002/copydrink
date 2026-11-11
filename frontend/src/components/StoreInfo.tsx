import type { Store } from "@/lib/types";
import { formatPrice } from "@/lib/menu";
import { TopPicks } from "./TopPicks";
import { ToppingSummary } from "./ToppingSummary";
function safeUrl(value?: string) {
  try {
    const url = new URL(value || "");
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function StoreInfo({ store }: { store: Store }) {
  const b = store.document.brand,
    groups = b.optionGroups || [];
  const introduction =
    typeof b.introduction === "string"
      ? { content: b.introduction }
      : b.introduction;
  const regularSizes = new Set(
    store.items.flatMap((i) =>
      i.cups.filter((c) => !c.showWhenChoiceIds?.length).map((c) => c.size),
    ),
  );
  const conditionalSizes = new Set(
    store.items
      .flatMap((i) =>
        i.cups.filter((c) => c.showWhenChoiceIds?.length).map((c) => c.size),
      )
      .filter((s) => !regularSizes.has(s)),
  );
  const capacity = (size: string) =>
    b.cupTypes?.find((c) => c.size === size)?.capacity;
  const cupSummary =
    [...regularSizes]
      .map((size) => size + (capacity(size) ? " " + capacity(size) : ""))
      .join(" · ") +
    (conditionalSizes.size
      ? `；${[...conditionalSizes].join("、")}需選對應溫度`
      : "");
  const summary = (role: "sweetness" | "temperature") => {
    const g = groups.find((x) => x.role === role);
    if (g)
      return g.choices
        .map((x) => x.label + (x.price ? ` +${formatPrice(x.price)}` : ""))
        .join(" · ");
    if (role === "sweetness") return b.sugars?.join(" · ");
    return b.ices?.join(" · ");
  };
  const top = b.topPicks?.enabled ? b.topPicks : null;
  const toppingGroup = groups.find((x) => x.role === "topping");
  const toppings = toppingGroup
    ? toppingGroup.choices.map((choice) => ({
        name: choice.label,
        price: choice.price ?? null,
      }))
    : (b.toppings || []).map((t) => ({ name: t.name, price: t.price }));
  const rules = (
    <div className="store-rules">
      {(
        [
          ["甜度", "sweetness", "◇"],
          ["冰量／溫度", "temperature", "❄"],
          ["配料", "topping", "●"],
          ["杯型容量", "cup", "♧"],
        ] as const
      ).map(([label, role, icon]) => (
        <div className="store-rule" key={role}>
          <span className="rule-icon" aria-hidden="true">
            {icon}
          </span>
          <div>
            <strong>{label}</strong>
            {role === "topping" ? (
              <ToppingSummary toppings={toppings} />
            ) : (
              <small>
                {role === "cup"
                  ? cupSummary || "以商品為準"
                  : summary(role) || "依各商品設定"}
              </small>
            )}
          </div>
        </div>
      ))}
    </div>
  );
  const links = (
    <div className="store-links">
      <strong>店家資料</strong>
      {(
        [
          ["官方網站", b.website],
          ["菜單", b.menuUrl],
          ["門市資訊", b.storesUrl],
          ["熱量資訊", b.nutritionUrl],
        ] as const
      ).map(
        ([label, url]) =>
          safeUrl(url) && (
            <a
              key={label}
              href={safeUrl(url)!}
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
            </a>
          ),
      )}
    </div>
  );
  const notices = b.tags?.length ? (
    <div className="store-notices" aria-label="店家提醒">
      <strong>店家提醒</strong>
      <ul>
        {b.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </div>
  ) : null;
  return (
    <section className="store-intro container" aria-label="店家資料">
      <div className="store-intro-main">
        <div className="store-intro-brand">
          <span className="store-logo large">
            {b.logoUrl ? <img src={b.logoUrl} alt="" /> : b.name.slice(0, 1)}
          </span>
          <h1>{b.name}</h1>
          {introduction?.content && (
            <p className="store-intro-description">{introduction.content}</p>
          )}
          <div className="store-intro-stats">
            <span>{store.regions.length} 個地區營運</span>
            <span>全品項 {store.items.length} 款飲品</span>
          </div>
        </div>
        {top && (
          <div className="store-intro-actions">
            <TopPicks
              title={top.title || "必喝 TOP"}
              description={top.description || ""}
              storeKey={store.key}
              items={(top.itemIds || []).flatMap((id) => {
                const item = store.items.find((i) => i.id === id);
                return item ? [{ item, note: top.notes?.[id] || "" }] : [];
              })}
            />
          </div>
        )}
      </div>
      <div className="store-intro-details">
        <div className="desktop-store-extras">{rules}</div>
        {notices}
        <div className="desktop-store-extras">{links}</div>
      </div>
      <details className="mobile-store-extras">
        <summary>甜度、冰量、配料、杯型與店家資料</summary>
        {rules}
        {links}
      </details>
    </section>
  );
}
