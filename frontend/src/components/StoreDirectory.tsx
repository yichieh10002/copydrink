"use client";

import { useEffect, useRef, useState } from "react";
import type { StoreSummary } from "@/lib/types";
import { StoreCard } from "./StoreCard";

const PAGE_SIZE = 12;

export function StoreDirectory({ stores }: { stores: StoreSummary[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);
  const count = Math.min(visible, stores.length);

  useEffect(() => {
    if (count >= stores.length || !sentinel.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((current) => Math.min(current + PAGE_SIZE, stores.length));
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [count, stores.length]);

  return (
    <>
      <div className="store-grid">
        {stores.slice(0, count).map((store) => (
          <StoreCard store={store} key={store.key} />
        ))}
      </div>
      <div className="store-directory-end" ref={sentinel} aria-live="polite">
        {count === stores.length
          ? `已顯示全部 ${stores.length} 個品牌`
          : `已顯示 ${count}／${stores.length} 個品牌`}
        {count < stores.length && (
          <button type="button" onClick={() => setVisible(count + PAGE_SIZE)}>
            顯示更多店家
          </button>
        )}
      </div>
    </>
  );
}
