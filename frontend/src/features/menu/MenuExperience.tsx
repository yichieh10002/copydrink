"use client";
import { useEffect, useMemo, useState } from "react";
import type { Store } from "@/lib/types";
import {
  availableCups,
  formatPrice,
  itemTags,
  priceFor,
  visibleCups,
} from "@/lib/menu";
import { OrderDialog } from "@/features/order/OrderDialog";
import { useStoreSelection } from "./StoreSelection";
import { track } from "@/lib/analytics";

export function MenuExperience({
  store,
  focusDrink,
}: {
  store: Store;
  focusDrink?: string;
}) {
  const { selected, setSelected } = useStoreSelection();
  const [region, setRegion] = useState(store.regions[0]?.id || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!focusDrink || !store.items.some((item) => item.id === focusDrink))
      return;
    const target = document.getElementById(`menu-item-${focusDrink}`);
    if (!target) {
      const firstRegion = store.regions.find((r) =>
        store.items.some(
          (item) => item.id === focusDrink && availableCups(item, r.id).length,
        ),
      );
      if (firstRegion && firstRegion.id !== region) setRegion(firstRegion.id);
      return;
    }
    target.focus({ preventScroll: true });
    target.classList.add("search-highlight");
    target.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    const timeout = window.setTimeout(
      () => target.classList.remove("search-highlight"),
      2200,
    );
    return () => {
      window.clearTimeout(timeout);
      target.classList.remove("search-highlight");
    };
  }, [focusDrink, region, store]);
  const topIds = new Set(
    store.document.brand.topPicks?.enabled
      ? store.document.brand.topPicks.itemIds || []
      : [],
  );
  const categories = useMemo(() => {
    const source: Array<{ id: string; name: string; label?: string }> = store
      .document.brand.categories?.length
      ? store.document.brand.categories
      : store.document.brand.menus?.map((name, i) => ({
          id: String(i),
          name,
        })) || [];
    const listed = source.filter((c) =>
      store.items.some((i) =>
        i.categoryId ? i.categoryId === c.id : i.menuCategory === c.name,
      ),
    );
    for (const item of store.items) {
      const id = item.categoryId || item.menuCategory;
      if (!listed.some((c) => c.id === id)) {
        listed.push({ id, name: item.menuCategory || "其他飲品" });
      }
    }
    return listed;
  }, [store]);
  const items = store.items.filter(
    (i) =>
      availableCups(i, region).length &&
      (!selectedCategories.length ||
        selectedCategories.some(
          (category) =>
            i.categoryId === category ||
            (!i.categoryId &&
              i.menuCategory ===
                categories.find((c) => c.id === category)?.name),
        )) &&
      (!query.trim() ||
        [i.name, i.note || "", i.menuCategory].some((v) =>
          v
            .normalize("NFKC")
            .toLowerCase()
            .includes(query.normalize("NFKC").toLowerCase().trim()),
        )),
  );
  return (
    <section className="menu-section container" aria-labelledby="menu-title">
      <h2 id="menu-title" className="sr-only">
        {store.document.brand.name} 菜單
      </h2>
      <div className="menu-tools">
        <label className="menu-search">
          <span className="sr-only">搜尋這家店的飲料</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`搜尋 ${store.document.brand.name} 的飲料`}
          />
        </label>
        {store.regions.length > 1 && (
          <div className="region-tabs" aria-label="地區菜單">
            {store.regions.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={region === r.id}
                onClick={() => {
                  setRegion(r.id);
                  track({
                    type: "region_change",
                    store: store.key,
                    region: r.id,
                  });
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}
        <div
          className="category-tabs"
          role="group"
          aria-label="飲料分類，可複選"
        >
          <button
            type="button"
            aria-pressed={!selectedCategories.length}
            onClick={() => setSelectedCategories([])}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              aria-pressed={selectedCategories.includes(c.id)}
              onClick={() =>
                setSelectedCategories((current) =>
                  current.includes(c.id)
                    ? current.filter((id) => id !== c.id)
                    : [...current, c.id],
                )
              }
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      {items.length ? (
        <div className="menu-grid">
          {categories
            .filter(
              (c) =>
                !selectedCategories.length || selectedCategories.includes(c.id),
            )
            .map((c) => {
              const group = items.filter((i) =>
                i.categoryId
                  ? i.categoryId === c.id
                  : i.menuCategory === c.name,
              );
              return group.length ? (
                <section className="menu-category" key={c.id}>
                  <h3>{c.label || c.name}</h3>
                  <ul>
                    {group.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="drink-row"
                          id={`menu-item-${item.id}`}
                          onClick={() => {
                            setSelected(item);
                            track({
                              type: "drink_open",
                              store: store.key,
                              drink: item.id,
                            });
                          }}
                        >
                          <span className="drink-copy">
                            <strong>{item.name}</strong>
                            <span className="drink-tags">
                              {[
                                ...(topIds.has(item.id) ? ["必喝 TOP"] : []),
                                ...itemTags(item).filter(
                                  (tag) =>
                                    !topIds.has(item.id) || tag !== "推薦",
                                ),
                              ].map((tag) => (
                                <span
                                  key={tag}
                                  className={
                                    tag === "必喝 TOP" ? "tag top-tag" : "tag"
                                  }
                                >
                                  {tag}
                                </span>
                              ))}
                            </span>
                            {item.note && <small>{item.note}</small>}
                          </span>
                          <span className="drink-action">
                            <span className="drink-price">
                              {visibleCups(store.document, item, region)
                                .map(
                                  (c) =>
                                    `${c.size} ${formatPrice(priceFor(c, region))}`,
                                )
                                .join(" / ") || "選擇溫度查看杯型"}
                            </span>
                            <span className="open-drink">詳細與複製 →</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null;
            })}
        </div>
      ) : (
        <p className="empty-state">
          這個條件沒有飲料，試試其他分類或搜尋字詞。
        </p>
      )}
      {selected && (
        <OrderDialog
          key={selected.id + "-" + region}
          store={store}
          item={selected}
          regionId={region}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
