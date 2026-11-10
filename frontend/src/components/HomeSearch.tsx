"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { KeyboardEvent } from "react";
import type { StoreSummary } from "@/lib/types";
import { track } from "@/lib/analytics";
import { normalizeSearch } from "@/lib/search";

export type DrinkSearchEntry = {
  id: string;
  name: string;
  storeName: string;
  slug: string;
  category: string;
  note?: string;
  logoUrl?: string;
  searchTerms?: string[];
};

function rank(terms: Array<string | undefined>, needle: string) {
  return Math.min(
    99,
    ...terms.map((term) => {
      const value = normalizeSearch(term || "");
      return value === needle
        ? 0
        : value.startsWith(needle)
          ? 1
          : value.includes(needle)
            ? 2
            : 99;
    }),
  );
}

export function HomeSearch({
  stores,
  drinks,
}: {
  stores: StoreSummary[];
  drinks: DrinkSearchEntry[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const results = useMemo(() => {
    const needle = normalizeSearch(activeQuery);
    if (!needle)
      return { stores: stores.slice(0, 80), drinks: [], total: stores.length };
    const foundStores = stores
      .map((store) => ({
        store,
        score: rank(
          [
            store.name,
            ...(store.aliases || []),
            ...(store.searchAliases || []),
            ...(store.zhuyinAliases || []),
          ],
          needle,
        ),
      }))
      .filter((entry) => entry.score < 99)
      .sort((a, b) => a.score - b.score);
    const foundDrinks = drinks
      .map((drink) => {
        const nameScore = rank([drink.name], needle);
        const otherScore = rank(
          [
            drink.storeName,
            drink.category,
            drink.note,
            ...(drink.searchTerms || []),
          ],
          needle,
        );
        return {
          drink,
          score: nameScore < 99 ? nameScore : otherScore < 99 ? 3 : 99,
        };
      })
      .filter((entry) => entry.score < 99)
      .sort((a, b) => a.score - b.score);
    return {
      stores: foundStores.slice(0, 80).map((entry) => entry.store),
      drinks: foundDrinks
        .slice(0, Math.max(0, 80 - foundStores.length))
        .map((entry) => entry.drink),
      total: foundStores.length + foundDrinks.length,
    };
  }, [stores, drinks, activeQuery]);
  const close = () => dialogRef.current?.close();
  const links = () =>
    Array.from(listRef.current?.querySelectorAll<HTMLAnchorElement>("a") || []);
  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || composing.current) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      links()[0]?.focus();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      links()[0]?.click();
    }
  }
  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = links(),
      index = rows.indexOf(document.activeElement as HTMLAnchorElement);
    if (index < 0) return;
    event.preventDefault();
    const next = index + (event.key === "ArrowDown" ? 1 : -1);
    if (next < 0) inputRef.current?.focus();
    else rows[Math.min(next, rows.length - 1)]?.focus();
  }
  return (
    <div className="home-search">
      <button
        type="button"
        className="home-search-trigger"
        onClick={() => {
          dialogRef.current?.showModal();
          inputRef.current?.focus();
        }}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">⌕</span> 搜尋店家或飲料…
      </button>
      <dialog
        ref={dialogRef}
        className="global-search-dialog"
        aria-label="搜尋店家與飲料"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="global-search-shell">
          <div className="global-search-header">
            <label htmlFor="global-search" className="sr-only">
              搜尋店家或飲料
            </label>
            <span aria-hidden="true">⌕</span>
            <input
              id="global-search"
              ref={inputRef}
              type="search"
              placeholder="搜尋店家或飲料…"
              value={query}
              autoComplete="off"
              maxLength={100}
              onChange={(event) => {
                setQuery(event.target.value);
                if (!composing.current) setActiveQuery(event.target.value);
              }}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={(event) => {
                composing.current = false;
                setActiveQuery(event.currentTarget.value);
              }}
              onKeyDown={onInputKeyDown}
            />
            <button
              type="button"
              className="global-search-close"
              onClick={close}
              aria-label="關閉搜尋視窗"
            >
              ×
            </button>
          </div>
          <p className="global-search-status" role="status" aria-live="polite">
            {activeQuery.trim()
              ? results.total
                ? `${results.total} 筆結果${results.total > results.stores.length + results.drinks.length ? `，先顯示 ${results.stores.length + results.drinks.length} 筆，請增加關鍵字縮小範圍` : ""}`
                : "找不到符合的店家或飲料，試試其他關鍵字。"
              : "選擇店家，或輸入想喝的飲料"}
          </p>
          <div
            className="global-search-results"
            ref={listRef}
            onKeyDown={onListKeyDown}
          >
            {!!results.stores.length && (
              <h3>{activeQuery.trim() ? "店家" : "探索店家"}</h3>
            )}
            {results.stores.map((store) => (
              <Link
                className="global-search-result"
                key={store.key}
                href={`/stores/${store.slug}`}
                onClick={() => {
                  track({ type: "search_select", kind: "store" });
                  close();
                }}
              >
                <span className="search-result-logo">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt="" />
                  ) : (
                    store.name.slice(0, 1)
                  )}
                </span>
                <span className="search-result-text">
                  <strong>{store.name}</strong>
                  <small>查看店家菜單</small>
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
            {!!results.drinks.length && <h3>飲料</h3>}
            {results.drinks.map((drink) => (
              <Link
                className="global-search-result"
                key={drink.slug + drink.id}
                href={`/stores/${drink.slug}?focusDrink=${encodeURIComponent(drink.id)}`}
                onClick={() => {
                  track({ type: "search_select", kind: "drink" });
                  close();
                }}
              >
                <span className="search-result-logo">
                  {drink.logoUrl ? (
                    <img src={drink.logoUrl} alt="" />
                  ) : (
                    drink.storeName.slice(0, 1)
                  )}
                </span>
                <span className="search-result-text">
                  <strong>{drink.name}</strong>
                  <small>
                    {drink.storeName} · {drink.category}
                  </small>
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
            {!results.total && (
              <p className="search-empty">
                換個品名、店名，或試試「鮮奶」「拿鐵」。
              </p>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
